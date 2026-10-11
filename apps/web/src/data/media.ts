export type MediaItem = {
  id: string;
  title: string;
  description: string;
  event: string;
  date: string;
  type: "image" | "video";
  src: string;
  heroSrc?: string;
  thumbnail?: string;
  poster?: string;
  aspect: "landscape" | "portrait";
};

export type MediaCollection = {
  slug: string;
  title: string;
  description: string;
  hasVideos: boolean;
  items: MediaItem[];
  videos: MediaItem[];
};
