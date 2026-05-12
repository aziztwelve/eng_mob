/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Migrated from web app OKLCH colors to RGB
        background: "#1a1b26",
        foreground: "#ffffff",
        card: "#252736",
        "card-foreground": "#ffffff",
        popover: "#252736",
        "popover-foreground": "#ffffff",
        primary: "#58cc02", // Green - main brand color
        "primary-foreground": "#1a1a1a",
        secondary: "#1cb0f6", // Blue
        "secondary-foreground": "#1a1a1a",
        muted: "#3d3f54",
        "muted-foreground": "#b3b3b3",
        accent: "#3d3f54",
        "accent-foreground": "#ffffff",
        destructive: "#ff4b4b",
        border: "rgba(255, 255, 255, 0.1)",
        input: "rgba(255, 255, 255, 0.15)",
        ring: "#58cc02",
      },
      borderRadius: {
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "48px",
      },
    },
  },
  plugins: [],
}
