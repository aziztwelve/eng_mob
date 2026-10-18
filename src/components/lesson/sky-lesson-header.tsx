import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { CaretLeft, Heart } from 'phosphor-react-native';

export const SKY = {
  top: '#A9E0FF',
  mid: '#D6F0FF',
  ink: '#171A1C',
  muted: '#5D686F',
  blue: '#59C8FF',
  blueDark: '#2FA8E6',
  line: '#C9EDFF',
  card: '#D6EFFC',
  green: '#34C759',
  greenDark: '#239A42',
  red: '#E5484D',
} as const;

// Light sky background used by the redesigned Game Play steps (Figma 246:15988).
export function SkyBackground() {
  return (
    <LinearGradient
      colors={[SKY.top, SKY.mid, '#FFFFFF']}
      locations={[0, 0.38, 0.66]}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}

// Full-screen container with the sky gradient behind its content.
export function SkyScreen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flex: 1, backgroundColor: '#FFFFFF' }, style]}>
      <SkyBackground />
      {children}
    </View>
  );
}

function Bear() {
  return (
    <Svg width={64} height={70} viewBox="0 0 96 104">
      <Circle cx={22} cy={26} r={12} fill="#E8833A" />
      <Circle cx={74} cy={26} r={12} fill="#E8833A" />
      <Circle cx={22} cy={26} r={6} fill="#B8651F" />
      <Circle cx={74} cy={26} r={6} fill="#B8651F" />
      <Ellipse cx={48} cy={62} rx={40} ry={38} fill="#FF8A2B" />
      <Ellipse cx={48} cy={76} rx={20} ry={15} fill="#FFC9A0" />
      <Circle cx={34} cy={54} r={6} fill="#171A1C" />
      <Circle cx={62} cy={54} r={6} fill="#171A1C" />
      <Circle cx={36} cy={52} r={2} fill="#FFFFFF" />
      <Circle cx={64} cy={52} r={2} fill="#FFFFFF" />
      <Ellipse cx={48} cy={68} rx={8} ry={5.5} fill="#171A1C" />
      <Path d="M40 80q8 7 16 0" fill="none" stroke="#171A1C" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

type Props = {
  top: number;
  subtitle: string;
  title: string;
  progressPct: number;
  hearts?: number;
  onBack: () => void;
};

export function SkyLessonHeader({ top, subtitle, title, progressPct, hearts, onBack }: Props) {
  return (
    <View style={{ paddingTop: top + 8, paddingHorizontal: 16 }}>
      <View style={st.topRow}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={st.back}>
          <CaretLeft size={22} color={SKY.ink} weight="bold" />
        </Pressable>
        <View style={st.track}>
          <View style={[st.fill, { width: `${Math.max(progressPct, 8)}%` }]} />
        </View>
        <View style={st.hearts}>
          <Heart size={16} weight="fill" color={SKY.red} />
          <Text style={st.heartsText}>{hearts ?? 5}</Text>
        </View>
      </View>
      <View style={st.mascotRow}>
        <Bear />
        <View style={st.bubble}>
          <Text numberOfLines={1} style={st.subtitle}>{subtitle}</Text>
          <Text numberOfLines={2} style={st.title}>{title}</Text>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  back: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: SKY.line,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    flex: 1,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: SKY.line,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 13, backgroundColor: SKY.blue },
  hearts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: SKY.line,
  },
  heartsText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: SKY.ink },
  mascotRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 14 },
  bubble: {
    flex: 1,
    marginBottom: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: SKY.card,
    borderBottomWidth: 4,
  },
  subtitle: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: SKY.muted },
  title: { fontFamily: 'Nunito_900Black', fontSize: 18, lineHeight: 24, color: SKY.ink },
});
