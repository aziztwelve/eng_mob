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
import { useTracks } from "@/hooks/use-tracks";
import { useOnboardingState } from "@/hooks/use-onboarding";
import type { Flashcard, Track } from "@/types/api";

/* ------------------------------------------------------------------ */
/* Palette (Sunset Lava)                                               */
/* ------------------------------------------------------------------ */
const GRAD = ["#2E0A4A", "#6A1252", "#A8243F", "#C9521F"] as const;
const GRAD_LOC = [0, 0.38, 0.7, 0.96] as const;
const CTA = ["#A8243F", "#CC5A1F"] as const;
const GOLD = ["#FFDF5E", "#FFB338"] as const;
const FILL = ["#FFF066", "#FFD84A"] as const;

const glass = {
  backgroundColor: "rgba(255,255,255,0.14)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.22)",
} as const;

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */
type TrackRow = {
  emoji: string;
  badge: string;
  title: string;
  level?: number;
  pct?: number;
  locked?: boolean;
};

const TRACKS: TrackRow[] = [
  { emoji: "✈️", badge: "Популярный", title: "Английский для путешествий", level: 3, pct: 80 },
  { emoji: "💼", badge: "Практичный", title: "Английский для работы", level: 2, pct: 50 },
  { emoji: "💬", badge: "Разговорный", title: "Разговорный английский", level: 1, pct: 30 },
  { emoji: "🎓", badge: "Экзамены", title: "IELTS", level: 1, pct: 20 },
  { emoji: "📈", badge: "Бизнес", title: "Бизнес английский", locked: true },
];

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

function TrackCard({ track, onPress }: { track: TrackRow; onPress: () => void }) {
  return (
    <View style={[s.track, glass, track.locked && s.trackLocked]}>
      <View style={s.thumb}>
        <Text style={{ fontSize: 32 }}>{track.emoji}</Text>
      </View>
      <View style={s.trackMain}>
        <View style={s.badge}>
          <Text style={s.badgeText}>{track.badge}</Text>
        </View>
        <Text style={s.trackTitle}>{track.title}</Text>
        {track.locked ? (
          <Text style={s.lockText}>🔒 Заблокировано</Text>
        ) : (
          <>
            <Text style={s.trackLvl}>👑 Уровень {track.level}</Text>
            <View style={s.trackFoot}>
              <View style={s.pbar}>
                <LinearGradient colors={FILL} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.pbarFill, { width: `${track.pct ?? 0}%` }]} />
              </View>
              <Text style={s.pct}>{track.pct}%</Text>
            </View>
          </>
        )}
      </View>
      {track.locked ? (
        <View style={[s.go, s.goLock]}>
          <Text style={{ fontSize: 16 }}>🔒</Text>
        </View>
      ) : (
        <Pressable onPress={onPress} style={s.goWrap}>
          <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.go}>
            <Text style={s.goText}>›</Text>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */
export default function LessonsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabName>("Треки");

  return (
    <LinearGradient colors={GRAD} locations={GRAD_LOC} style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: 100 + insets.bottom }]}
      >
        {/* top: stats + avatar */}
        <View style={s.top}>
          <View style={s.stats}>
            <View style={[s.stat, glass]}><Text style={s.statText}>🔥 7</Text></View>
            <View style={[s.stat, glass]}><Text style={s.statText}>♥ 5</Text></View>
            <View style={[s.stat, glass]}><Text style={s.statText}>💎 320</Text></View>
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
                <Text style={s.bannerText}>Учись каждый день и достигай своих целей вместе с Ruya!</Text>
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
  const router = useRouter();
  const onboarding = useOnboardingState();
  const level = String(onboarding.data?.level ?? "").toLowerCase();
  const goal = String(onboarding.data?.goal ?? "").toLowerCase();
  const { data, isLoading } = useTracks({ limit: 50 });

  const all: Track[] = data?.tracks ?? [];
  // По уровню аккаунта (case-insensitive). Если уровень не задан — все.
  let tracks = level ? all.filter((t) => String(t.level ?? "").toLowerCase() === level) : all;
  // По цели (мягко): если есть треки, релевантные цели, оставляем их;
  // иначе показываем все треки уровня (у seed-треков нет поля цели).
  if (goal) {
    const byGoal = tracks.filter((t) =>
      `${t.title ?? ""} ${t.description ?? ""} ${t.code ?? ""} ${t.track_type ?? ""}`
        .toLowerCase()
        .includes(goal),
    );
    if (byGoal.length > 0) tracks = byGoal;
  }

  const emojiFor = (tt: string) =>
    tt === "daily" ? "🗓️" : tt === "stories" ? "📖" : tt === "podcast" ? "🎧" : tt === "thematic" ? "🎯" : "✨";

  if (isLoading) {
    return <ActivityIndicator color="#FFD84A" style={{ marginVertical: 24 }} />;
  }
  if (tracks.length === 0) {
    return (
      <View style={[trk.empty, glass]}>
        <Text style={{ fontSize: 40 }}>🧭</Text>
        <Text style={trk.emptyText}>Пока нет треков для твоего уровня</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      {tracks.map((t) => (
        <Pressable key={t.id} onPress={() => router.push(`/tracks/${t.id}` as never)} style={[trk.card, glass]}>
          <View style={trk.thumb}>
            <Text style={{ fontSize: 30 }}>{emojiFor(String(t.track_type))}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={trk.title} numberOfLines={2}>
              {t.title}
            </Text>
            {t.description ? (
              <Text style={trk.desc} numberOfLines={2}>
                {t.description}
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
  card: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 24 },
  thumb: {
    width: 60, height: 60, borderRadius: 16, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "800", lineHeight: 20 },
  desc: { color: "rgba(255,255,255,0.82)", fontSize: 12, fontWeight: "600", marginTop: 4 },
  go: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  goText: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: -2 },
  empty: { alignItems: "center", gap: 10, paddingVertical: 28, borderRadius: 24 },
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

  /* title + search */
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20 },
  title: { color: "#fff", fontSize: 30, fontWeight: "900" },
  search: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 15, paddingVertical: 9, borderRadius: 18 },
  searchText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  /* tabs */
  tabs: { flexDirection: "row", gap: 10, marginTop: 18 },
  tab: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 16 },
  tabActive: { borderWidth: 0, shadowColor: "#A8243F", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  tabText: { fontSize: 14, fontWeight: "800", color: "rgba(255,255,255,0.8)" },
  tabTextActive: { color: "#fff" },

  /* subhead */
  subhead: { flexDirection: "row", alignItems: "center", marginTop: 22, marginBottom: 14 },
  subheadTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  subheadUnderline: { width: 38, height: 3, borderRadius: 2, marginTop: 6 },
  subheadLink: { color: "#fff", fontSize: 13, fontWeight: "700", opacity: 0.92 },

  /* tracks */
  tracks: { gap: 14 },
  track: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 24 },
  trackLocked: { opacity: 0.7 },
  thumb: {
    width: 66, height: 66, borderRadius: 18, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  trackMain: { flex: 1, minWidth: 0 },
  badge: { alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: "#FFCB45" },
  badgeText: { fontSize: 11, fontWeight: "800", color: "#5a3b00" },
  trackTitle: { color: "#fff", fontSize: 16, fontWeight: "800", marginTop: 6, lineHeight: 19 },
  trackLvl: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "700", marginTop: 5 },
  trackFoot: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 9 },
  pbar: { flex: 1, height: 8, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden" },
  pbarFill: { height: "100%", borderRadius: 6 },
  pct: { color: "#fff", fontSize: 13, fontWeight: "800", minWidth: 38, textAlign: "right" },
  lockText: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "700", marginTop: 8 },

  goWrap: { borderRadius: 21 },
  go: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  goText: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: -2 },
  goLock: { backgroundColor: "rgba(255,255,255,0.16)" },

  /* banner */
  banner: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 20, paddingVertical: 16, paddingHorizontal: 18, borderRadius: 24 },
  bannerMain: { flex: 1 },
  bannerTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  bannerText: { color: "rgba(255,255,255,0.82)", fontSize: 13, fontWeight: "600", marginTop: 5, lineHeight: 18 },
  remind: { alignSelf: "flex-start", marginTop: 11, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 9, borderRadius: 16 },
  remindText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  /* empty */
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 70, gap: 12 },
  emptyEmoji: { fontSize: 54 },
  emptyText: { color: "rgba(255,255,255,0.85)", fontSize: 15, fontWeight: "700" },
});
