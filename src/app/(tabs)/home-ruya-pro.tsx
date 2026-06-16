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
import Svg, {
  Path,
  Circle,
  Ellipse,
  G,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Rect,
} from "react-native-svg";

/* ------------------------------------------------------------------ */
/* Palette                                                             */
/* ------------------------------------------------------------------ */
const C = {
  bgTop: "#FFD23E",
  bgBottom: "#FFCE33",
  card: "#FFFDF3",
  cardSoft: "#FFFBEC",
  ink: "#2B2B2B",
  orange: "#F5A623",
  orangeDeep: "#FF9500",
  orangeText: "#E8920E",
  track: "#E9E4D2",
  fillA: "#FFC233",
  fillB: "#FF9F1C",
  lockBg: "#ECE8DC",
  lockIcon: "#B7B1A1",
  green: "#54D072",
  white: "#FFFFFF",
  muted: "#8C8678",
};

/* ------------------------------------------------------------------ */
/* Decorative bits                                                     */
/* ------------------------------------------------------------------ */
function Sparkle({
  x,
  y,
  size = 14,
  color = "#FFFFFF",
  opacity = 0.9,
}: {
  x: number;
  y: number;
  size?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ position: "absolute", left: x, top: y, opacity }}
    >
      <Path
        d="M12 0c1 6 5 10 12 12-7 2-11 6-12 12-1-6-5-10-12-12C7 10 11 6 12 0Z"
        fill={color}
      />
    </Svg>
  );
}

function Cloud({
  x,
  y,
  scale = 1,
  opacity = 0.55,
}: {
  x: number;
  y: number;
  scale?: number;
  opacity?: number;
}) {
  return (
    <Svg
      width={90 * scale}
      height={44 * scale}
      viewBox="0 0 90 44"
      style={{ position: "absolute", left: x, top: y, opacity }}
    >
      <G fill="#FFE7A0">
        <Circle cx="24" cy="26" r="16" />
        <Circle cx="44" cy="20" r="20" />
        <Circle cx="66" cy="27" r="15" />
        <Rect x="20" y="30" width="50" height="14" rx="7" />
      </G>
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Mascot bird                                                         */
/* ------------------------------------------------------------------ */
function RuyaBird() {
  return (
    <Svg width={210} height={230} viewBox="0 0 210 230">
      <Defs>
        <SvgGradient id="body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFDE5E" />
          <Stop offset="1" stopColor="#FBBF24" />
        </SvgGradient>
        <SvgGradient id="belly" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFF1B8" />
          <Stop offset="1" stopColor="#FFE08A" />
        </SvgGradient>
      </Defs>

      {/* left raised wing */}
      <Path
        d="M58 96C30 86 6 92 4 112c-2 18 18 34 46 30 14-2 22-10 22-22 0-12-2-20-14-24Z"
        fill="#F6B41E"
      />
      {/* right raised wing */}
      <Path
        d="M150 96c28-10 52-4 54 16 2 18-18 34-46 30-14-2-22-10-22-22 0-12 2-20 14-24Z"
        fill="#F6B41E"
      />

      {/* body */}
      <Ellipse cx="105" cy="128" rx="74" ry="78" fill="url(#body)" />
      {/* belly */}
      <Ellipse cx="105" cy="142" rx="50" ry="56" fill="url(#belly)" />

      {/* head tuft feathers */}
      <Path
        d="M86 46c-6-16 2-30 2-30 8 6 12 14 13 22M105 40c-2-18 8-30 8-30 6 8 7 18 5 27M124 48c4-15 16-22 16-22 2 9-1 19-7 26"
        fill="#FBBF24"
        stroke="#F6B41E"
        strokeWidth="2"
      />

      {/* open eye (right) */}
      <Circle cx="122" cy="108" r="22" fill="#FFFFFF" />
      <Circle cx="126" cy="110" r="13" fill="#3A2A14" />
      <Circle cx="131" cy="105" r="4.5" fill="#FFFFFF" />

      {/* winking eye (left) */}
      <Path
        d="M70 110c5-7 16-8 22-2"
        fill="none"
        stroke="#3A2A14"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* cheeks */}
      <Circle cx="74" cy="132" r="9" fill="#FFB36B" opacity={0.5} />
      <Circle cx="140" cy="132" r="9" fill="#FFB36B" opacity={0.5} />

      {/* beak */}
      <Path d="M92 122h26l-13 16-13-16Z" fill="#FF9500" />
      <Path d="M99 132h12l-6 8-6-8Z" fill="#E07B00" />

      {/* feet */}
      <Path
        d="M88 200l-6 16M96 202v18M84 216h16"
        stroke="#FF9500"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <Path
        d="M124 200l6 16M118 202v18M114 216h16"
        stroke="#FF9500"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson icons                                                        */
/* ------------------------------------------------------------------ */
function BookIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 48 48">
      <Path d="M8 12c6-3 12-3 16 1 4-4 10-4 16-1v26c-6-3-12-3-16 0-4-3-10-3-16 0V12Z" fill="#F4EBDA" />
      <Path d="M24 13v25" stroke="#C9BFA8" strokeWidth="2" />
      <Path d="M12 18h8M12 24h8M28 18h8M28 24h8" stroke="#C9BFA8" strokeWidth="2" strokeLinecap="round" />
      <Path d="M6 11l18 3 18-3 2 4-20 3-20-3 2-4Z" fill="#6C7BE0" />
    </Svg>
  );
}

function HeadphonesIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 48 48">
      <Path d="M10 28v-4a14 14 0 0128 0v4" fill="none" stroke="#6C7BE0" strokeWidth="4" strokeLinecap="round" />
      <Rect x="6" y="26" width="9" height="16" rx="4.5" fill="#7C5CFC" />
      <Rect x="33" y="26" width="9" height="16" rx="4.5" fill="#7C5CFC" />
      <Rect x="8" y="29" width="5" height="10" rx="2.5" fill="#4B3BB5" />
      <Rect x="35" y="29" width="5" height="10" rx="2.5" fill="#4B3BB5" />
    </Svg>
  );
}

function ChatIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 48 48">
      <Path d="M6 12h26a4 4 0 014 4v10a4 4 0 01-4 4H18l-9 7v-7H6a4 4 0 01-4-4V16a4 4 0 014-4Z" fill="#6C7BE0" />
      <Circle cx="13" cy="21" r="2.4" fill="#FFFFFF" />
      <Circle cx="20" cy="21" r="2.4" fill="#FFFFFF" />
      <Circle cx="27" cy="21" r="2.4" fill="#FFFFFF" />
      <Path d="M30 26h12a4 4 0 014 4v8a4 4 0 01-4 4h-2v5l-7-5h-3a4 4 0 01-4-4" fill="#9AA6F0" />
    </Svg>
  );
}

function CheckBadge() {
  return (
    <View style={s.checkBadge}>
      <Svg width={16} height={16} viewBox="0 0 24 24">
        <Path d="M5 13l4 4 10-10" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

function LockIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Rect x="5" y="10" width="14" height="10" rx="3" fill={C.lockIcon} />
      <Path d="M8 10V8a4 4 0 018 0v2" fill="none" stroke={C.lockIcon} strokeWidth="2.6" />
    </Svg>
  );
}

function XpStar() {
  return (
    <Svg width={58} height={58} viewBox="0 0 64 64">
      <Defs>
        <SvgGradient id="star" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFD64A" />
          <Stop offset="1" stopColor="#FF9F1C" />
        </SvgGradient>
      </Defs>
      <Path
        d="M32 3l8 17 19 2-14 13 4 19-17-10-17 10 4-19L5 22l19-2 8-17Z"
        fill="url(#star)"
        stroke="#F08A00"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronCircle() {
  return (
    <View style={s.arrowBtn}>
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path d="M9 5l8 7-8 7" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Lesson card                                                         */
/* ------------------------------------------------------------------ */
type Lesson = {
  num: number;
  title: string;
  crowns: string;
  icon: React.ReactNode;
  completed?: boolean;
  locked?: boolean;
};

function LessonCard({ lesson }: { lesson: Lesson }) {
  return (
    <Pressable style={s.lessonCard}>
      <View style={s.lessonIconWrap}>
        <View style={s.lessonIconCircle}>{lesson.icon}</View>
        {lesson.completed ? <CheckBadge /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.lessonNum}>Урок {lesson.num}</Text>
        <Text style={s.lessonTitle}>{lesson.title}</Text>
        <View style={s.crownRow}>
          <Text style={s.crown}>👑</Text>
          <Text style={s.crownText}>{lesson.crowns}</Text>
        </View>
      </View>
      {lesson.locked ? (
        <View style={s.lockBtn}>
          <LockIcon />
        </View>
      ) : (
        <ChevronCircle />
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */
const LESSONS: Lesson[] = [
  { num: 1, title: "Приветствие", crowns: "3/3", icon: <BookIcon />, completed: true },
  { num: 2, title: "Слова и фразы", crowns: "2/3", icon: <HeadphonesIcon />, locked: true },
  { num: 3, title: "Практика", crowns: "0/3", icon: <ChatIcon />, locked: true },
];

export default function HomeRuyaPro() {
  return (
    <LinearGradient colors={[C.bgTop, C.bgBottom]} style={s.root}>
      <StatusBar barStyle="dark-content" />

      {/* background decor */}
      <Cloud x={250} y={150} scale={1.1} opacity={0.5} />
      <Cloud x={-10} y={120} scale={0.8} opacity={0.45} />
      <Sparkle x={120} y={160} size={16} color="#FFE7A0" opacity={0.9} />
      <Sparkle x={300} y={250} size={12} color="#FFFFFF" opacity={0.8} />
      <Sparkle x={40} y={300} size={13} color="#FFFFFF" opacity={0.7} />
      <Sparkle x={330} y={470} size={14} color="#FFFFFF" opacity={0.75} />
      <Sparkle x={30} y={520} size={12} color="#FFFFFF" opacity={0.7} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* ---------- Header ---------- */}
        <View style={s.header}>
          <View style={s.logoWrap}>
            <Text style={s.logo}>ruya</Text>
            <View style={s.logoDot} />
          </View>

          <View style={s.statsCard}>
            <View style={s.statItem}>
              <Text style={s.statEmoji}>🔥</Text>
              <View>
                <Text style={s.statNum}>7</Text>
                <Text style={s.statLabel}>дней подряд</Text>
              </View>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statEmoji}>💎</Text>
              <View>
                <Text style={s.statNum}>230</Text>
                <Text style={s.statLabel}>очки</Text>
              </View>
            </View>
          </View>

          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={{ fontSize: 30 }}>🧒</Text>
            </View>
            <View style={s.crownBadge}>
              <Text style={{ fontSize: 13 }}>👑</Text>
            </View>
          </View>
        </View>

        {/* ---------- Hero ---------- */}
        <View style={s.hero}>
          <View style={s.birdWrap}>
            <RuyaBird />
          </View>
          <View style={s.bubble}>
            <Text style={s.bubbleTitle}>Привет! 👋</Text>
            <Text style={s.bubbleText}>
              Давай учить языки{"\n"}вместе с <Text style={s.bubbleAccent}>Ruya</Text>!
            </Text>
            <View style={s.bubbleTail} />
          </View>
        </View>

        {/* ---------- Goal ---------- */}
        <View style={s.goalCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.goalLabel}>Твоя цель на сегодня</Text>
            <Text style={s.goalXp}>15 / 20 XP</Text>
            <View style={s.goalTrack}>
              <LinearGradient
                colors={[C.fillA, C.fillB]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[s.goalFill, { width: "75%" }]}
              />
            </View>
          </View>
          <View style={s.xpStarWrap}>
            <XpStar />
            <Text style={s.xpStarText}>XP</Text>
          </View>
        </View>

        {/* ---------- Lessons ---------- */}
        <View style={s.lessonList}>
          {LESSONS.map((l) => (
            <LessonCard key={l.num} lesson={l} />
          ))}
        </View>

        {/* ---------- Treasure chest ---------- */}
        <View style={s.chestWrap}>
          <View style={s.pedestal} />
          <Text style={s.chest}>🧰</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */
const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40 },

  /* header */
  header: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  logoWrap: { width: 92 },
  logo: { fontSize: 38, fontWeight: "900", color: C.ink, letterSpacing: -1 },
  logoDot: {
    position: "absolute",
    right: 8,
    top: 2,
    width: 10,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.ink,
    transform: [{ rotate: "35deg" }],
  },
  statsCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.card,
    borderRadius: 22,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginHorizontal: 10,
    shadowColor: "#C98A00",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 7 },
  statEmoji: { fontSize: 22 },
  statNum: { fontSize: 18, fontWeight: "900", color: C.ink, lineHeight: 20 },
  statLabel: { fontSize: 10, fontWeight: "700", color: C.muted },
  statDivider: { width: 1, height: 30, backgroundColor: "#EFE8D4", marginHorizontal: 12 },

  avatarWrap: { width: 56, height: 56 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFE08A",
    borderWidth: 3,
    borderColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  crownBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C98A00",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },

  /* hero */
  hero: { flexDirection: "row", marginTop: 18, minHeight: 230 },
  birdWrap: { marginLeft: -14, marginTop: 6 },
  bubble: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 26,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginTop: 20,
    marginLeft: -6,
    alignSelf: "flex-start",
    shadowColor: "#C98A00",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  bubbleTail: {
    position: "absolute",
    left: -10,
    top: 34,
    width: 22,
    height: 22,
    backgroundColor: C.card,
    transform: [{ rotate: "45deg" }],
    borderRadius: 5,
  },
  bubbleTitle: { fontSize: 26, fontWeight: "900", color: C.ink, marginBottom: 6 },
  bubbleText: { fontSize: 19, fontWeight: "700", color: C.ink, lineHeight: 26 },
  bubbleAccent: { color: C.orange, fontWeight: "900" },

  /* goal */
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 26,
    padding: 18,
    marginTop: 22,
    shadowColor: "#C98A00",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  goalLabel: { fontSize: 14, fontWeight: "700", color: C.muted },
  goalXp: { fontSize: 28, fontWeight: "900", color: C.ink, marginVertical: 8 },
  goalTrack: {
    height: 14,
    borderRadius: 10,
    backgroundColor: C.track,
    overflow: "hidden",
  },
  goalFill: { height: "100%", borderRadius: 10 },
  xpStarWrap: { width: 64, height: 64, alignItems: "center", justifyContent: "center", marginLeft: 8 },
  xpStarText: {
    position: "absolute",
    fontSize: 14,
    fontWeight: "900",
    color: "#7A4A00",
  },

  /* lessons */
  lessonList: { marginTop: 22, gap: 16 },
  lessonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 28,
    padding: 14,
    shadowColor: "#C98A00",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  lessonIconWrap: { width: 72, height: 72, marginRight: 14 },
  lessonIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#FFD23E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFE08A",
  },
  checkBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: C.card,
  },
  lessonNum: { fontSize: 14, fontWeight: "800", color: C.orangeText },
  lessonTitle: { fontSize: 21, fontWeight: "900", color: C.ink, marginVertical: 2 },
  crownRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  crown: { fontSize: 15 },
  crownText: { fontSize: 15, fontWeight: "800", color: C.muted },

  arrowBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.orangeDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  lockBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.lockBg,
    alignItems: "center",
    justifyContent: "center",
  },

  /* chest */
  chestWrap: { alignItems: "center", marginTop: 30 },
  pedestal: {
    width: 150,
    height: 30,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.55)",
    position: "absolute",
    bottom: 0,
  },
  chest: { fontSize: 76 },
});
