"use client";

import { Box, Container, Text, Separator } from "@chakra-ui/react";
import { useParams } from "next/navigation";
import { updates } from "../data/updates";
import { TagPills } from "../components/TagPills";
import { StickyNavBar } from "../components/StickyNavBar";
import { UpdateArticleHeader } from "../components/UpdateArticleHeader";
import { HeroImage } from "../components/HeroImage";
import { MotionBox } from "../components/MotionBox";
import { UpdateNotFound } from "../components/UpdateNotFound";

export default function UpdateDetailsPage() {
  const { id } = useParams();
  const update = updates.find((u) => u.id === id);

  if (!update) {
    return <UpdateNotFound />;
  }

  return (
    <Box minH="100vh" bg="white">
      {/* Navigation Bar */}
      <StickyNavBar />

      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box maxW="800px" mx="auto">
          {/* Article Header */}
          <UpdateArticleHeader title={update.title} summary={update.summary} date={update.date} />

          {/* Hero Image */}
          <HeroImage src={update.image} alt={update.title} caption={update.title} />

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
            <TagPills tags={["Wedding", "Updates", "2026"]} mb={10} />
          </Container>
        </Box>
      </MotionBox>
    </Box>
  );
}
