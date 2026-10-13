/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Neon Dark theme
        background: "#06070D",
        foreground: "#ffffff",
        card: "#141A24",
        "card-foreground": "#ffffff",
        popover: "#141A24",
        "popover-foreground": "#ffffff",
        primary: "#00FFA3", // Neon green - main brand color
        "primary-foreground": "#04130C",
        secondary: "#36E3FF", // Neon cyan
        "secondary-foreground": "#04130C",
        muted: "#1C2433",
        "muted-foreground": "#9FB0C8",
        accent: "#A855FF", // Neon purple
        "accent-foreground": "#ffffff",
        destructive: "#FF4B7E",
        border: "rgba(255, 255, 255, 0.09)",
        input: "rgba(255, 255, 255, 0.14)",
        ring: "#00FFA3",
        // Semantic gamification accents
        streak: "#FF8A3D",
        xp: "#FFC83D",
        hearts: "#FF4B7E",
        info: "#36E3FF",
        // Mieo light theme (Figma "📱Light Theme")
        mieo: {
          primary: "#59C8FF",
          "primary-full": "#1AB3FF",
          "primary-shadow": "#3E8CB2",
          sky: "#B3E6FF",
          bg: "#FAFAFA",
          surface: "#FFFFFF",
          heading: "#171A1C",
          body: "#5D686F",
          stroke: "#E3E6E8",
          error: "#EB8787",
          "error-text": "#B34D4D",
        },
      },
      borderRadius: {
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "48px",
      },
      fontFamily: {
        sans:  ['Nunito_400Regular', 'system-ui', 'sans-serif'],
        semibold: ['Nunito_600SemiBold'],
        bold:  ['Nunito_700Bold'],
        extrabold: ['Nunito_800ExtraBold'],
        black: ['Nunito_900Black'],
        medium: ['Nunito_500Medium'],
        // Explicit family names: `font-black`/`font-medium` etc. are Tailwind weight utilities,
        // so family keys with those names do not reliably apply the Nunito face.
        "nunito-regular": ['Nunito_400Regular'],
        "nunito-medium": ['Nunito_500Medium'],
        "nunito-semibold": ['Nunito_600SemiBold'],
        "nunito-bold": ['Nunito_700Bold'],
        "nunito-extrabold": ['Nunito_800ExtraBold'],
        "nunito-black": ['Nunito_900Black'],
      },
    },
  },
  plugins: [],
}
