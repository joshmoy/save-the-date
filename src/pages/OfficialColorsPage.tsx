import { useLocation } from "react-router-dom";
import { updates } from "../data/updates";
import { UpdateNotFound } from "../components/UpdateNotFound";
import { StickyNavBar } from "../components/StickyNavBar";
import { MotionBox } from "../components/MotionBox";
import { UpdateArticleHeader } from "../components/UpdateArticleHeader";
import { HeroImage } from "../components/HeroImage";
import { Text, Box, Separator, Container, Flex } from "@chakra-ui/react";
import { TagPills } from "../components/TagPills";

const OfficialColorsPage = () => {
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
              For the wedding ceremony, Adeola will be wearing a beautiful white dress and Joshua
              will be wearing a light blue suit. The bridal train will be in stunning pink dresses
              and the groom's men will be in navy blue suits. Find the color guide below so you
              don't 'miss' anything.
            </Text>

            <Flex>
              <Flex bg="burgundy" w='16.6%' h="150px" p={2}>
                <Text color="white" fontSize="sm" fontWeight="bold" wordBreak="break-word">
                  Burgundy
                </Text>
              </Flex>
              <Flex bg="#cc7a8b" w='16.6%' h="150px" p={2}>
                <Text color="white" fontSize="sm" fontWeight="bold">
                  Dusky Pink
                </Text>
              </Flex>
              <Flex bg="pink" w='16.6%' h="150px" p={2}>
                <Text color="white" fontSize="sm" fontWeight="bold">
                  Pink
                </Text>
              </Flex>
              <Flex bg="#000080" w='16.6%' h="150px" p={2}>
                <Text color="white" fontSize="sm" fontWeight="bold">
                  Navy Blue
                </Text>
              </Flex>
              <Flex bg="#4169e1" w='16.6%' h="150px" p={2}>
                <Text color="white" fontSize="sm" fontWeight="bold">
                  Light Blue
                </Text>
              </Flex>
              <Flex bg="white" w='16.6%' h="150px" p={2}>
                <Text color="black" fontSize="sm" fontWeight="bold">
                  White
                </Text>
              </Flex>
            </Flex>

            <Text
              fontFamily="body"
              fontSize={{ base: "lg", md: "xl" }}
              lineHeight="1.8"
              color="gray.800"
              letterSpacing="wide"
              my="20px"
            >
              Covenant also designed a jersey for the event (after party or whenever we decide to
              rock it).
            </Text>
            <Flex flexDirection={{ base: "column", md: "row" }}>
              <Flex bgImage="url(/jersey2.jpg)" bgSize="cover" w={{ base: "100%", md: "50%" }} h="250px" p={2}></Flex>
              <Flex bgImage="url(/jersey1.jpg)" bgSize="cover" w={{ base: "100%", md: "50%" }} h="250px" p={2}></Flex>
            </Flex>

            <Separator my={10} />
            <TagPills tags={["Wedding", "Updates", "2026", "Colors"]} mb={10} />
          </Container>
        </Box>
      </MotionBox>
    </Box>
  );
};

export default OfficialColorsPage;
