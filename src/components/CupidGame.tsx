import { Box, Flex, Text, Button, Heading } from "@chakra-ui/react"
import { motion } from "framer-motion"
import { useState, useEffect, useCallback, useRef } from "react"
import { Heart, X } from "lucide-react"

const MotionBox = motion.create(Box)

interface FallingHeart {
  id: number
  x: number
  speed: number
  counted?: boolean
}

interface CupidGameProps {
  onClose: () => void
}

export default function CupidGame({ onClose }: CupidGameProps) {
  const [cupidPosition, setCupidPosition] = useState(50)
  const [hearts, setHearts] = useState<FallingHeart[]>([])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [missed, setMissed] = useState(0)
  const countedHearts = useRef<Set<number>>(new Set())
  const touchStartX = useRef<number>(0)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const lastTouchUpdate = useRef<number>(0)

  // Move cupid
  const moveCupid = useCallback((direction: 'left' | 'right') => {
    setCupidPosition(prev => {
      if (direction === 'left') return Math.max(10, prev - 5)
      return Math.min(90, prev + 5)
    })
  }, [])

  // Handle touch drag
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (gameOver || !gameAreaRef.current) return
    const touch = e.touches[0]
    touchStartX.current = touch.clientX
  }, [gameOver])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (gameOver || !gameAreaRef.current) return
    
    // Throttle touch updates to 16ms (~60fps) to prevent stuttering
    const now = Date.now()
    if (now - lastTouchUpdate.current < 16) return
    lastTouchUpdate.current = now
    
    const touch = e.touches[0]
    const gameAreaRect = gameAreaRef.current.getBoundingClientRect()
    const relativeX = ((touch.clientX - gameAreaRect.left) / gameAreaRect.width) * 100
    setCupidPosition(Math.max(10, Math.min(90, relativeX)))
  }, [gameOver])

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return
      if (e.key === 'ArrowLeft') moveCupid('left')
      if (e.key === 'ArrowRight') moveCupid('right')
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [moveCupid, gameOver])

  // Spawn hearts
  useEffect(() => {
    if (gameOver) return
    const interval = setInterval(() => {
      setHearts(prev => [...prev, {
        id: Date.now(),
        x: Math.random() * 85 + 5,
        speed: Math.random() * 2 + 2
      }])
    }, 1500)
    return () => clearInterval(interval)
  }, [gameOver])

  // Update hearts position and check collisions
  useEffect(() => {
    if (gameOver) return
    const interval = setInterval(() => {
      setHearts(prev => {
        const updated = prev.map(heart => ({
          ...heart,
          speed: heart.speed + 0.5
        })).filter(heart => {
          // Check collision with cupid first (before checking if missed)
          if (heart.speed > 85 && heart.speed < 95 &&
              Math.abs(heart.x - cupidPosition) < 8) {
            setScore(s => s + 1)
            return false
          }
          
          // Check if heart reached bottom - only count if not already in the set
          if (heart.speed >= 100) {
            if (!countedHearts.current.has(heart.id)) {
              countedHearts.current.add(heart.id)
              setMissed(m => {
                const newMissed = m + 1
                if (newMissed >= 5) setGameOver(true)
                return newMissed
              })
            }
            return false
          }
          
          return true
        })
        return updated
      })
    }, 50)
    return () => clearInterval(interval)
  }, [cupidPosition, gameOver])

  const resetGame = () => {
    setScore(0)
    setMissed(0)
    setHearts([])
    setGameOver(false)
    setCupidPosition(50)
    countedHearts.current.clear()
  }

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="rgba(62, 39, 35, 0.95)"
      zIndex={1000}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        w={{ base: "95%", md: "500px" }}
        h={{ base: "90%", md: "600px" }}
        bg="cream"
        borderRadius="8px"
        borderWidth="3px"
        borderColor="burgundy"
        position="relative"
        overflow="hidden"
      >
        {/* Close button */}
        <Button
          position="absolute"
          top="10px"
          right="10px"
          size="sm"
          onClick={onClose}
          bg="burgundy"
          color="white"
          _hover={{ bg: "cherryRose" }}
          zIndex={10}
        >
          <X size={16} />
        </Button>

        {/* Game header */}
        <Flex direction="column" align="center" p={4} borderBottom="2px solid" borderColor="oldRose">
          <Heading fontFamily="subheading" fontSize="2xl" color="burgundy" mb={2}>
            Catch the Hearts!
          </Heading>
          <Flex gap={6}>
            <Text fontFamily="body" fontSize="md" color="textPrimary">
              Score: <Text as="span" fontWeight="700" color="cherryRose">{score}</Text>
            </Text>
            <Text fontFamily="body" fontSize="md" color="textPrimary">
              Missed: <Text as="span" fontWeight="700" color="burgundy">{missed}/5</Text>
            </Text>
          </Flex>
          <Text fontFamily="body" fontSize="sm" color="textSecondary" mt={2}>
            <Text as="span" display={{ base: "inline", md: "none" }}>
              Drag cupid or use buttons
            </Text>
            <Text as="span" display={{ base: "none", md: "inline" }}>
              Use ← → arrow keys
            </Text>
          </Text>
        </Flex>

        {/* Game area */}
        <Box
          ref={gameAreaRef}
          position="relative"
          h="calc(100% - 140px)"
          bg="ivory"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          cursor="pointer"
        >
          {/* Falling hearts */}
          {hearts.map(heart => (
            <MotionBox
              key={heart.id}
              position="absolute"
              left={`${heart.x}%`}
              top={`${heart.speed}%`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <Heart size={24} fill="#C74375" color="#C74375" />
            </MotionBox>
          ))}

          {/* Cupid/Basket */}
          <MotionBox
            position="absolute"
            bottom="20px"
            left={`${cupidPosition}%`}
            transform="translateX(-50%)"
            animate={{ x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Text fontSize="4xl">💘</Text>
          </MotionBox>

          {/* Game Over overlay */}
          {gameOver && (
            <Flex
              position="absolute"
              top="0"
              left="0"
              right="0"
              bottom="0"
              bg="rgba(255, 248, 240, 0.95)"
              direction="column"
              align="center"
              justify="center"
              gap={4}
            >
              <Heading fontFamily="heading" fontSize="4xl" color="burgundy">
                Game Over!
              </Heading>
              <Text fontFamily="subheading" fontSize="2xl" color="textPrimary">
                Final Score: {score}
              </Text>
              <Button
                onClick={resetGame}
                bg="burgundy"
                color="white"
                _hover={{ bg: "cherryRose" }}
                size="lg"
                fontFamily="body"
                px="10px"
              >
                Play Again
              </Button>
            </Flex>
          )}
        </Box>

        {/* Controls */}
        <Flex gap={4} p={4} justify="center" borderTop="2px solid" borderColor="oldRose">
          <Button
            onClick={() => moveCupid('left')}
            bg="roseWine"
            color="white"
            _hover={{ bg: "cherryRose" }}
            size="lg"
            flex="1"
            disabled={gameOver}
            display={{ base: "flex", md: "none" }}
          >
            ← Left
          </Button>
          <Button
            onClick={() => moveCupid('right')}
            bg="roseWine"
            color="white"
            _hover={{ bg: "cherryRose" }}
            size="lg"
            flex="1"
            disabled={gameOver}
            display={{ base: "flex", md: "none" }}
          >
            Right →
          </Button>
          <Text 
            fontFamily="body" 
            fontSize="sm" 
            color="textSecondary" 
            display={{ base: "none", md: "block" }}
            textAlign="center"
            w="full"
          >
            Use ← → arrow keys to move cupid
          </Text>
        </Flex>
      </Box>
    </Box>
  )
}
