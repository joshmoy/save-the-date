import type { Metadata } from "next";
import MediaPage from "../../src/views/MediaPage";
import { getCloudinaryMediaCollections } from "../../src/lib/cloudinaryMedia";
import { getR2VideoCollections } from "../../src/lib/r2";

export const metadata: Metadata = {
  title: "Our Media | Adeola & Joshua",
  description: "Photos and videos from Adeola and Joshua's journey and wedding celebrations.",
};

export default async function MediaRoute() {
  const [imageCollections, videoCollections] = await Promise.all([
    getCloudinaryMediaCollections(),
    getR2VideoCollections(),
  ]);
  const videosBySlug = new Map(
    videoCollections.map((collection) => [collection.slug, collection.videos]),
  );
  const collections = imageCollections.map((collection) => ({
    ...collection,
    videos: videosBySlug.get(collection.slug) ?? [],
  }));

  return <MediaPage collections={collections} />;
}
