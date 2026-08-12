export type MediaItem = {
  id: string;
  title: string;
  description: string;
  event: string;
  date: string;
  type: "image" | "video";
  src: string;
  poster?: string;
  aspect: "landscape" | "portrait";
};

export const mediaItems: MediaItem[] = [
  {
    id: "our-beginning",
    title: "Our Beginning",
    description: "The moment that started our journey to forever.",
    event: "Our Story",
    date: "2025",
    type: "image",
    src: "/7V2A8743.jpg",
    aspect: "landscape",
  },
  {
    id: "save-the-date",
    title: "Save the Date",
    description: "The first look at our wedding celebration.",
    event: "Wedding Details",
    date: "August 2026",
    type: "image",
    src: "/invitation.jpg",
    aspect: "portrait",
  },
  {
    id: "grooms-jersey",
    title: "Joshua's Jersey",
    description: "A closer look at the groom's celebration jersey.",
    event: "Wedding Details",
    date: "2026",
    type: "image",
    src: "/jersey1.jpg",
    aspect: "landscape",
  },
  {
    id: "brides-jersey",
    title: "Adeola's Jersey",
    description: "A closer look at the bride's celebration jersey.",
    event: "Wedding Details",
    date: "2026",
    type: "image",
    src: "/jersey2.jpg",
    aspect: "landscape",
  },
];

export const mediaCollections = [
  {
    title: "Featured memories",
    items: mediaItems,
  },
  {
    title: "The wedding details",
    items: mediaItems.filter((item) => item.event === "Wedding Details"),
  },
];
