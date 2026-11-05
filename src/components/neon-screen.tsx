import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';

// Compatibility names for older callers; the palette follows Practice / Word Bank.
export const neon = {
  bg: '#FAFAFA', surface: '#FFFFFF', surface2: '#F3FAFF', border: '#C9EDFF',
  primary: '#2FA8E6', cyan: '#59C8FF', purple: '#6674CE', xp: '#B77908',
  streak: '#E8833A', hearts: '#E5484D', diamond: '#2FA8E6',
  greenHero: '#EAF8FF', greenHeroBorder: '#C9EDFF', goldLeague: '#FFF8DF',
  goldBorder: '#F2D58B', tipBg: '#EAF8FF', navInactive: '#5D686F',
  text: '#171A1C', muted: '#5D686F', ink: '#FFFFFF', ctaBg: '#59C8FF',
} as const;
export const CANDY_GRADIENT = {
  colors: ['#A9E0FF', '#D6F0FF', '#FFFFFF'] as const,
  locations: [0, 0.3, 0.6] as const,
};

export const neonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: neon.bg,
  },
  surface: {
    backgroundColor: neon.surface,
    borderWidth: 1.5,
    borderBottomWidth: 4,
    borderColor: neon.border,
  },
  title: {
    color: neon.text,
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
    shadowOpacity: 0,
    shadowRadius: 12,
    elevation: 0,
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
        shadowOpacity: 0,
        shadowRadius: 14,
      }}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <SvgLinearGradient id="titleGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#171A1C" />
            <Stop offset="0.55" stopColor="#171A1C" />
            <Stop offset="1" stopColor="#171A1C" />
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
