import { Box, Container, Flex, Heading, Text, Image } from "@chakra-ui/react"
import { motion } from "framer-motion"

const MotionBox = motion.create(Box)
const MotionFlex = motion.create(Flex)
const MotionHeading = motion.create(Heading)
const MotionText = motion.create(Text)

function App() {
  return (
    <Box w="100vw" minH="100vh" overflow="hidden" position="relative">
      {/* Background image */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bgImage="url(/7V2A8743.jpg)"
        bgSize="cover"
        backgroundPosition="center"
        bgRepeat="no-repeat"
      />

      {/* Overlay for readability */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="linear-gradient(to bottom, rgba(255, 248, 240, 0.95), rgba(255, 248, 240, 0.92), rgba(255, 248, 240, 0.95))"
      />

      {/* Elegant background pattern */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        opacity={0.02}
        bgImage="radial-gradient(circle, #800020 1px, transparent 1px)"
        bgSize="30px 30px"
      />

      {/* Decorative corner flourishes */}
      <MotionBox
        position="absolute"
        top="0"
        left="0"
        w="200px"
        h="200px"
        initial={{ opacity: 0, rotate: -20 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      >
        <Image
          src="https://pixabay.com/get/gf78af5586be2c5a6561a56a6c7a640963eaec113abe23b59c2bcfd9f687f54cc571f8bbfdcf8be31455791f0bb8f92ef.svg"
          alt="flowers, circle, frame, boundary, floral frame, flower border, rose by PhuongLucky on Pixabay"
          width="200px"
          height="200px"
          opacity={0.4}
          transform="scale(-1, 1)"
        />
      </MotionBox>

      <MotionBox
        position="absolute"
        bottom="0"
        right="0"
        w="200px"
        h="200px"
        initial={{ opacity: 0, rotate: 20 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 1.5, delay: 0.7 }}
      >
        <Image
          src="https://pixabay.com/get/gf78af5586be2c5a6561a56a6c7a640963eaec113abe23b59c2bcfd9f687f54cc571f8bbfdcf8be31455791f0bb8f92ef.svg"
          alt="flowers, circle, frame, boundary, floral frame, flower border, rose by PhuongLucky on Pixabay"
          width="200px"
          height="200px"
          opacity={0.4}
          transform="rotate(180deg)"
        />
      </MotionBox>

      {/* Main content */}
      <Container h="100vh" display="flex" alignItems="center" position="relative" zIndex={1} w="full">
        {/* Hero section */}
        <Flex direction='column' w="full" h="full" pt="100px">
          <MotionFlex
            direction="column"
            align="center"
            textAlign="center"
            gap={5}
            w="full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Main content */}
            <MotionBox
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <Text textStyle="accent" color="burgundy" letterSpacing="widest" mb={3} fontSize="xs">
                Save The Date
              </Text>

              {/* Names with dramatic styling */}
              <MotionHeading
                fontFamily="heading"
                fontSize={{ base: "6xl", md: "8xl", lg: "9xl" }}
                color="burgundy"
                fontWeight="400"
                mb={2}
                lineHeight='normal'
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 0.8,
                  delay: 0.5,
                  type: "spring",
                }}
              >
                Adeola & Joshua
              </MotionHeading>

              <MotionBox
                h="2px"
                w="150px"
                bg="roseWine"
                mx="auto"
                mb={4}
                initial={{ width: 0 }}
                animate={{ width: "150px" }}
                transition={{ duration: 1, delay: 0.8 }}
              />

              <MotionText
                fontFamily="subheading"
                fontSize={{ base: "xl", md: "2xl" }}
                color="textPrimary"
                fontStyle="italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                are getting married
              </MotionText>
            </MotionBox>

            {/* Geometric frame with date */}
            <MotionBox
              mt={6}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 1.2 }}
            >
              <Box
                position="relative"
                p={9}
                _before={{
                  content: '""',
                  position: "absolute",
                  top: "0",
                  left: "0",
                  right: "0",
                  bottom: "0",
                  borderWidth: "3px",
                  borderColor: "roseGold",
                  transform: "rotate(45deg)",
                }}
                _after={{
                  content: '""',
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  right: "10px",
                  bottom: "10px",
                  borderWidth: "1px",
                  borderColor: "oldRose",
                  transform: "rotate(45deg)",
                }}
              >
                <Box position="relative" zIndex={1}>
                  <Text
                    fontFamily="subheading"
                    fontSize="5xl"
                    fontWeight="700"
                    color="burgundy"
                    lineHeight="1"
                    mb={1}
                  >
                    1st
                  </Text>
                  <Text textStyle="accent" color="cherryRose" fontSize="sm" mb={1}>
                    AUGUST
                  </Text>
                  <Text fontFamily="body" fontSize="xl" color="textPrimary" fontWeight="400">
                    2026
                  </Text>
                </Box>
              </Box>
            </MotionBox>
          </MotionFlex>

          {/* Bottom message with floral decoration */}
          <MotionBox
            mt={6}
            textAlign="center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.8 }}
          >
            <MotionBox display="inline-block" position="relative" px={{ base: 6, md: 12 }} py={6}>
              <Box
                h="1px"
                w="100%"
                bg="linear-gradient(to right, transparent, #CC8899, transparent)"
                mb={4}
              />

              <Heading
                fontFamily="subheading"
                fontSize={{ base: "xl", md: "2xl" }}
                color="textPrimary"
                fontStyle="italic"
                mb={3}
                fontWeight="600"
              >
                Formal Invitation to Follow
              </Heading>

              <Text fontFamily="body" fontSize="md" color="textSecondary" fontWeight="400">
                We can't wait to celebrate with you!
              </Text>

              <Box
                h="1px"
                w="100%"
                bg="linear-gradient(to right, transparent, #CC8899, transparent)"
                mt={4}
              />
            </MotionBox>
          </MotionBox>
        </Flex>
        {/* Floating rose petals animation */}
        {[...Array(6)].map((_, i) => (
          <MotionBox
            key={i}
            position="absolute"
            bottom="0"
            left={`${15 + i * 14}%`}
            initial={{ y: 0, opacity: 0, rotate: 0 }}
            animate={{
              y: [-20, -500],
              opacity: [0, 0.6, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 8 + i * 1.5,
              repeat: Infinity,
              delay: i * 1.2,
              ease: "easeOut",
            }}
          >
            <Box
              w="12px"
              h="12px"
              bg={i % 2 === 0 ? "roseWine" : "oldRose"}
              borderRadius="50% 0 50% 0"
              transform="rotate(45deg)"
              opacity={0.7}
            />
          </MotionBox>
        ))}
      </Container>
    </Box>
  );
}

export default App
