import type { Metadata } from "next";
import MediaPage from "../../src/views/MediaPage";
import { getCloudinaryMediaCollections } from "../../src/lib/cloudinaryMedia";

export const metadata: Metadata = {
  title: "Our Media | Adeola & Joshua",
  description: "Photos from Adeola and Joshua's journey and wedding celebrations.",
};

export const revalidate = 300;

export default async function MediaRoute() {
  const collections = await getCloudinaryMediaCollections();

  return <MediaPage collections={collections} />;
}
