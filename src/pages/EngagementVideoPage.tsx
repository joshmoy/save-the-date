import { useLocation } from "react-router-dom";
import { updates } from "../data/updates";
import { UpdateNotFound } from "../components/UpdateNotFound";
import { Box, Container, Separator, Text } from "@chakra-ui/react";
import { MotionBox } from "../components/MotionBox";
import { TagPills } from "../components/TagPills";
import { StickyNavBar } from "../components/StickyNavBar";
import { UpdateArticleHeader } from "../components/UpdateArticleHeader";
import { HeroVideo } from "../components/HeroVideo";

const EngagementVideoPage = () => {
  const location = useLocation();
  const update = updates.find((u) => u.pageRoute === location.pathname);

  if (!update) {
    return <UpdateNotFound />;
  }
  return (
    <Box minH="100vh" bg="#F7FAFC">
      <StickyNavBar />
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box maxW="800px" mx="auto">
          <UpdateArticleHeader title={update.title} summary={update.summary} date={update.date} />

          <HeroVideo
            src={
              "https://drive.google.com/file/d/1-SBZTrN-5RU4jC5o1cq1Pje4xj8N1Jj8/view?usp=sharing"
            }
            caption={update.title}
          />

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
            <TagPills tags={["Wedding", "Updates", "2026", "Engagement", "Video"]} mb={10} />
          </Container>
        </Box>
      </MotionBox>
    </Box>
  );
};

export default EngagementVideoPage;
