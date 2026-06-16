import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Svg, { Path, Circle, Ellipse } from "react-native-svg";

function SectionHead({ icon, title, action }: { icon: string; title: string; action?: string }) {
  return (
    <View style={s.secHead}>
      <Text style={s.secIcon}>{icon}</Text>
      <Text style={s.secTitle}>{title}</Text>
      {action ? <Pressable style={s.secActionWrap}><Text style={s.secAction}>{action}</Text></Pressable> : null}
    </View>
  );
}

function TrackItem({ icon, title, pct, colors }: { icon: string; title: string; pct: number; colors: [string, string] }) {
  return (
    <View style={s.track}>
      <View style={s.trackIcoWrap}><Text style={s.trackIco}>{icon}</Text></View>
      <View style={s.trackMain}>
        <Text style={s.trackTitle}>{title}</Text>
        <View style={s.trackProgressBg}>
          <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.trackProgressFill, { width: `${pct}%` }]} />
        </View>
      </View>
      <Text style={s.trackPct}>{pct}%</Text>
    </View>
  );
}

export default function SunsetLavaHome() {
  return (
    <LinearGradient colors={["#2E0A4A", "#6A1252", "#A8243F", "#C9521F"]} locations={[0, 0.38, 0.7, 0.96]} style={s.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.stat}><Text style={s.statText}>🔥 7</Text></View>
          <View style={s.stat}><Text style={s.statText}>♥ 5</Text></View>
          <View style={s.stat}><Text style={s.statText}>💎 320</Text></View>
          <LinearGradient colors={["#FFDF5E", "#FFB338"]} style={[s.stat, s.statLvl]}>
            <Text style={s.lvlText}>✦ LV 1</Text>
          </LinearGradient>
        </View>

        {/* Brand */}
        <View style={s.brandRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.brand}>Fluent</Text>
            <Text style={s.hello}>Привет, Камол 👋 Сегодня цель — 20 XP</Text>
          </View>
          <View style={s.todayMini}>
            <Text style={s.todayLabel}>План</Text>
            <Text style={s.todayValue}>38%</Text>
          </View>
        </View>

        {/* Hero */}
        <View style={s.heroCard}>
          <View style={s.heroTop}>
            <View style={s.pill}><Text style={s.pillText}>🧠 Память растёт</Text></View>
            <LinearGradient colors={["#FFDF5E", "#FFB338"]} style={s.xpBadge}>
              <Text style={s.xpText}>+20 XP</Text>
            </LinearGradient>
          </View>
          <Text style={s.heroTitle}>Сегодня: повторить 18 карт</Text>
          <Text style={s.heroDesc}>Сначала флешкарты, потом короткий трек на 5 минут.</Text>
          <Pressable onPress={() => router.push('/flashcards' as any)}>
            <LinearGradient colors={["#A8243F", "#CC5A1F"]} style={s.cta}>
              <Text style={s.ctaText}>НАЧАТЬ</Text>
            </LinearGradient>
          </Pressable>
          <View style={s.owlWrap}>
            <Svg width={84} height={88} viewBox="0 0 90 95">
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
          </View>
        </View>

        {/* Быстрый старт */}
        <View style={s.section}>
          <SectionHead icon="⚡" title="Быстрый старт" />
          <View style={s.quickGrid}>
            <Pressable style={s.quickCard} onPress={() => router.push('/flashcards' as any)}>
              <View style={s.quickBadge}><Text style={s.quickBadgeText}>18</Text></View>
              <Text style={s.quickIcon}>🃏</Text>
              <Text style={s.quickTitle}>Флешкарты</Text>
              <Text style={s.quickSub}>Повтори слова, которые скоро забудутся</Text>
            </Pressable>
            <View style={s.quickCard}>
              <View style={s.quickBadge}><Text style={s.quickBadgeText}>82%</Text></View>
              <Text style={s.quickIcon}>🧠</Text>
              <Text style={s.quickTitle}>Память</Text>
              <Text style={s.quickSub}>Сильные и слабые слова за неделю</Text>
            </View>
          </View>
        </View>

        {/* Повторение */}
        <View style={s.section}>
          <SectionHead icon="🔁" title="Повторение" action="Все →" />
          <View style={s.memStrip}>
            <View style={[s.reviewCard, { flex: 1.5 }]}>
              <View style={s.reviewTop}>
                <Text style={s.reviewTitle}>К повтору</Text>
                <View style={s.reviewCount}><Text style={s.reviewCountText}>18</Text></View>
              </View>
              <Text style={s.reviewText}>Новые слова из последних уроков. Лучше пройти сейчас.</Text>
              <Pressable onPress={() => router.push('/flashcards' as any)}>
                <LinearGradient colors={["#A8243F", "#CC5A1F"]} style={s.smallBtn}>
                  <Text style={s.smallBtnText}>Открыть карты</Text>
                </LinearGradient>
              </Pressable>
            </View>
            <View style={[s.streakCard, { flex: 1 }]}>
              <Text style={s.streakNum}>7🔥</Text>
              <Text style={s.streakLabel}>дней серия</Text>
              <Text style={s.streakSub}>Осталось 8 XP до цели дня</Text>
            </View>
          </View>
        </View>

        {/* Треки */}
        <View style={s.section}>
          <SectionHead icon="🧭" title="Треки" action="Все →" />
          <TrackItem icon="🗣️" title="Разговор" pct={64} colors={["#FFF066", "#FFD84A"]} />
          <TrackItem icon="✈️" title="Путешествие" pct={38} colors={["#FF9E6E", "#F25B6E"]} />
          <TrackItem icon="☕" title="Кафе" pct={22} colors={["#FFC7A0", "#FF9E6E"]} />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },

  statsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  stat: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.26)" },
  statText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  statLvl: { marginLeft: "auto", borderWidth: 0 },
  lvlText: { color: "#5a3b00", fontWeight: "800", fontSize: 14 },

  brandRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginTop: 20 },
  brand: { color: "#fff", fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  hello: { color: "rgba(255,255,255,0.88)", fontSize: 14, marginTop: 6, lineHeight: 20, maxWidth: 230 },
  todayMini: { alignItems: "center", gap: 2, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.26)" },
  todayLabel: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "600" },
  todayValue: { color: "#FFD84A", fontSize: 16, fontWeight: "800" },

  heroCard: { backgroundColor: "#FFF6F4", borderRadius: 26, padding: 20, overflow: "hidden", marginTop: 22 },
  heroTop: { flexDirection: "row", gap: 8 },
  pill: { backgroundColor: "#FCE1D0", paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14 },
  pillText: { color: "#B03A3A", fontWeight: "700", fontSize: 12 },
  xpBadge: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14 },
  xpText: { color: "#5a3b00", fontWeight: "800", fontSize: 12 },
  heroTitle: { color: "#2B1422", fontSize: 21, fontWeight: "800", marginTop: 16, maxWidth: "74%" },
  heroDesc: { color: "#6b4b56", fontSize: 14, marginTop: 6, lineHeight: 20, maxWidth: "70%" },
  cta: { marginTop: 18, alignSelf: "flex-start", paddingHorizontal: 30, paddingVertical: 13, borderRadius: 18 },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.5 },
  owlWrap: { position: "absolute", right: 14, bottom: 10 },

  section: { marginTop: 26 },
  secHead: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 14 },
  secIcon: { fontSize: 18 },
  secTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  secActionWrap: { marginLeft: "auto" },
  secAction: { color: "#fff", fontSize: 13, fontWeight: "700", opacity: 0.92 },

  quickGrid: { flexDirection: "row", gap: 12 },
  quickCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.24)", borderRadius: 22, padding: 16 },
  quickBadge: { position: "absolute", top: 13, right: 13, backgroundColor: "rgba(255,223,94,0.9)", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 11 },
  quickBadgeText: { color: "#5a3b00", fontWeight: "800", fontSize: 12 },
  quickIcon: { fontSize: 28 },
  quickTitle: { color: "#fff", fontWeight: "700", fontSize: 16, marginTop: 10 },
  quickSub: { color: "rgba(255,255,255,0.78)", fontSize: 12, marginTop: 4, lineHeight: 16 },

  memStrip: { flexDirection: "row", gap: 12 },
  reviewCard: { backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.24)", borderRadius: 22, padding: 16 },
  reviewTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reviewTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  reviewCount: { backgroundColor: "rgba(255,255,255,0.22)", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 11 },
  reviewCountText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  reviewText: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 8, lineHeight: 17 },
  smallBtn: { marginTop: 12, alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 9, borderRadius: 13 },
  smallBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  streakCard: { backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.24)", borderRadius: 22, padding: 16, justifyContent: "center", alignItems: "center" },
  streakNum: { color: "#fff", fontSize: 26, fontWeight: "800" },
  streakLabel: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },
  streakSub: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 8, lineHeight: 15, textAlign: "center" },

  track: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.24)", borderRadius: 22, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12 },
  trackIcoWrap: { width: 48, height: 48, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  trackIco: { fontSize: 24 },
  trackMain: { flex: 1 },
  trackTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  trackProgressBg: { height: 8, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.2)", marginTop: 9, overflow: "hidden" },
  trackProgressFill: { height: "100%", borderRadius: 6 },
  trackPct: { color: "#fff", fontWeight: "800", fontSize: 15, minWidth: 42, textAlign: "right" },
});
