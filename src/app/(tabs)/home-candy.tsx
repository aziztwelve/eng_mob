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

import { LearningStartIllustration } from "@/components/LearningStartIllustration";
import { useUserStats } from "@/hooks/use-user-stats";
import { useHearts } from "@/hooks/use-hearts";
import { useDailyGoal } from "@/hooks/use-daily-goal";
import { useSrsStats } from "@/hooks/use-srs";
import { useCurrentUser } from "@/hooks/use-auth";
import { useTracks, useTrack, useTrackProgress } from "@/hooks/use-tracks";
import type { Track } from "@/types/api";

// Косметика: реальные треки приходят с backend (название + прогресс),
// а emoji/градиент подставляем по индексу, чтобы сохранить «candy»-вид.
const TRACK_SKINS: { icon: string; colors: [string, string] }[] = [
  { icon: "🗣️", colors: ["#FFF066", "#FFD84A"] },
  { icon: "✈️", colors: ["#FF9E6E", "#F25B6E"] },
  { icon: "☕", colors: ["#FFC7A0", "#FF9E6E"] },
];

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

// Реальный прогресс трека: completed lesson ids (Set) / общее число уроков.
function TrackRow({ track, icon, colors }: { track: Track; icon: string; colors: [string, string] }) {
  const { data: completed } = useTrackProgress(track.id);
  const { data: full } = useTrack(track.id, true);
  const total = full?.lessons?.length ?? 0;
  const done = completed?.size ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return <TrackItem icon={icon} title={track.title} pct={pct} colors={colors} />;
}

export default function SunsetLavaHome() {
  const { data: stats } = useUserStats();
  const { data: hearts } = useHearts();
  const { data: dailyGoal } = useDailyGoal();
  const { data: srs } = useSrsStats();
  const { data: user } = useCurrentUser();
  const { data: tracksResp } = useTracks({ limit: 3 });

  // Геймификация
  const streak = stats?.current_streak ?? 0;
  const heartsCount = hearts?.unlimited ? "∞" : (hearts?.hearts ?? stats?.hearts ?? 0);
  const xp = stats?.total_xp ?? 0;
  const level = stats?.level ?? 1;

  // Дневная цель
  const goalXp = dailyGoal?.target_xp ?? 20;
  const earned = dailyGoal?.today?.xp_earned ?? 0;
  const goalForToday = dailyGoal?.today?.goal ?? goalXp;
  const planPct = goalForToday > 0 ? Math.min(100, Math.round((earned / goalForToday) * 100)) : 0;
  const remainingXp = Math.max(0, goalForToday - earned);

  // SRS / память
  const dueNow = srs?.due_now ?? 0;
  // mastered может отсутствовать в JSON (proto omitempty при значении 0) —
  // подставляем 0, иначе деление даёт NaN ("NaN%").
  const memoryPct = srs && srs.total_items > 0 ? Math.round(((srs.mastered ?? 0) / srs.total_items) * 100) : 0;

  // Имя
  const name = user?.name || user?.username || "друг";

  const tracks = tracksResp?.tracks ?? [];

  return (
    <LinearGradient colors={["#2E0A4A", "#6A1252", "#A8243F", "#C9521F"]} locations={[0, 0.38, 0.7, 0.96]} style={s.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.stat}><Text style={s.statText}>🔥 {streak}</Text></View>
          <View style={s.stat}><Text style={s.statText}>♥ {heartsCount}</Text></View>
          <View style={s.stat}><Text style={s.statText}>💎 {xp}</Text></View>
          <LinearGradient colors={["#FFDF5E", "#FFB338"]} style={[s.stat, s.statLvl]}>
            <Text style={s.lvlText}>✦ LV {level}</Text>
          </LinearGradient>
        </View>

        {/* Brand */}
        <View style={s.brandRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.brand}>LingoIQ</Text>
            <Text style={s.hello}>Привет, {name} 👋 Сегодня цель — {goalXp} XP</Text>
          </View>
          <View style={s.todayMini}>
            <Text style={s.todayLabel}>План</Text>
            <Text style={s.todayValue}>{planPct}%</Text>
          </View>
        </View>

        {/* Hero */}
        <View style={s.heroCard}>
          <View style={s.heroTop}>
            <View style={s.pill}><Text style={s.pillText}>🧠 Память растёт</Text></View>
            <LinearGradient colors={["#FFDF5E", "#FFB338"]} style={s.xpBadge}>
              <Text style={s.xpText}>+{goalXp} XP</Text>
            </LinearGradient>
          </View>
          <Text style={s.heroTitle}>Сегодня: повторить {dueNow} карт</Text>
          <Text style={s.heroDesc}>Сначала флешкарты, потом короткий трек на 5 минут.</Text>
          <Pressable onPress={() => router.push('/flashcards' as any)}>
            <LinearGradient colors={["#A8243F", "#CC5A1F"]} style={s.cta}>
              <Text style={s.ctaText}>НАЧАТЬ</Text>
            </LinearGradient>
          </Pressable>
          <View style={s.heroArtWrap}>
            <LearningStartIllustration width={104} height={104} />
          </View>
        </View>

        {/* Быстрый старт */}
        <View style={s.section}>
          <SectionHead icon="⚡" title="Быстрый старт" />
          <View style={s.quickGrid}>
            <Pressable style={s.quickCard} onPress={() => router.push('/flashcards' as any)}>
              <View style={s.quickBadge}><Text style={s.quickBadgeText}>{dueNow}</Text></View>
              <Text style={s.quickIcon}>🃏</Text>
              <Text style={s.quickTitle}>Флешкарты</Text>
              <Text style={s.quickSub}>Повтори слова, которые скоро забудутся</Text>
            </Pressable>
            <View style={s.quickCard}>
              <View style={s.quickBadge}><Text style={s.quickBadgeText}>{memoryPct}%</Text></View>
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
                <View style={s.reviewCount}><Text style={s.reviewCountText}>{dueNow}</Text></View>
              </View>
              <Text style={s.reviewText}>Новые слова из последних уроков. Лучше пройти сейчас.</Text>
              <Pressable onPress={() => router.push('/flashcards' as any)}>
                <LinearGradient colors={["#A8243F", "#CC5A1F"]} style={s.smallBtn}>
                  <Text style={s.smallBtnText}>Открыть карты</Text>
                </LinearGradient>
              </Pressable>
            </View>
            <View style={[s.streakCard, { flex: 1 }]}>
              <Text style={s.streakNum}>{streak}🔥</Text>
              <Text style={s.streakLabel}>дней серия</Text>
              <Text style={s.streakSub}>Осталось {remainingXp} XP до цели дня</Text>
            </View>
          </View>
        </View>

        {/* Треки */}
        <View style={s.section}>
          <SectionHead icon="🧭" title="Треки" action="Все →" />
          {tracks.map((track, i) => {
            const skin = TRACK_SKINS[i % TRACK_SKINS.length];
            return <TrackRow key={track.id} track={track} icon={skin.icon} colors={skin.colors} />;
          })}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 88 },

  statsRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  stat: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.26)" },
  statText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  statLvl: { marginLeft: "auto", borderWidth: 0 },
  lvlText: { color: "#5a3b00", fontWeight: "800", fontSize: 13 },

  brandRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginTop: 14 },
  brand: { color: "#fff", fontSize: 25, fontWeight: "800", letterSpacing: -0.5 },
  hello: { color: "rgba(255,255,255,0.88)", fontSize: 13, marginTop: 4, lineHeight: 18, maxWidth: 230 },
  todayMini: { alignItems: "center", gap: 2, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.26)" },
  todayLabel: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "600" },
  todayValue: { color: "#FFD84A", fontSize: 15, fontWeight: "800" },

  heroCard: { backgroundColor: "#FFF6F4", borderRadius: 22, padding: 16, overflow: "hidden", marginTop: 14 },
  heroTop: { flexDirection: "row", gap: 8 },
  pill: { backgroundColor: "#FCE1D0", paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14 },
  pillText: { color: "#B03A3A", fontWeight: "700", fontSize: 12 },
  xpBadge: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14 },
  xpText: { color: "#5a3b00", fontWeight: "800", fontSize: 12 },
  heroTitle: { color: "#2B1422", fontSize: 19, fontWeight: "800", marginTop: 12, maxWidth: "74%" },
  heroDesc: { color: "#6b4b56", fontSize: 13, marginTop: 4, lineHeight: 18, maxWidth: "70%" },
  cta: { marginTop: 14, alignSelf: "flex-start", paddingHorizontal: 26, paddingVertical: 11, borderRadius: 16 },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 0.5 },
  heroArtWrap: { position: "absolute", right: 2, bottom: 0 },

  section: { marginTop: 16 },
  secHead: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 10 },
  secIcon: { fontSize: 17 },
  secTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  secActionWrap: { marginLeft: "auto" },
  secAction: { color: "#fff", fontSize: 13, fontWeight: "700", opacity: 0.92 },

  quickGrid: { flexDirection: "row", gap: 10 },
  quickCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.24)", borderRadius: 18, padding: 13 },
  quickBadge: { position: "absolute", top: 12, right: 12, backgroundColor: "rgba(255,223,94,0.9)", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 11 },
  quickBadgeText: { color: "#5a3b00", fontWeight: "800", fontSize: 12 },
  quickIcon: { fontSize: 24 },
  quickTitle: { color: "#fff", fontWeight: "700", fontSize: 15, marginTop: 8 },
  quickSub: { color: "rgba(255,255,255,0.78)", fontSize: 12, marginTop: 3, lineHeight: 16 },

  memStrip: { flexDirection: "row", gap: 10 },
  reviewCard: { backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.24)", borderRadius: 18, padding: 13 },
  reviewTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reviewTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  reviewCount: { backgroundColor: "rgba(255,255,255,0.22)", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 11 },
  reviewCountText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  reviewText: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 7, lineHeight: 17 },
  smallBtn: { marginTop: 10, alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 9, borderRadius: 13 },
  smallBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  streakCard: { backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.24)", borderRadius: 18, padding: 13, justifyContent: "center", alignItems: "center" },
  streakNum: { color: "#fff", fontSize: 22, fontWeight: "800" },
  streakLabel: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },
  streakSub: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 7, lineHeight: 15, textAlign: "center" },

  track: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.24)", borderRadius: 18, paddingHorizontal: 13, paddingVertical: 11, marginBottom: 10 },
  trackIcoWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  trackIco: { fontSize: 22 },
  trackMain: { flex: 1 },
  trackTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  trackProgressBg: { height: 7, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.2)", marginTop: 7, overflow: "hidden" },
  trackProgressFill: { height: "100%", borderRadius: 6 },
  trackPct: { color: "#fff", fontWeight: "800", fontSize: 15, minWidth: 42, textAlign: "right" },
});
