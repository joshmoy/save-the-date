import { Box, Container, Separator, Text } from "@chakra-ui/react";
import { updates } from "../data/updates";
import { useLocation } from "react-router-dom";
import { TagPills } from "../components/TagPills";
import { StickyNavBar } from "../components/StickyNavBar";
import { UpdateArticleHeader } from "../components/UpdateArticleHeader";
import { HeroImage } from "../components/HeroImage";
import { MotionBox } from "../components/MotionBox";
import { UpdateNotFound } from "../components/UpdateNotFound";

const VenueSelectedPage = () => {
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
              The wedding ceremony will be held at CAC Olurunsogo, Mushin, Lagos.
            </Text>
            <Box>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.9404564228516!2d3.346440073181101!3d6.529204893463452!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b8dc5076647b3%3A0x4aab69808d4104d1!2sCAC%20Olorunsogo%20Assembly!5e0!3m2!1sen!2suk!4v1771425946479!5m2!1sen!2suk"
                width="600"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </Box>

            <Text
              fontFamily="body"
              fontSize={{ base: "lg", md: "xl" }}
              lineHeight="1.8"
              color="gray.800"
              letterSpacing="wide"
              my="20px"
            >
              The reception will be held at Sheba Center, Maryland, Lagos.
            </Text>
            <Box>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.527357987265!2d3.360846172458258!3d6.58116959959122!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b927286444557%3A0xc422d41b44a3c5f6!2sSheba%20Centre!5e0!3m2!1sen!2suk!4v1771425744899!5m2!1sen!2suk"
                width="600"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </Box>
            <Separator my={10} />
            <TagPills tags={["Wedding", "Updates", "2026", "Venue"]} mb={10} />
          </Container>
        </Box>
      </MotionBox>
    </Box>
  );
};

export default VenueSelectedPage;
