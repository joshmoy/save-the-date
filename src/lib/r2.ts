import "server-only";

import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { unstable_cache } from "next/cache";
import { mediaCategories, type MediaCategorySlug } from "../data/mediaCategories";
import type { MediaItem } from "../data/media";

export const MAX_R2_UPLOAD_BYTES = 5 * 1024 * 1024 * 1024;

export function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

export function createR2Client(config: NonNullable<ReturnType<typeof getR2Config>>) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export function getR2VideoPrefix(slug: MediaCategorySlug) {
  return `wedding/media/${slug}/videos/`;
}

export function sanitizeVideoFilename(filename: string) {
  const extension = filename.toLowerCase().endsWith(".mp4") ? ".mp4" : "";
  const basename = filename
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .toLowerCase();

  return basename && extension ? `${basename}${extension}` : null;
}

function humanizeFilename(filename: string) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getPublicObjectUrl(publicUrl: string, key: string, version?: number) {
  const url = `${publicUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
  return version ? `${url}?v=${version}` : url;
}

async function listCategoryVideos(
  category: (typeof mediaCategories)[number],
  config: NonNullable<ReturnType<typeof getR2Config>>,
  client: S3Client,
) {
  if (!category.hasVideos) return [];

  const prefix = getR2VideoPrefix(category.slug);
  const items: MediaItem[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    for (const object of response.Contents ?? []) {
      if (!object.Key || !object.Key.toLowerCase().endsWith(".mp4") || object.Size === 0) continue;

      const filename = object.Key.slice(prefix.length);
      if (!filename || filename.includes("/")) continue;

      items.push({
        id: object.Key,
        title: humanizeFilename(filename),
        description: category.description,
        event: category.title,
        date: object.LastModified?.getFullYear().toString() ?? "",
        type: "video",
        src: getPublicObjectUrl(config.publicUrl, object.Key, object.LastModified?.getTime()),
        aspect: "landscape",
      });
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return items.sort((left, right) => left.title.localeCompare(right.title));
}

async function loadR2VideoCollections() {
  const config = getR2Config();

  if (!config) {
    return mediaCategories.map((category) => ({ slug: category.slug, videos: [] }));
  }

  const client = createR2Client(config);

  return Promise.all(
    mediaCategories.map(async (category) => {
      try {
        return {
          slug: category.slug,
          videos: await listCategoryVideos(category, config, client),
        };
      } catch (error) {
        console.error(`Unable to load R2 videos for ${category.title}:`, error);
        return { slug: category.slug, videos: [] };
      }
    }),
  );
}

export const getR2VideoCollections = unstable_cache(
  loadR2VideoCollections,
  ["r2-video-collections-v1"],
  { tags: ["r2-media"] },
);
