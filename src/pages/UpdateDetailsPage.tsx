import { Box, Container, Heading, Text, Image, Button, Flex, Avatar, Separator } from "@chakra-ui/react";
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
    <Box minH="100vh" bg="white">
      {/* Navigation Bar */}
      <Box
        borderBottomWidth="1px"
        borderColor="gray.100"
        py={4}
        position="sticky"
        top="0"
        bg="white"
        zIndex="10"
      >
        <Container maxW="container.xl" px={4}>
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
            <Box w="60px" /> {/* Spacer for centering */}
          </Flex>
        </Container>
      </Box>

      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box maxW="800px" mx="auto">
          {/* Article Header */}
          <Container pt={{ base: 8, md: 12 }} pb={6} px={{ base: "5%", md: 0 }}>
            <Heading
              as="h1"
              fontFamily="subheading"
              fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
              fontWeight="700"
              color="gray.900"
              lineHeight="1.2"
              mb={4}
            >
              {update.title}
            </Heading>

            <Text fontSize={{ base: "lg", md: "xl" }} color="gray.500" lineHeight="tall" mb={6}>
              {update.summary}
            </Text>

            {/* Author/Date Meta */}
            <Flex align="center" gap={3}>
              <Avatar.Root size="sm">
                <Avatar.Fallback name="Adeola Joshua" bg="burgundy" color="white" />
                <Avatar.Image src="/7V2A8743.jpg" objectFit="cover" />
              </Avatar.Root>
              <Box>
                <Text fontWeight="bold" fontSize="xs" color="gray.900">
                  Adeola & Joshua
                </Text>
                <Flex align="center" gap={1} fontSize="xs" color="gray.500">
                  <Text>
                    {new Date(update.date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                  <Text>·</Text>
                  <Text>2 min read</Text>
                </Flex>
              </Box>
            </Flex>
          </Container>

          {/* Hero Image */}
          <Container maxW="800px" px="0" mb={8}>
            <Image
              src={update.image}
              alt={update.title}
              w="full"
              h={{ base: "300px", md: "500px" }}
              objectFit="cover"
              borderRadius={{ base: "0", md: "sm" }}
            />
            <Text textAlign="center" fontSize="xs" color="gray.500" mt={2} fontStyle="italic">
              {update.title}
            </Text>
          </Container>

          {/* Article Content */}
          <Container maxW="600px" pb={20} px={{ base: "5%", md: 0 }} mx="auto">
            <Text
              fontFamily="body"
              fontSize={{ base: "lg", md: "xl" }}
              lineHeight="1.8"
              color="gray.800"
              letterSpacing="wide"
              css={{
                "&::first-letter": {
                  fontSize: "300%",
                  fontWeight: "bold",
                  float: "left",
                  lineHeight: "0.8",
                  mr: 2,
                  mt: 1,
                  fontFamily: "subheading",
                  color: "burgundy",
                },
              }}
            >
              {update.details}
            </Text>

            <Separator my={10} />

            {/* Footer/Tags area */}
            <Flex gap={2} mb={10} flexWrap="wrap">
              <Box bg="gray.100" px={3} py={1} borderRadius="full" fontSize="xs" color="gray.600">
                Wedding
              </Box>
              <Box bg="gray.100" px={3} py={1} borderRadius="full" fontSize="xs" color="gray.600">
                Updates
              </Box>
              <Box bg="gray.100" px={3} py={1} borderRadius="full" fontSize="xs" color="gray.600">
                2026
              </Box>
            </Flex>
          </Container>
        </Box>
      </MotionBox>
    </Box>
  );
}
