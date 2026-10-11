export const mediaCategories = [
  {
    slug: "engagement",
    title: "Engagement",
    description: "Our engagement memories.",
    hasPhotos: true,
    hasVideos: true,
  },
  {
    slug: "pre-wedding",
    title: "Pre-Wedding",
    description: "Our pre-wedding portraits.",
    hasPhotos: true,
    hasVideos: false,
  },
  {
    slug: "traditional-marriage",
    title: "Traditional Marriage",
    description: "Celebrating our families and traditions.",
    hasPhotos: true,
    hasVideos: true,
  },
  {
    slug: "civil-wedding",
    title: "Civil Wedding",
    description: "Our civil wedding ceremony.",
    hasPhotos: true,
    hasVideos: false,
  },
  {
    slug: "church-wedding",
    title: "Church Wedding",
    description: "Our church wedding ceremony.",
    hasPhotos: true,
    hasVideos: true,
  },
  {
    slug: "wedding-reception",
    title: "Wedding Reception",
    description: "Celebrating with our family and friends.",
    hasPhotos: true,
    hasVideos: true,
  },
] as const;

export type MediaCategorySlug = (typeof mediaCategories)[number]["slug"];

export function getMediaCategory(slug: string) {
  return mediaCategories.find((category) => category.slug === slug);
}

export function getCloudinaryImageFolder(slug: MediaCategorySlug) {
  return `wedding/media/${slug}/photos`;
}
