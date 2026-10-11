"use client";

import {
  Box,
  Button,
  Container,
  Flex,
  Text,
  Link,
  type BoxProps,
  type ContainerProps,
} from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export type StickyNavBarProps = Omit<BoxProps, "children"> & {
  containerProps?: Omit<ContainerProps, "children">;
};

export function StickyNavBar({ containerProps, ...boxProps }: StickyNavBarProps) {
  const router = useRouter();

  return (
    <Box
      borderBottomWidth="1px"
      borderColor="gray.100"
      py={4}
      position="sticky"
      top="0"
      bg="white"
      zIndex="10"
      {...boxProps}
    >
      <Container maxW="full" px={4} {...containerProps}>
        <Flex justify="space-between" align="center">
          <Button
            variant="ghost"
            color="gray.600"
            onClick={() => router.push("/updates")}
            size="sm"
            px={4}
          >
            <ArrowLeft size={20} /> Back to Updates
          </Button>

          <Link href="/" _hover={{ textDecoration: "none" }} _focus={{ outline: "none" }}>
            <Text fontFamily="heading" fontSize="2xl" color="burgundy">
              Adeola & Joshua
            </Text>
          </Link>

          <Box w="60px" display={{ base: "none", md: "block" }} />
        </Flex>
      </Container>
    </Box>
  );
}
