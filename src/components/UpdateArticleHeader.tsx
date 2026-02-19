import { Avatar, Box, Container, Flex, Heading, Text, type ContainerProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

export type UpdateArticleHeaderProps = {
  title: ReactNode;
  summary: ReactNode;
  date: string | Date;
  containerProps?: Omit<ContainerProps, "children">;
  authorName?: string;
  avatarFallbackName?: string;
  avatarSrc?: string;
  readTimeLabel?: string;
};

export function UpdateArticleHeader({
  title,
  summary,
  date,
  containerProps,
  authorName = "Adeola & Joshua",
  avatarFallbackName = "Adeola Joshua",
  avatarSrc = "/7V2A8743.jpg",
  readTimeLabel = "2 min read",
}: UpdateArticleHeaderProps) {
  const parsedDate = date instanceof Date ? date : new Date(date);
  const dateLabel = parsedDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Container pt={{ base: 8, md: 12 }} pb={6} px={{ base: "5%", md: 0 }} {...containerProps}>
      <Heading
        as="h1"
        fontFamily="subheading"
        fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
        fontWeight="700"
        color="gray.900"
        lineHeight="1.2"
        mb={4}
      >
        {title}
      </Heading>

      <Text fontSize={{ base: "lg", md: "xl" }} color="gray.500" lineHeight="tall" mb={6}>
        {summary}
      </Text>

      <Flex align="center" gap={3}>
        <Avatar.Root size="sm">
          <Avatar.Fallback name={avatarFallbackName} bg="burgundy" color="white" />
          <Avatar.Image src={avatarSrc} objectFit="cover" />
        </Avatar.Root>
        <Box>
          <Text fontWeight="bold" fontSize="xs" color="gray.900">
            {authorName}
          </Text>
          <Flex align="center" gap={1} fontSize="xs" color="gray.500">
            <Text>{dateLabel}</Text>
            <Text>·</Text>
            <Text>{readTimeLabel}</Text>
          </Flex>
        </Box>
      </Flex>
    </Container>
  );
}

