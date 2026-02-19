import { UpdateNotFound } from "../components/UpdateNotFound";
import { useLocation } from "react-router-dom";
import { updates } from "../data/updates";
import { Box, Container, Separator, Text } from "@chakra-ui/react";
import { MotionBox } from "../components/MotionBox";
import { TagPills } from "../components/TagPills";
import { StickyNavBar } from "../components/StickyNavBar";
import { UpdateArticleHeader } from "../components/UpdateArticleHeader";
import { HeroImage } from "../components/HeroImage";

const GiftingPage = () => {
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
          <HeroImage src={update.image} alt={update.title} caption={update.title} />

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

            <Text
              fontFamily="body"
              fontSize={{ base: "lg", md: "xl" }}
              lineHeight="1.8"
              color="gray.800"
              letterSpacing="wide"
              my="20px"
            >
              Anu has personally told us she has some stack of USD and GBP ready to go. Sliim has been stacking up crisp naira notes.
              Addempsea does not like spraying anything less than 1k naira notes, and Funmi has been looking forward to another reason to spend all that plenty money.
              Anyways, that's enough name-calling, because we don't want to cast our rich ogas and madams like Emeka Malay, Soluchi, Bolaji, Kemi, Taiye Taiwo, Kolly D,
              Kemi, Pauleecy, Ife, Real Shegz, Kanny, Monster, investor Mide (importer, exporter). Send funds if you want King Kong in that after party.
            </Text>

            <Separator my={10} />
            <TagPills tags={["Wedding", "Updates", "2026", "Gifting", "Sinzu Money"]} mb={10} />
          </Container>
        </Box>
      </MotionBox>
    </Box>
  );
};

export default GiftingPage;
