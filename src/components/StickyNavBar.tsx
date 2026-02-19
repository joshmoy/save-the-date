import { Box, Button, Container, Flex, Text, type BoxProps, type ContainerProps } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type StickyNavBarProps = Omit<BoxProps, "children"> & {
  containerProps?: Omit<ContainerProps, "children">;
};

export function StickyNavBar({
  containerProps,
  ...boxProps
}: StickyNavBarProps) {
  const navigate = useNavigate();

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
            onClick={() => navigate("/updates")}
            size="sm"
            px={4}
          >
            <ArrowLeft size={20} /> Back to Updates
          </Button>

          <Text fontFamily="heading" fontSize="2xl" color="burgundy">
            Adeola & Joshua
          </Text>

          <Box w="60px" display={{ base: "none", md: "block" }}/>
        </Flex>
      </Container>
    </Box>
  );
}

