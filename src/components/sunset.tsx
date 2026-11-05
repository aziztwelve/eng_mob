import React from "react";
import { View, Text, StyleSheet, Pressable, StatusBar } from "react-native";
import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import Svg, { Path, Circle, Ellipse } from "react-native-svg";
import { useUserStats } from "@/hooks/use-user-stats";
import { useHearts } from '@/hooks/use-hearts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { Search, ChevronRight, LockKeyhole } from 'lucide-react-native';
import { SKY } from '@/components/lesson/sky-lesson-header';
import { IconFlame, IconHeart, IconGem } from '@/components/ui/icons';
import { StatPill } from '@/components/practice/practice-ui';

/** Compatibility exports for existing routes, using the Practice sky design. */
export const SUNSET = [SKY.top, SKY.mid, '#FFFFFF'] as const;
export const SUNSET_LOC = [0, 0.3, 0.6] as const;
export const CTA = [SKY.blue, SKY.blueDark] as const;
export const GOLD = ['#FFDF5E', '#FFB338'] as const;
export const FILL = [SKY.blue, SKY.blueDark] as const;

export const glass = {
  backgroundColor: '#FFFFFF',
  borderWidth: 1.5,
  borderBottomWidth: 4,
  borderColor: SKY.line,
  borderBottomColor: SKY.card,
} as const;

/* ------------------------------------------------------------------ */
/* Layout primitives                                                   */
/* ------------------------------------------------------------------ */
export function SunsetBg({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient colors={SUNSET} locations={SUNSET_LOC} style={{ flex: 1 }}>
      {children}
    </LinearGradient>
  );
}

export const sunsetStackOptions = {
  headerStyle: { backgroundColor: SKY.top },
  headerShadowVisible: false,
  headerTintColor: SKY.ink,
  headerTitleStyle: { fontFamily: "Nunito_900Black" },
  contentStyle: { backgroundColor: "transparent" },
};

export default function SunsetStack() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  return (
    <SunsetBg>
      {focused && <StatusBar barStyle="dark-content" />}
      <View style={{ flex: 1, paddingBottom: insets.bottom }}>
        <Stack screenOptions={sunsetStackOptions} />
      </View>
    </SunsetBg>
  );
}

/* ------------------------------------------------------------------ */
/* Owl mascot                                                          */
/* ------------------------------------------------------------------ */
export function SunsetOwl({ size = 78 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 1.05} viewBox="0 0 90 95">
      <Path d="M18 31C15 19 20 11 20 11c8 5 12 11 14 16h22c2-5 6-11 14-16 0 0 5 8 2 20 7 8 11 19 11 31 0 21-17 31-38 31S7 83 7 62c0-12 4-23 11-31Z" fill="#8a542d" />
      <Ellipse cx={45} cy={62} rx={27} ry={30} fill="#c98e61" />
      <Circle cx={33} cy={40} r={16} fill="#f5e6d2" />
      <Circle cx={57} cy={40} r={16} fill="#f5e6d2" />
      <Circle cx={33} cy={40} r={9} fill="#33221a" />
      <Circle cx={57} cy={40} r={9} fill="#33221a" />
      <Circle cx={36} cy={37} r={3} fill="white" />
      <Circle cx={60} cy={37} r={3} fill="white" />
      <Path d="M38 52h14L45 62 38 52Z" fill="#ff9c00" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Header: stats bar + title (+ optional search)                       */
/* ------------------------------------------------------------------ */
export function SunsetStats({
  streak,
  hearts,
  gems,
}: {
  streak?: number;
  hearts?: number;
  gems?: number;
}) {
  const { data } = useUserStats();
  const { data: heartData } = useHearts();
  return (
    <View style={st.top}>
      <StatPill value={streak ?? data?.current_streak ?? 0}><IconFlame size={16} color="#FF8A2B" /></StatPill>
      <StatPill value={hearts ?? (heartData?.unlimited ? '∞' : heartData?.hearts ?? data?.hearts ?? 0)}><IconHeart size={16} color={SKY.red} /></StatPill>
      <StatPill value={gems ?? data?.gems ?? 0}><IconGem size={16} color={SKY.blue} /></StatPill>
    </View>
  );
}

export function SunsetHeader({
  title,
  search,
  onSearch,
  showStats = true,
}: {
  title: string;
  search?: boolean;
  onSearch?: () => void;
  showStats?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View>
      {showStats ? <SunsetStats /> : null}
      <View style={st.titleRow}>
        <Text style={st.title}>{title}</Text>
        {search ? (
          <Pressable onPress={onSearch} style={[st.search, glass]}>
            <Search size={18} color={SKY.blueDark} />
            <Text style={st.searchText}>{t('practice.search')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Segmented tabs (blue active)                            */
/* ------------------------------------------------------------------ */
export function SunsetTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <View style={st.tabs}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable key={tab.key} accessibilityRole="tab" accessibilityState={{ selected: isActive }} onPress={() => onChange(tab.key)}>
            {isActive ? (
              <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[st.tab, st.tabActive]}>
                <Text style={[st.tabText, st.tabTextActive]}>{tab.label}</Text>
              </LinearGradient>
            ) : (
              <View style={[st.tab, glass]}>
                <Text style={st.tabText}>{tab.label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Section sub-head with gold underline + optional link                */
/* ------------------------------------------------------------------ */
export function SunsetSubhead({
  title,
  linkLabel,
  onLink,
}: {
  title: string;
  linkLabel?: string;
  onLink?: () => void;
}) {
  return (
    <View style={st.subhead}>
      <View>
        <Text style={st.subheadTitle}>{title}</Text>
        <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.subheadUnderline} />
      </View>
      {linkLabel ? (
        <Pressable onPress={onLink} style={{ marginLeft: "auto" }}>
          <Text style={st.subheadLink}>{linkLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Sky CTA button                                                  */
/* ------------------------------------------------------------------ */
export function CtaButton({
  label,
  onPress,
  block,
  disabled = false,
}: {
  label: string;
  onPress?: () => void;
  block?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[st.ctaWrap, block && { alignSelf: "stretch" }, disabled && { opacity: 0.45 }]}>
      <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.cta}>
        <Text style={st.ctaText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Circular go-arrow / lock                                            */
/* ------------------------------------------------------------------ */
export function GoArrow({ locked }: { locked?: boolean }) {
  if (locked) {
    return (
      <View style={[st.go, st.goLock]}>
        <LockKeyhole size={18} color={SKY.muted} />
      </View>
    );
  }
  return (
    <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.go}>
      <ChevronRight size={22} color="#FFFFFF" />
    </LinearGradient>
  );
}

/* ------------------------------------------------------------------ */
const st = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20 },
  title: { flex: 1, color: SKY.ink, fontSize: 30, fontFamily: "Nunito_900Black" },
  search: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 15, paddingVertical: 9, borderRadius: 18 },
  searchText: { color: SKY.ink, fontSize: 14, fontFamily: "Nunito_700Bold" },

  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 },
  tab: { minHeight: 44, justifyContent: "center", paddingHorizontal: 18, paddingVertical: 9, borderRadius: 16 },
  tabActive: { borderWidth: 1.5, borderColor: SKY.blueDark, borderBottomWidth: 4, borderBottomColor: SKY.blueDark },
  tabText: { fontSize: 14, fontFamily: "Nunito_800ExtraBold", color: SKY.muted },
  tabTextActive: { color: "#FFFFFF" },

  subhead: { flexDirection: "row", alignItems: "center", marginTop: 22, marginBottom: 14 },
  subheadTitle: { color: SKY.ink, fontSize: 18, fontFamily: "Nunito_800ExtraBold" },
  subheadUnderline: { width: 38, height: 3, borderRadius: 2, marginTop: 6 },
  subheadLink: { color: SKY.ink, fontSize: 13, fontFamily: "Nunito_700Bold", opacity: 0.92 },

  ctaWrap: { borderRadius: 16, overflow: "hidden", borderBottomWidth: 4, borderBottomColor: SKY.blueDark },
  cta: { minHeight: 52, paddingVertical: 15, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#FFFFFF", fontFamily: "Nunito_900Black", fontSize: 15, letterSpacing: 0.3 },

  go: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  goText: { color: SKY.ink, fontSize: 22, fontFamily: "Nunito_900Black", marginTop: -2 },
  goLock: { backgroundColor: SKY.card },
});
