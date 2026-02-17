import { Box, Container, Heading, Text, Image, Button, VStack } from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { updates } from "../data/updates";
import { motion } from "framer-motion";

const MotionBox = motion.create(Box);

export default function UpdateDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const update = updates.find((u) => u.id === id);

  if (!update) {
    return (
      <Container centerContent p={10}>
        <Heading>Update not found</Heading>
        <Button mt={4} onClick={() => navigate("/updates")}>
          Back to Updates
        </Button>
      </Container>
    );
  }

  return (
    <Box minH="100vh" bg="rose.50">
      <Container maxW="container.md" py={8}>
        <Button
          leftIcon={<ArrowLeft />}
          variant="ghost"
          mb={6}
          onClick={() => navigate("/updates")}
        >
          Back to Updates
        </Button>

        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src={update.image}
            alt={update.title}
            borderRadius="lg"
            w="full"
            h={{ base: "300px", md: "400px" }}
            objectFit="cover"
            mb={8}
            boxShadow="lg"
          />

          <VStack align="start" spacing={4}>
            <Text color="gray.500" fontSize="sm">
              {new Date(update.date).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
            <Heading as="h1" size="2xl" color="burgundy">
              {update.title}
            </Heading>
            <Text fontSize="xl" fontWeight="medium" color="gray.700">
              {update.summary}
            </Text>
            <Text fontSize="lg" lineHeight="tall" color="gray.600">
              {update.details}
            </Text>
          </VStack>
        </MotionBox>
      </Container>
    </Box>
  );
}
