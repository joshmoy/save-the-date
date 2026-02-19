import { Box, Container, Text, type BoxProps, type ContainerProps, type TextProps } from "@chakra-ui/react";
import type { CSSProperties, IframeHTMLAttributes, ReactNode, VideoHTMLAttributes } from "react";

function getEmbedUrl(src: string): string | null {
  const trimmed = src.trim();

  // Google Drive
  // - https://drive.google.com/file/d/FILE_ID/view?...
  // - https://drive.google.com/open?id=FILE_ID
  // - https://drive.google.com/uc?id=FILE_ID&...
  if (trimmed.includes("drive.google.com")) {
    const id =
      trimmed.match(/\/file\/d\/([^/]+)/)?.[1] ??
      trimmed.match(/[?&]id=([^&]+)/)?.[1] ??
      trimmed.match(/\/d\/([^/]+)/)?.[1];
    return id ? `https://drive.google.com/file/d/${id}/preview` : null;
  }

  // YouTube
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) {
    const id =
      trimmed.match(/[?&]v=([^&]+)/)?.[1] ??
      trimmed.match(/youtu\.be\/([^?&/]+)/)?.[1] ??
      trimmed.match(/\/embed\/([^?&/]+)/)?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  // Vimeo
  // - https://vimeo.com/123456789
  if (trimmed.includes("vimeo.com")) {
    const id = trimmed.match(/vimeo\.com\/(\d+)/)?.[1] ?? trimmed.match(/player\.vimeo\.com\/video\/(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }

  return null;
}

export type HeroVideoProps = {
  src: string;
  caption?: ReactNode;
  containerProps?: Omit<ContainerProps, "children">;
  mediaWrapperProps?: BoxProps;
  videoProps?: Omit<VideoHTMLAttributes<HTMLVideoElement>, "src">;
  iframeProps?: Omit<IframeHTMLAttributes<HTMLIFrameElement>, "src" | "title">;
  captionProps?: Omit<TextProps, "children">;
};

export function HeroVideo({
  src,
  caption,
  containerProps,
  mediaWrapperProps,
  videoProps,
  iframeProps,
  captionProps,
}: HeroVideoProps) {
  const embedUrl = getEmbedUrl(src);

  const sharedMediaStyle: CSSProperties = {
    width: "100%",
    height: "100%",
  };

  return (
    <Container maxW="800px" px="0" mb={8} {...containerProps}>
      <Box
        w="full"
        h={{ base: "300px", md: "500px" }}
        borderRadius={{ base: "0", md: "sm" }}
        overflow="hidden"
        {...mediaWrapperProps}
      >
        {embedUrl ? (
          <iframe
            title="Video"
            src={embedUrl}
            style={{
              ...sharedMediaStyle,
              border: 0,
              ...(iframeProps?.style ?? {}),
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            {...iframeProps}
          />
        ) : (
          <video
            src={src}
            style={{
              ...sharedMediaStyle,
              objectFit: "cover",
              ...(videoProps?.style ?? {}),
            }}
            controls
            playsInline
            preload="metadata"
            {...videoProps}
          />
        )}
      </Box>

      {caption ? (
        <Text textAlign="center" fontSize="xs" color="gray.500" mt={2} fontStyle="italic" {...captionProps}>
          {caption}
        </Text>
      ) : null}
    </Container>
  );
}

