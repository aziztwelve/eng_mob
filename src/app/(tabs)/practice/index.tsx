import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Circle, Ellipse, Line } from "react-native-svg";
import { ActivityIndicator } from "react-native";

import { useFlashcards, useFlashcardStats, useSeedStarter } from "@/hooks/use-flashcards";
import { useMyTracks, useTrack } from "@/hooks/use-tracks";
import { useUserStats } from "@/hooks/use-user-stats";
import { useHearts } from "@/hooks/use-hearts";
import type { Flashcard, Track } from "@/types/api";

/* ------------------------------------------------------------------ */
/* Palette (Sunset Lava)                                               */
/* ------------------------------------------------------------------ */
const GRAD = ["#2E0A4A", "#6A1252", "#A8243F", "#C9521F"] as const;
const GRAD_LOC = [0, 0.38, 0.7, 0.96] as const;
const CTA = ["#A8243F", "#CC5A1F"] as const;
const GOLD = ["#FFDF5E", "#FFB338"] as const;

const glass = {
  backgroundColor: "rgba(255,255,255,0.14)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.22)",
} as const;

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */
const TABS = ["Треки", "Курсы", "Мои слова"] as const;
type TabName = (typeof TABS)[number];

/* ------------------------------------------------------------------ */
/* Small parts                                                         */
/* ------------------------------------------------------------------ */
function SearchIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round">
      <Circle cx={11} cy={11} r={7} />
      <Line x1={21} y1={21} x2={16.5} y2={16.5} />
    </Svg>
  );
}

function Owl() {
  return (
    <Svg width={78} height={82} viewBox="0 0 90 95">
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
/* Screen                                                              */
/* ------------------------------------------------------------------ */
export default function LessonsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabName>("Треки");

  // Геймификация: реальные данные с бэкенда (как на главной).
  const { data: stats } = useUserStats();
  const { data: hearts } = useHearts();
  const streak = stats?.current_streak ?? 0;
  const heartsCount = hearts?.unlimited ? "∞" : (hearts?.hearts ?? stats?.hearts ?? 0);
  const xp = stats?.total_xp ?? 0;

  return (
    <LinearGradient colors={GRAD} locations={GRAD_LOC} style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: 78 + insets.bottom }]}
      >
        {/* top: stats + avatar */}
        <View style={s.top}>
          <View style={s.stats}>
            <View style={[s.stat, glass]}><Text style={s.statText}>🔥 {streak}</Text></View>
            <View style={[s.stat, glass]}><Text style={s.statText}>♥ {heartsCount}</Text></View>
            <View style={[s.stat, glass]}><Text style={s.statText}>💎 {xp}</Text></View>
          </View>
          <View style={s.avatar}>
            <Text style={{ fontSize: 24 }}>🧒</Text>
            <Text style={s.crown}>👑</Text>
          </View>
        </View>

        {/* title + search */}
        <View style={s.titleRow}>
          <Text style={s.title}>Уроки</Text>
          <View style={[s.search, glass]}>
            <SearchIcon />
            <Text style={s.searchText}>Поиск</Text>
          </View>
        </View>

        {/* tabs */}
        <View style={s.tabs}>
          {TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <Pressable key={tab} onPress={() => setActiveTab(tab)}>
                {active ? (
                  <LinearGradient colors={["#A8243F", "#CC5A1F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.tab, s.tabActive]}>
                    <Text style={[s.tabText, s.tabTextActive]}>{tab}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[s.tab, glass]}>
                    <Text style={s.tabText}>{tab}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {activeTab === "Треки" ? (
          <>
            {/* subhead */}
            <View style={s.subhead}>
              <View>
                <Text style={s.subheadTitle}>Мои треки</Text>
                <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.subheadUnderline} />
              </View>
              <Pressable onPress={() => router.push("/tracks")} style={{ marginLeft: "auto" }}>
                <Text style={s.subheadLink}>Все треки ›</Text>
              </Pressable>
            </View>

            {/* tracks (под уровень аккаунта, из БД) */}
            <MyTracks />

            {/* banner */}
            <View style={[s.banner, glass]}>
              <Owl />
              <View style={s.bannerMain}>
                <Text style={s.bannerTitle}>Продолжай учиться!</Text>
                <Text style={s.bannerText}>Учись каждый день и достигай своих целей вместе с LingoIQ!</Text>
                <Pressable>
                  <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.remind}>
                    <Text style={s.remindText}>Напоминание 🔔</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </>
        ) : activeTab === "Мои слова" ? (
          <MyWordsTab />
        ) : (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📚</Text>
            <Text style={s.emptyText}>Курсы скоро появятся</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

/* ------------------------------------------------------------------ */
/* «Мои треки» — треки из БД под уровень аккаунта (без бейджей уровня) */
/* ------------------------------------------------------------------ */
function MyTracks() {
  // Персональный план юзера (Phase 8): бэкенд подбирает треки по level+goal
  // и лениво генерирует план. Показываем уроки активного трека напрямую.
  const { data, isLoading } = useMyTracks();
  const tracks = data?.tracks ?? [];

  if (isLoading) {
    return <ActivityIndicator color="#FFD84A" style={{ marginVertical: 24 }} />;
  }
  if (tracks.length === 0) {
    return (
      <View style={[trk.empty, glass]}>
        <Text style={{ fontSize: 40 }}>🧭</Text>
        <Text style={trk.emptyText}>Пока нет треков для твоего уровня и цели</Text>
      </View>
    );
  }

  // 1 активный трек за раз (иначе первый по порядку плана).
  const active = tracks.find((t) => t.status === "active") ?? tracks[0];
  return <TrackLessons track={active} />;
}

/* ------------------------------------------------------------------ */
/* Уроки трека — рендерим напрямую внутри «Мои треки».                 */
/* ------------------------------------------------------------------ */
function TrackLessons({ track }: { track: Track }) {
  const router = useRouter();
  const { data: full, isLoading } = useTrack(track.id, true);
  const lessons = full?.lessons ?? [];

  if (isLoading) {
    return <ActivityIndicator color="#FFD84A" style={{ marginVertical: 24 }} />;
  }
  if (lessons.length === 0) {
    return (
      <View style={[trk.empty, glass]}>
        <Text style={{ fontSize: 40 }}>🦉</Text>
        <Text style={trk.emptyText}>Уроки скоро появятся</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {lessons.map((lesson, idx) => (
        <Pressable
          key={lesson.id}
          onPress={() => router.push(`/learn/${lesson.id}` as never)}
          style={[trk.card, glass]}
        >
          <View style={trk.thumb}>
            <Text style={trk.thumbNum}>{idx + 1}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={trk.title} numberOfLines={2}>
              {lesson.title}
            </Text>
            {lesson.description ? (
              <Text style={trk.desc} numberOfLines={2}>
                {lesson.description}
              </Text>
            ) : null}
          </View>
          <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={trk.go}>
            <Text style={trk.goText}>›</Text>
          </LinearGradient>
        </Pressable>
      ))}
    </View>
  );
}

const trk = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 11, borderRadius: 20 },
  thumb: {
    width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  thumbNum: { color: "#FFD84A", fontSize: 18, fontWeight: "900" },
  title: { color: "#fff", fontSize: 15, fontWeight: "800", lineHeight: 19 },
  desc: { color: "rgba(255,255,255,0.82)", fontSize: 12, fontWeight: "600", marginTop: 3 },
  go: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  goText: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: -2 },
  empty: { alignItems: "center", gap: 10, paddingVertical: 24, borderRadius: 20 },
  emptyText: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "700" },
});

/* ------------------------------------------------------------------ */
/* «Мои слова» — флешкарты пользователя внутри вкладки Уроки           */
/* ------------------------------------------------------------------ */
function MyWordsTab() {
  const router = useRouter();
  const stats = useFlashcardStats();
  const flashcards = useFlashcards({ limit: 30 });
  const seedStarter = useSeedStarter();

  const todayDue = stats.data?.today_due ?? 0;
  const mastered = stats.data?.mastered_count ?? 0;
  const total = stats.data?.total_count ?? 0;
  const items = flashcards.data?.items ?? [];

  if (stats.isLoading) {
    return (
      <View style={{ paddingVertical: 50, alignItems: "center" }}>
        <ActivityIndicator color="#FFD84A" />
      </View>
    );
  }

  if (total === 0) {
    return (
      <View style={[mw.card, { padding: 22, alignItems: "center", gap: 14, marginTop: 18 }]}>
        <Text style={{ fontSize: 48 }}>🎴</Text>
        <Text style={mw.emptyTitle}>Здесь будут твои слова</Text>
        <Text style={mw.emptyText}>
          Загрузи стартовый набор для повторения или проходи уроки — слова добавятся сами.
        </Text>
        <Pressable
          onPress={() => seedStarter.mutate("en")}
          disabled={seedStarter.isPending}
          style={[mw.ctaWrap, { alignSelf: "stretch" }]}
        >
          <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={mw.cta}>
            {seedStarter.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={mw.ctaText}>Загрузить стартовый набор</Text>
            )}
          </LinearGradient>
        </Pressable>
        <Pressable onPress={() => router.push("/flashcards" as never)} style={[mw.card, mw.outlineBtn]}>
          <Text style={mw.outlineText}>Открыть флешкарты</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 18, gap: 14 }}>
      <View style={[mw.card, { flexDirection: "row", padding: 8 }]}>
        <MwStat label="На сегодня" value={todayDue} color="#FFD84A" />
        <MwStat label="Выучено" value={mastered} color="#2EECC8" />
        <MwStat label="Всего" value={total} color="#fff" />
      </View>

      {todayDue > 0 ? (
        <Pressable onPress={() => router.push("/flashcards/session" as never)} style={mw.ctaWrap}>
          <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[mw.cta, mw.ctaRow]}>
            <View style={{ flex: 1 }}>
              <Text style={mw.ctaText}>Повторить слова</Text>
              <Text style={mw.ctaSub}>{todayDue} на сегодня</Text>
            </View>
            <Text style={{ fontSize: 22 }}>▶️</Text>
          </LinearGradient>
        </Pressable>
      ) : (
        <Pressable onPress={() => router.push("/flashcards" as never)} style={[mw.card, mw.outlineBtn]}>
          <Text style={mw.outlineText}>Открыть флешкарты</Text>
        </Pressable>
      )}

      <View style={{ gap: 10 }}>
        {items.map((card: Flashcard) => (
          <View key={card.id} style={[mw.card, { padding: 14 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={mw.word}>{card.word}</Text>
                  {card.transcription ? <Text style={mw.ipa}>{card.transcription}</Text> : null}
                </View>
                <Text style={mw.tr}>{card.translation}</Text>
              </View>
              {card.pinned_today ? (
                <View style={mw.badge}>
                  <Text style={mw.badgeText}>Сегодня</Text>
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <Pressable onPress={() => router.push("/flashcards" as never)} style={{ alignSelf: "center", paddingVertical: 10 }}>
        <Text style={mw.allLink}>Все слова →</Text>
      </Pressable>
    </View>
  );
}

function MwStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1, padding: 10, gap: 3 }}>
      <Text style={mw.statLabel}>{label.toUpperCase()}</Text>
      <Text style={[mw.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const mw = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 18,
  },
  statLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "800" },
  statValue: { fontSize: 24, fontWeight: "900" },
  ctaWrap: { borderRadius: 16, overflow: "hidden" },
  cta: { paddingVertical: 16, paddingHorizontal: 18, alignItems: "center" },
  ctaRow: { flexDirection: "row", gap: 12 },
  ctaText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  ctaSub: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600", marginTop: 2 },
  outlineBtn: { alignSelf: "stretch", alignItems: "center", paddingVertical: 14, borderRadius: 14 },
  outlineText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  word: { color: "#fff", fontSize: 16, fontWeight: "800" },
  ipa: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" },
  tr: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "600" },
  badge: { backgroundColor: "#FF9600", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  emptyTitle: { color: "#fff", fontSize: 18, fontWeight: "900", textAlign: "center" },
  emptyText: { color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center", lineHeight: 20 },
  allLink: { color: "#FFD84A", fontWeight: "800", fontSize: 14 },
});


/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */
const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  /* top */
  top: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  stats: { flexDirection: "row", gap: 8, flex: 1 },
  stat: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14 },
  statText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  avatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFD16A",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.7)",
    alignItems: "center", justifyContent: "center",
  },
  crown: { position: "absolute", top: -9, right: -6, fontSize: 14, transform: [{ rotate: "18deg" }] },

  /* title + search */
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  title: { color: "#fff", fontSize: 25, fontWeight: "900" },
  search: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  searchText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  /* tabs */
  tabs: { flexDirection: "row", gap: 10, marginTop: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 14 },
  tabActive: { borderWidth: 0, shadowColor: "#A8243F", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  tabText: { fontSize: 13, fontWeight: "800", color: "rgba(255,255,255,0.8)" },
  tabTextActive: { color: "#fff" },

  /* subhead */
  subhead: { flexDirection: "row", alignItems: "center", marginTop: 14, marginBottom: 10 },
  subheadTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  subheadUnderline: { width: 36, height: 3, borderRadius: 2, marginTop: 5 },
  subheadLink: { color: "#fff", fontSize: 13, fontWeight: "700", opacity: 0.92 },

  /* tracks */
  tracks: { gap: 10 },
  track: { flexDirection: "row", alignItems: "center", gap: 12, padding: 11, borderRadius: 20 },
  trackLocked: { opacity: 0.7 },
  thumb: {
    width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  trackMain: { flex: 1, minWidth: 0 },
  badge: { alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: "#FFCB45" },
  badgeText: { fontSize: 11, fontWeight: "800", color: "#5a3b00" },
  trackTitle: { color: "#fff", fontSize: 15, fontWeight: "800", marginTop: 5, lineHeight: 18 },
  trackLvl: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "700", marginTop: 4 },
  trackFoot: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 7 },
  pbar: { flex: 1, height: 7, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden" },
  pbarFill: { height: "100%", borderRadius: 6 },
  pct: { color: "#fff", fontSize: 13, fontWeight: "800", minWidth: 38, textAlign: "right" },
  lockText: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "700", marginTop: 7 },

  goWrap: { borderRadius: 20 },
  go: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  goText: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: -2 },
  goLock: { backgroundColor: "rgba(255,255,255,0.16)" },

  /* banner */
  banner: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 20 },
  bannerMain: { flex: 1 },
  bannerTitle: { color: "#fff", fontSize: 17, fontWeight: "900" },
  bannerText: { color: "rgba(255,255,255,0.82)", fontSize: 12, fontWeight: "600", marginTop: 4, lineHeight: 17 },
  remind: { alignSelf: "flex-start", marginTop: 9, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  remindText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  /* empty */
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 56, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: "rgba(255,255,255,0.85)", fontSize: 15, fontWeight: "700" },
});
