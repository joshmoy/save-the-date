import { createSystem, defineConfig, defaultConfig, defineTokens, defineTextStyles } from "@chakra-ui/react"

const tokens = defineTokens({
  colors: {
    burgundy: { value: "#800020" },
    cherryRose: { value: "#AB274F" },
    roseWine: { value: "#C74375" },
    oldRose: { value: "#CC8899" },
    roseGold: { value: "#D4A57A" },
    champagne: { value: "#F7E7CE" },
    ivory: { value: "#FFFFF0" },
    cream: { value: "#FFF8F0" },
    deepBrown: { value: "#3E2723" },
    textPrimary: { value: "#3E2723" },
    textSecondary: { value: "#6D4C41" },
  },
  fonts: {
    heading: { value: "'Great Vibes', cursive" },
    subheading: { value: "'Cormorant', serif" },
    body: { value: "'Lora', serif" },
  },
  shadows: {
    elegant: { value: "0 4px 20px rgba(128, 0, 32, 0.12)" },
    bold: { value: "0 8px 30px rgba(171, 39, 79, 0.2)" },
    rose: { value: "0 0 30px rgba(199, 67, 117, 0.25)" },
  },
})

const textStyles = defineTextStyles({
  heading: {
    description: "Cursive script headings",
    value: {
      fontFamily: "heading",
      fontWeight: "400",
      fontSize: "5xl",
      // lineHeight: "shorter",
    },
  },
  subheading: {
    description: "Elegant subheadings",
    value: {
      fontFamily: "subheading",
      fontWeight: "600",
      fontSize: "3xl",
      lineHeight: "short",
    },
  },
  body: {
    description: "Serif body text",
    value: {
      fontFamily: "body",
      fontWeight: "400",
      fontSize: "md",
      lineHeight: "moderate",
    },
  },
  accent: {
    description: "Uppercase accent text",
    value: {
      fontFamily: "body",
      fontWeight: "700",
      fontSize: "sm",
      lineHeight: "moderate",
      letterSpacing: "widest",
      textTransform: "uppercase",
    },
  },
})

export const config = defineConfig({
  theme: {
    tokens,
    textStyles,
  },
})

export default createSystem(defaultConfig, config)
