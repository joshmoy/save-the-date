import { Box, Flex, type BoxProps, type FlexProps } from "@chakra-ui/react";

export type TagPillsProps = Omit<FlexProps, "children"> & {
  tags: string[];
  pillProps?: BoxProps;
};

export function TagPills({ tags, pillProps, ...flexProps }: TagPillsProps) {
  return (
    <Flex gap={2} flexWrap="wrap" {...flexProps}>
      {tags.map((tag, index) => (
        <Box
          key={`${tag}-${index}`}
          bg="gray.100"
          px={3}
          py={1}
          borderRadius="full"
          fontSize="xs"
          color="gray.600"
          {...pillProps}
        >
          {tag}
        </Box>
      ))}
    </Flex>
  );
}

