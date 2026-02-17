import { Box, Flex, Text, Image, Button, IconButton } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { updates } from "../data/updates";

const MotionBox = motion.create(Box);

const STORY_DURATION = 5000; // 5 seconds per story

export default function UpdatesPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const [paused, setPaused] = useState(false);

  const timerRef = useRef<number | null>(null);

  const handleNext = useCallback(() => {
    // Clear any running timer immediately when manually advancing
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (currentIndex < updates.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      navigate("/"); // Go back home after last story
    }
  }, [currentIndex, navigate]);

  const handlePrev = useCallback(() => {
    // Clear any running timer immediately when manually going back
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Timer logic
  useEffect(() => {
    if (paused) return;

    timerRef.current = window.setTimeout(() => {
      handleNext();
    }, STORY_DURATION);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex, paused, handleNext]);

  const handlePause = () => setPaused(true);
  const handleResume = () => setPaused(false);

  const currentUpdate = updates[currentIndex];

  return (
    <Box
      w="100vw"
      h="100vh"
      bg="black"
      color="white"
      position="relative"
      overflow="hidden"
      onMouseDown={handlePause}
      onMouseUp={handleResume}
      onTouchStart={handlePause}
      onTouchEnd={handleResume}
    >
      {/* Progress Bars */}
      <Flex position="absolute" top="4" left="0" right="0" px="4" gap="2" zIndex="10">
        {updates.map((_, index) => (
          <Box key={index} flex="1" h="1" bg="whiteAlpha.400" borderRadius="full" overflow="hidden">
            <MotionBox
              h="full"
              bg="white"
              initial={{ width: index < currentIndex ? "100%" : "0%" }}
              animate={{
                width:
                  index < currentIndex
                    ? "100%"
                    : index === currentIndex && !paused
                      ? "100%"
                      : index === currentIndex && paused
                        ? "var(--progress-width, 0%)" // Keep current progress if paused (simplified for now)
                        : "0%",
              }}
              transition={{
                duration: index === currentIndex ? STORY_DURATION / 1000 : 0,
                ease: "linear",
              }}
            />
          </Box>
        ))}
      </Flex>

      {/* Close Button */}
      <IconButton
        aria-label="Close"
        position="absolute"
        top="8"
        right="4"
        zIndex="20"
        variant="ghost"
        color="white"
        _hover={{ bg: "whiteAlpha.200" }}
        onClick={(e) => {
          e.stopPropagation();
          navigate("/");
        }}
      >
        <X size={24} />
      </IconButton>

      {/* Content */}
      <AnimatePresence mode="wait">
        <MotionBox
          key={currentIndex}
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background Image */}
          <Image
            src={currentUpdate.image}
            alt={currentUpdate.title}
            w="full"
            h="full"
            objectFit="cover"
            filter="brightness(0.7)"
          />

          {/* Text Overlay */}
          <Flex
            position="absolute"
            bottom="0"
            left="0"
            right="0"
            p="8"
            direction="column"
            bg="linear-gradient(to top, rgba(0,0,0,0.8), transparent)"
            pb="12"
            zIndex="20"
            pointerEvents="none"
          >
            <Text fontSize="sm" opacity={0.8} mb="2">
              {new Date(currentUpdate.date).toLocaleDateString()}
            </Text>
            <Text fontSize="3xl" fontWeight="bold" mb="2">
              {currentUpdate.title}
            </Text>
            <Text fontSize="lg" mb="6" maxLines={3}>
              {currentUpdate.summary}
            </Text>

            <Button
              colorScheme="whiteAlpha"
              variant="solid"
              color="black"
              bg="white"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/updates/${currentUpdate.id}`);
              }}
              alignSelf="start"
              pointerEvents="auto"
              px={4}
            >
              View Details
            </Button>
          </Flex>
        </MotionBox>
      </AnimatePresence>

      {/* Navigation Areas */}
      <Flex position="absolute" top="0" left="0" right="0" bottom="0" zIndex="5">
        <Box w="30%" h="full" onClick={handlePrev} cursor="pointer" />
        <Box w="40%" h="full" /> {/* Center area for pausing */}
        <Box w="30%" h="full" onClick={handleNext} cursor="pointer" />
      </Flex>
    </Box>
  );
}
