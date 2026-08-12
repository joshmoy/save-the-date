import type { Metadata } from "next";
import MediaPage from "../../src/views/MediaPage";
import {
  getCloudinaryFeaturedImages,
  getCloudinaryMediaCollections,
} from "../../src/lib/cloudinaryMedia";
import { getR2VideoCollections } from "../../src/lib/r2";

export const metadata: Metadata = {
  title: "Our Media | Adeola & Joshua",
  description: "Photos and videos from Adeola and Joshua's journey and wedding celebrations.",
};

export default async function MediaRoute() {
  const [imageCollections, videoCollections, featuredImages] = await Promise.all([
    getCloudinaryMediaCollections(),
    getR2VideoCollections(),
    getCloudinaryFeaturedImages(),
  ]);
  const collections = imageCollections.map((collection) => ({
    ...collection,
    videos:
      videoCollections.find((videoCollection) => videoCollection.slug === collection.slug)
        ?.videos ?? [],
  }));

  return <MediaPage collections={collections} featuredImages={featuredImages} />;
}
