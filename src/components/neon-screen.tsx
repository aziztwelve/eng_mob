import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';

export const neon = {
  bg: '#2E0A4A',
  surface: 'rgba(255,255,255,0.14)',
  surface2: 'rgba(255,255,255,0.10)',
  border: 'rgba(255,255,255,0.22)',
  primary: '#FFDF5E',
  cyan: '#FFB338',
  purple: '#FF9E6E',
  xp: '#FFD54F',
  streak: '#FF9344',
  hearts: '#FF6FA0',
  diamond: '#FFDF5E',
  greenHero: 'rgba(255,223,94,0.16)',
  greenHeroBorder: 'rgba(255,223,94,0.5)',
  goldLeague: 'rgba(255,223,94,0.16)',
  goldBorder: 'rgba(255,223,94,0.45)',
  tipBg: 'rgba(168,36,63,0.55)',
  navInactive: 'rgba(255,255,255,0.6)',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.75)',
  ink: '#3D0A1A',
  ctaBg: '#FF6BBF',
} as const;

// Candy gradient — matches login/register screens
export const CANDY_GRADIENT = {
  colors: ['#2E0A4A', '#6A1252', '#A8243F', '#C9521F'] as const,
  locations: [0, 0.38, 0.7, 0.96] as const,
};

export const neonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: neon.bg,
  },
  surface: {
    backgroundColor: neon.surface,
    borderWidth: 1,
    borderColor: neon.border,
  },
  title: {
    color: neon.primary,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: neon.muted,
    fontSize: 15,
    fontWeight: '400',
    marginTop: 4,
  },
  primaryText: {
    color: neon.primary,
  },
  cta: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: neon.ctaBg,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});

export function NeonScreen({ children, style }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[] }) {
  return (
    <LinearGradient
      colors={CANDY_GRADIENT.colors}
      locations={CANDY_GRADIENT.locations}
      style={[neonStyles.screen, ...(Array.isArray(style) ? style : style ? [style] : [])]}
    >
      {children}
    </LinearGradient>
  );
}

export function GradientTitle({
  children,
  width = 340,
  fontSize = 34,
}: {
  children: string;
  width?: number;
  fontSize?: number;
}) {
  const height = Math.ceil(fontSize * 1.3);

  return (
    <View
      style={{
        width,
        height,
        shadowColor: neon.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      }}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <SvgLinearGradient id="titleGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="0.55" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#FFF1C9" />
          </SvgLinearGradient>
        </Defs>
        <SvgText
          x="0"
          y={fontSize}
          fill="url(#titleGradient)"
          fontSize={fontSize}
          fontWeight="900"
          fontFamily="Nunito_900Black"
        >
          {children}
        </SvgText>
      </Svg>
    </View>
  );
}
