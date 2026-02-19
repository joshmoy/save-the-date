import { Container, Image, Text, type ContainerProps, type ImageProps, type TextProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

export type HeroImageProps = {
  src: string;
  alt: string;
  caption?: ReactNode;
  containerProps?: Omit<ContainerProps, "children">;
  imageProps?: Omit<ImageProps, "src" | "alt">;
  captionProps?: Omit<TextProps, "children">;
};

export function HeroImage({
  src,
  alt,
  caption,
  containerProps,
  imageProps,
  captionProps,
}: HeroImageProps) {
  return (
    <Container maxW="800px" px="0" mb={8} {...containerProps}>
      <Image
        src={src}
        alt={alt}
        w="full"
        h={{ base: "300px", md: "500px" }}
        objectFit="cover"
        borderRadius={{ base: "0", md: "sm" }}
        {...imageProps}
      />
      {caption ? (
        <Text textAlign="center" fontSize="xs" color="gray.500" mt={2} fontStyle="italic" {...captionProps}>
          {caption}
        </Text>
      ) : null}
    </Container>
  );
}

