import { Box, Flex, Text, Image, Button, IconButton } from "@chakra-ui/react";
import { AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { updates } from "../data/updates";
import { MotionBox } from "../components/MotionBox";

const STORY_DURATION = 5000; // 5 seconds per story

export default function UpdatesPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const [paused, setPaused] = useState(false);

  const timerRef = useRef<number | null>(null);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleNext = useCallback(() => {
    // End current story timer immediately
    clearTimer();

    const nextIndex = currentIndexRef.current + 1;
    if (nextIndex >= updates.length) {
      navigate("/"); // Go back home after last story
      return;
    }
    setCurrentIndex(nextIndex);
  }, [clearTimer, navigate]);

  const handlePrev = useCallback(() => {
    // End current story timer immediately
    clearTimer();

    const prevIndex = currentIndexRef.current - 1;
    setCurrentIndex(Math.max(prevIndex, 0));
  }, [clearTimer]);

  // Timer logic
  useEffect(() => {
    if (paused) return;

    // Ensure only one timer exists
    clearTimer();

    // Tie this timer to the story index it was created for.
    const storyIndex = currentIndex;
    const timerId = window.setTimeout(() => {
      // If user navigated before this fired, ignore this old timer.
      if (currentIndexRef.current !== storyIndex) return;
      handleNext();
    }, STORY_DURATION);
    timerRef.current = timerId;

    return () => {
      clearTimeout(timerId);
      if (timerRef.current === timerId) timerRef.current = null;
    };
  }, [clearTimer, currentIndex, paused, handleNext]);

  const handlePause = () => {
    clearTimer();
    setPaused(true);
  };
  const handleResume = () => setPaused(false);

  const currentUpdate = updates[currentIndex];

  return (
    <Box
      w="100vw"
      h="100dvh"
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
            {index < currentIndex ? (
              // Completed stories: static full bar
              <Box h="full" w="full" bg="white" />
            ) : index === currentIndex ? (
              // Active story: animated bar (unmounts when story changes)
              <MotionBox
                key={`progress-${currentIndex}`}
                h="full"
                bg="white"
                initial={{ width: "0%" }}
                animate={paused ? undefined : { width: "100%" }}
                transition={paused ? { duration: 0 } : { duration: STORY_DURATION / 1000, ease: "linear" }}
              />
            ) : (
              // Upcoming stories: empty bar
              <Box h="full" w="0%" bg="white" />
            )}
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
                navigate(currentUpdate.pageRoute);
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
