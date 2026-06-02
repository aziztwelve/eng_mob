import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Reusable Neon Dark visual FX — colored glow shadows, neon text glow and
 * gradient palettes shared across screens so the theme stays consistent.
 *
 * Colored glow isn't expressible via NativeWind tokens, so it lives here as
 * plain style objects applied through `style={...}`.
 */
export const NEON_GLOW: ViewStyle = {
  shadowColor: '#00FFA3',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.18,
  shadowRadius: 18,
  elevation: 6,
};

/** Stronger glow for primary CTAs. */
export const NEON_GLOW_STRONG: ViewStyle = {
  shadowColor: '#00FFA3',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.45,
  shadowRadius: 22,
  elevation: 10,
};

export const NEON_TEXT: TextStyle = {
  textShadowColor: 'rgba(0, 255, 163, 0.7)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 14,
};

/** Dark neon-tinted gradient for hero headers. */
export const HERO_GRADIENT = ['#0A2A22', '#0A1E33', '#1B0E33'] as const;

/** Bright neon gradient for primary buttons / CTAs. */
export const CTA_GRADIENT = ['#00FFA3', '#36E3FF'] as const;
