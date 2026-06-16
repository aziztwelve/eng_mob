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
      },
    },
  },
  plugins: [],
}
