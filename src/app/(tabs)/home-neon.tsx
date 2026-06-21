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
import Svg, { Path, Circle, Ellipse } from "react-native-svg";
import { Flame, Gem, Zap, Repeat2, Compass, Sparkles } from "lucide-react-native";

type SectionHeaderProps = {
  icon: React.ReactNode;
  title: string;
  action?: string;
};

function SectionHeader({ icon, title, action }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconBox}>
        {icon}
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable style={styles.sectionActionWrap}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type QuickCardProps = {
  icon: string;
  title: string;
  subtitle: string;
  badge: string;
  variant: "flash" | "memory";
};

function QuickCard({ icon, title, subtitle, badge, variant }: QuickCardProps) {
  const isFlash = variant === "flash";

  return (
    <LinearGradient
      colors={isFlash ? ["#102F2B", "#10141F"] : ["#302511", "#10141F"]}
      style={[
        styles.quickCard,
        isFlash ? styles.quickCardFlash : styles.quickCardMemory,
      ]}
    >
      <View
        style={[
          styles.quickBadge,
          isFlash ? styles.quickBadgeFlash : styles.quickBadgeMemory,
        ]}
      >
        <Text
          style={[
            styles.quickBadgeText,
            isFlash ? styles.quickBadgeFlashText : styles.quickBadgeMemoryText,
          ]}
        >
          {badge}
        </Text>
      </View>

      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSubtitle}>{subtitle}</Text>
    </LinearGradient>
  );
}

type TrackCardProps = {
  icon: string;
  title: string;
  progress: number;
  colors: [string, string];
  progressColor: string;
};

function TrackCard({
  icon,
  title,
  progress,
  colors,
  progressColor,
}: TrackCardProps) {
  return (
    <LinearGradient colors={colors} style={styles.trackCard}>
      <Text style={styles.trackIcon}>{icon}</Text>
      <View style={styles.trackFooter}>
        <Text style={styles.trackTitle}>{title}</Text>
        <View style={styles.trackProgressBg}>
          <View
            style={[
              styles.trackProgressFill,
              { width: `${progress}%`, backgroundColor: progressColor },
            ]}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

function OwlMascot() {
  return (
    <View style={styles.owlWrap}>
      <Svg width={76} height={82} viewBox="0 0 90 95">
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
  );
}

export default function HomeScreen() {
  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <View style={styles.screen}>
        <View style={styles.bgGlowGreen} />
        <View style={styles.bgGlowPurple} />
        <View style={styles.bgGlowBlue} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Flame size={18} color="#FF9D54" fill="#FF9D54" />
              <Text style={[styles.statValue, { color: "#FF9D54" }]}>7</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={[styles.statIcon, { color: "#FF538C" }]}>♥</Text>
              <Text style={[styles.statValue, { color: "#FF538C" }]}>5</Text>
            </View>
            <View style={styles.statChip}>
              <Gem size={18} color="#36D7FF" fill="#36D7FF" />
              <Text style={[styles.statValue, { color: "#36D7FF" }]}>320</Text>
            </View>
            <View style={{ flex: 1 }} />
            <LinearGradient
              colors={["#FFE55A", "#FFC85B", "#FFAE3E"]}
              style={[styles.statChip, { borderWidth: 0, minWidth: 77 }]}
            >
              <Sparkles size={15} color="#FFF3B0" fill="#FFF3B0" />
              <Text style={{ color: "#111", fontSize: 14, fontWeight: "900" }}>LV 1</Text>
            </LinearGradient>
          </View>

          <View style={styles.brandRow}>
            <View style={styles.brandCopy}>
              <Text style={styles.brandText}>LingoIQ</Text>
              <Text style={styles.greeting}>
                Привет, Камол 👋 Сегодня цель — 20 XP
              </Text>
            </View>

            <View style={styles.planPill}>
              <Text style={styles.planLabel}>План</Text>
              <Text style={styles.planValue}>38%</Text>
            </View>
          </View>

          <LinearGradient
            colors={["#09352D", "#102536", "#1B1E3B"]}
            locations={[0, 0.5, 1]}
            style={styles.heroCard}
          >
            <View style={styles.heroGlow} />
            <View style={styles.heroTopRow}>
              <View style={styles.darkPill}>
                <Text style={styles.darkPillText}>🧠 Память растёт</Text>
              </View>

              <LinearGradient
                colors={["#FFE060", "#FFB449"]}
                style={styles.xpPill}
              >
                <Text style={styles.xpText}>+20 XP</Text>
              </LinearGradient>
            </View>

            <Text style={styles.heroTitle}>Сегодня: повторить 18 карт</Text>
            <Text style={styles.heroSubtitle}>
              Сначала флешкарты, потом короткий трек на 5 минут.
            </Text>

            <Pressable>
              <LinearGradient
                colors={["#06FFC1", "#31D9E9"]}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaText}>НАЧАТЬ</Text>
              </LinearGradient>
            </Pressable>

            <OwlMascot />
          </LinearGradient>

          <View style={styles.section}>
            <SectionHeader icon={<Zap size={17} color="#05FFC1" fill="#05FFC1" />} title="Быстрый старт" />
            <View style={styles.quickGrid}>
              <QuickCard
                icon="🃏"
                title="Флешкарты"
                subtitle="Повтори слова, которые скоро забудутся"
                badge="18"
                variant="flash"
              />
              <QuickCard
                icon="🧠"
                title="Память"
                subtitle="Сильные и слабые слова за неделю"
                badge="82%"
                variant="memory"
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader icon={<Repeat2 size={17} color="#05FFC1" />} title="Повторение" action="Все →" />
            <View style={styles.memoryStrip}>
              <LinearGradient
                colors={["#11141D", "#17142B"]}
                style={styles.reviewCard}
              >
                <View style={styles.reviewTopRow}>
                  <Text style={styles.reviewTitle}>К повтору</Text>
                  <Text style={styles.reviewCount}>18</Text>
                </View>
                <Text style={styles.reviewText}>
                  Новые слова из последних уроков. Лучше пройти сейчас.
                </Text>
                <Pressable style={styles.smallButton}>
                  <Text style={styles.smallButtonText}>Открыть карты</Text>
                </Pressable>
              </LinearGradient>

              <LinearGradient
                colors={["#2A161F", "#141017"]}
                style={styles.streakCard}
              >
                <Text style={styles.streakNumber}>7🔥</Text>
                <Text style={styles.streakLabel}>дней серия</Text>
                <Text style={styles.streakSub}>Осталось 8 XP до цели дня</Text>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader icon={<Compass size={17} color="#FFD84A" />} title="Треки" action="Все →" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tracksRow}
            >
              <TrackCard
                icon="🗣️"
                title="Разговор"
                progress={64}
                colors={["#0D392F", "#0A221D"]}
                progressColor="#05FFC1"
              />
              <TrackCard
                icon="✈️"
                title="Путешествие"
                progress={38}
                colors={["#421B2B", "#231019"]}
                progressColor="#FF7AA2"
              />
              <TrackCard
                icon="☕"
                title="Кафе"
                progress={22}
                colors={["#2B1B4A", "#17102A"]}
                progressColor="#8C76FF"
              />
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#02050B",
  },
  screen: {
    flex: 1,
    backgroundColor: "#070A12",
    overflow: "hidden",
  },
  bgGlowGreen: {
    position: "absolute",
    top: -80,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(0,255,193,0.10)",
  },
  bgGlowPurple: {
    position: "absolute",
    top: -80,
    right: -90,
    width: 360,
    height: 300,
    borderRadius: 180,
    backgroundColor: "rgba(122,64,255,0.16)",
  },
  bgGlowBlue: {
    position: "absolute",
    right: -90,
    bottom: 120,
    width: 380,
    height: 260,
    borderRadius: 190,
    backgroundColor: "rgba(44,70,140,0.16)",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 116,
  },
  statsRow: {
    marginTop: 14,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statChip: {
    minWidth: 62,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.105)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  statIcon: {
    fontSize: 18,
    fontWeight: "900",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "900",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  brandCopy: {
    flex: 1,
  },
  brandText: {
    color: "#05FFC1",
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  greeting: {
    marginTop: 4,
    color: "#AEB8CB",
    fontSize: 14.5,
    lineHeight: 21,
  },
  planPill: {
    marginTop: 3,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "rgba(0,255,193,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,255,193,0.23)",
    alignItems: "center",
  },
  planLabel: {
    color: "#B7FFF0",
    fontSize: 12,
    fontWeight: "900",
  },
  planValue: {
    marginTop: 2,
    color: "#05FFC1",
    fontSize: 15,
    fontWeight: "900",
  },
  heroCard: {
    marginTop: 20,
    minHeight: 178,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,255,193,0.45)",
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    right: -20,
    bottom: -10,
    width: 180,
    height: 150,
    borderRadius: 90,
    backgroundColor: "rgba(0,255,193,0.16)",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 13,
  },
  darkPill: {
    height: 26,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.48)",
    justifyContent: "center",
  },
  darkPillText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  xpPill: {
    marginLeft: "auto",
    height: 30,
    paddingHorizontal: 16,
    borderRadius: 15,
    justifyContent: "center",
  },
  xpText: {
    color: "#17100A",
    fontSize: 15,
    fontWeight: "900",
  },
  heroTitle: {
    maxWidth: 225,
    color: "#F7F7FB",
    fontSize: 25,
    lineHeight: 27,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    marginTop: 8,
    maxWidth: 215,
    color: "#D7DDE8",
    fontSize: 14.2,
    lineHeight: 20,
    fontWeight: "500",
  },
  ctaButton: {
    marginTop: 14,
    width: 184,
    height: 44,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#061112",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  owlWrap: {
    position: "absolute",
    right: 18,
    bottom: 8,
    width: 76,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginTop: 22,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  sectionIconBox: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: "#06362F",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionIcon: {
    fontSize: 17,
  },
  sectionTitle: {
    color: "#F7F7FB",
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  sectionActionWrap: {
    marginLeft: "auto",
  },
  sectionAction: {
    color: "#05FFC1",
    fontSize: 14,
    fontWeight: "900",
  },
  quickGrid: {
    flexDirection: "row",
    gap: 12,
  },
  quickCard: {
    flex: 1,
    minHeight: 124,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  quickCardFlash: {
    borderColor: "rgba(0,255,193,0.23)",
  },
  quickCardMemory: {
    borderColor: "rgba(255,216,74,0.20)",
  },
  quickBadge: {
    position: "absolute",
    right: 12,
    top: 12,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quickBadgeFlash: {
    backgroundColor: "rgba(0,255,193,0.13)",
  },
  quickBadgeMemory: {
    backgroundColor: "rgba(255,216,74,0.14)",
  },
  quickBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },
  quickBadgeFlashText: {
    color: "#05FFC1",
  },
  quickBadgeMemoryText: {
    color: "#FFD84A",
  },
  quickIcon: {
    fontSize: 27,
    marginBottom: 10,
  },
  quickTitle: {
    color: "#F7F7FB",
    fontSize: 17,
    lineHeight: 19,
    fontWeight: "900",
    marginBottom: 7,
  },
  quickSubtitle: {
    color: "#AEB8CB",
    fontSize: 12.5,
    lineHeight: 16,
    fontWeight: "600",
  },
  memoryStrip: {
    flexDirection: "row",
    gap: 12,
  },
  reviewCard: {
    flex: 1.1,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(140,118,255,0.22)",
  },
  reviewTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  reviewTitle: {
    color: "#F7F7FB",
    fontSize: 16,
    fontWeight: "900",
  },
  reviewCount: {
    color: "#FFD84A",
    fontSize: 22,
    fontWeight: "900",
  },
  reviewText: {
    color: "#AEB8CB",
    fontSize: 12.8,
    lineHeight: 17,
    marginBottom: 13,
  },
  smallButton: {
    height: 34,
    alignSelf: "flex-start",
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: "rgba(0,255,193,0.12)",
    justifyContent: "center",
  },
  smallButtonText: {
    color: "#05FFC1",
    fontWeight: "900",
    fontSize: 12.5,
  },
  streakCard: {
    flex: 0.9,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(255,79,136,0.22)",
  },
  streakNumber: {
    color: "#FF7AA2",
    fontSize: 34,
    lineHeight: 36,
    fontWeight: "900",
  },
  streakLabel: {
    marginTop: 5,
    color: "#D4D8E2",
    fontSize: 13,
    fontWeight: "800",
  },
  streakSub: {
    marginTop: 9,
    color: "#8F98AD",
    fontSize: 12,
    lineHeight: 16,
  },
  tracksRow: {
    gap: 13,
    paddingRight: 18,
  },
  trackCard: {
    width: 150,
    height: 128,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  trackIcon: {
    fontSize: 40,
    lineHeight: 44,
  },
  trackFooter: {
    marginTop: "auto",
  },
  trackTitle: {
    color: "#F7F7FB",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 6,
  },
  trackProgressBg: {
    height: 5,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  trackProgressFill: {
    height: "100%",
    borderRadius: 99,
  },
});
