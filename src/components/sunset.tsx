import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import Svg, { Path, Circle, Ellipse, Line } from "react-native-svg";
import { useUserStats } from "@/hooks/use-user-stats";

/**
 * Shared "Sunset Lava" design language.
 * Single source of truth for the gradient backdrop, nested-stack chrome and
 * the common UI building blocks (header, tabs, cards, CTA) so AI / League /
 * Profile look exactly like the Lessons screen.
 */
export const SUNSET = ["#2E0A4A", "#6A1252", "#A8243F", "#C9521F"] as const;
export const SUNSET_LOC = [0, 0.38, 0.7, 0.96] as const;
export const CTA = ["#A8243F", "#CC5A1F"] as const;
export const GOLD = ["#FFDF5E", "#FFB338"] as const;
export const FILL = ["#FFF066", "#FFD84A"] as const;

export const glass = {
  backgroundColor: "rgba(255,255,255,0.14)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.22)",
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
  headerStyle: { backgroundColor: "#2E0A4A" },
  headerShadowVisible: false,
  headerTintColor: "#ffffff",
  headerTitleStyle: { fontWeight: "900" as const },
  contentStyle: { backgroundColor: "transparent" },
};

export default function SunsetStack() {
  return (
    <SunsetBg>
      <Stack screenOptions={sunsetStackOptions} />
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

function SearchIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round">
      <Circle cx={11} cy={11} r={7} />
      <Line x1={21} y1={21} x2={16.5} y2={16.5} />
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
  // Реальные данные из gamification-stats; пропсы переопределяют (для preview).
  const { data } = useUserStats();
  const streakVal = streak ?? data?.current_streak ?? 0;
  const heartsVal = hearts ?? data?.hearts ?? 0;
  const gemsVal = gems ?? data?.gems ?? 0;
  return (
    <View style={st.top}>
      <View style={st.stats}>
        <View style={[st.stat, glass]}><Text style={st.statText}>🔥 {streakVal}</Text></View>
        <View style={[st.stat, glass]}><Text style={st.statText}>♥ {heartsVal}</Text></View>
        <View style={[st.stat, glass]}><Text style={st.statText}>💎 {gemsVal}</Text></View>
      </View>
      <View style={st.avatar}>
        <Text style={{ fontSize: 24 }}>🧒</Text>
        <Text style={st.crown}>👑</Text>
      </View>
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
            <SearchIcon />
            <Text style={st.searchText}>{t('practice.search')}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Segmented tabs (crimson-gradient active)                            */
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
          <Pressable key={tab.key} onPress={() => onChange(tab.key)}>
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
/* Crimson CTA button                                                  */
/* ------------------------------------------------------------------ */
export function CtaButton({
  label,
  onPress,
  block,
}: {
  label: string;
  onPress?: () => void;
  block?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[st.ctaWrap, block && { alignSelf: "stretch" }]}>
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
        <Text style={{ fontSize: 16 }}>🔒</Text>
      </View>
    );
  }
  return (
    <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.go}>
      <Text style={st.goText}>›</Text>
    </LinearGradient>
  );
}

/* ------------------------------------------------------------------ */
const st = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  stats: { flexDirection: "row", gap: 8, flex: 1 },
  stat: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  statText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: "#FFD16A",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.7)",
    alignItems: "center", justifyContent: "center",
  },
  crown: { position: "absolute", top: -9, right: -6, fontSize: 15, transform: [{ rotate: "18deg" }] },

  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20 },
  title: { color: "#fff", fontSize: 30, fontWeight: "900" },
  search: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 15, paddingVertical: 9, borderRadius: 18 },
  searchText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  tabs: { flexDirection: "row", gap: 10, marginTop: 18 },
  tab: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 16 },
  tabActive: { borderWidth: 0, shadowColor: "#A8243F", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  tabText: { fontSize: 14, fontWeight: "800", color: "rgba(255,255,255,0.8)" },
  tabTextActive: { color: "#fff" },

  subhead: { flexDirection: "row", alignItems: "center", marginTop: 22, marginBottom: 14 },
  subheadTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  subheadUnderline: { width: 38, height: 3, borderRadius: 2, marginTop: 6 },
  subheadLink: { color: "#fff", fontSize: 13, fontWeight: "700", opacity: 0.92 },

  ctaWrap: { borderRadius: 16, overflow: "hidden", shadowColor: "#A8243F", shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  cta: { paddingVertical: 15, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#fff", fontWeight: "900", fontSize: 15, letterSpacing: 0.3 },

  go: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  goText: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: -2 },
  goLock: { backgroundColor: "rgba(255,255,255,0.16)" },
});
