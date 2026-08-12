import "server-only";

import { unstable_cache } from "next/cache";
import {
  getCloudinaryImageFolder,
  mediaCategories,
} from "../data/mediaCategories";
import type { MediaCollection, MediaItem } from "../data/media";

type CloudinaryResource = {
  asset_id: string;
  public_id: string;
  secure_url: string;
  display_name?: string;
  filename?: string;
  format?: string;
  width?: number;
  height?: number;
  created_at?: string;
};

type CloudinarySearchResponse = {
  resources?: CloudinaryResource[];
  next_cursor?: string;
  error?: { message?: string };
};

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

function addTransformation(url: string, transformation: string) {
  return url.replace("/upload/", `/upload/${transformation}/`);
}

function humanizeFilename(value: string) {
  return value
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function mapResource(
  resource: CloudinaryResource,
  category: (typeof mediaCategories)[number],
): MediaItem {
  const fallbackName = resource.public_id.split("/").pop() ?? resource.public_id;
  const sourceName = resource.display_name || resource.filename || fallbackName;
  const createdYear = resource.created_at
    ? new Date(resource.created_at).getFullYear().toString()
    : "";

  return {
    id: resource.asset_id,
    title: humanizeFilename(sourceName),
    description: category.description,
    event: category.title,
    date: createdYear,
    type: "image",
    src: addTransformation(resource.secure_url, "f_auto,q_auto,c_limit,w_2400"),
    thumbnail: addTransformation(
      resource.secure_url,
      "f_auto,q_auto:eco,c_fill,g_auto,w_900,h_560",
    ),
    aspect:
      resource.width && resource.height && resource.height > resource.width
        ? "portrait"
        : "landscape",
  };
}

async function searchFolder(
  category: (typeof mediaCategories)[number],
  config: NonNullable<ReturnType<typeof getCloudinaryConfig>>,
) {
  const resources: CloudinaryResource[] = [];
  let nextCursor: string | undefined;

  do {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/resources/search`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expression: `asset_folder="${getCloudinaryImageFolder(category.slug)}"`,
          max_results: 500,
          next_cursor: nextCursor,
          sort_by: [{ created_at: "desc" }],
        }),
      },
    );
    const result = (await response.json().catch(() => null)) as CloudinarySearchResponse | null;

    if (!response.ok) {
      throw new Error(
        result?.error?.message ||
          `Cloudinary returned ${response.status} while loading ${category.title}.`,
      );
    }

    resources.push(...(result?.resources ?? []));
    nextCursor = result?.next_cursor;
  } while (nextCursor);

  return resources.map((resource) => mapResource(resource, category));
}

async function loadCloudinaryMediaCollections(): Promise<MediaCollection[]> {
  const config = getCloudinaryConfig();

  if (!config) {
    return mediaCategories.map((category) => ({
      slug: category.slug,
      title: category.title,
      description: category.description,
      items: [],
    }));
  }

  return Promise.all(
    mediaCategories.map(async (category) => {
      try {
        return {
          slug: category.slug,
          title: category.title,
          description: category.description,
          items: await searchFolder(category, config),
        };
      } catch (error) {
        console.error(`Unable to load Cloudinary folder for ${category.title}:`, error);
        return {
          slug: category.slug,
          title: category.title,
          description: category.description,
          items: [],
        };
      }
    }),
  );
}

export const getCloudinaryMediaCollections = unstable_cache(
  loadCloudinaryMediaCollections,
  ["cloudinary-media-collections-v1"],
  { tags: ["cloudinary-media"] },
);
