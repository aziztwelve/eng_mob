import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";

const lessons = [
  { id: 1, title: "Приветствие", progress: "3/3", icon: "📖", completed: true },
  { id: 2, title: "Слова и фразы", progress: "2/3", icon: "🎧" },
  { id: 3, title: "Практика", progress: "0/3", icon: "💬" },
];

export default function HomeScreen() {
  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <Text style={s.logo}>LingoIQ</Text>
          <View style={s.stats}>
            <Text style={s.statText}>🔥 7</Text>
            <Text style={s.statText}>💎 230</Text>
          </View>
        </View>

        <View style={s.hero}>
          <Text style={s.heroTitle}>Привет! 👋</Text>
          <Text style={s.heroText}>Давай учить языки вместе с LingoIQ!</Text>
        </View>

        <View style={s.goalCard}>
          <Text style={s.goalLabel}>Твоя цель на сегодня</Text>
          <Text style={s.goalXp}>15 / 20 XP</Text>
          <View style={s.progressBg}>
            <View style={s.progressFill} />
          </View>
        </View>

        <Text style={s.sectionTitle}>Твой путь</Text>

        {lessons.map((lesson) => (
          <TouchableOpacity key={lesson.id} style={s.lessonCard}>
            <View style={s.lessonIcon}>
              <Text style={{ fontSize: 24 }}>{lesson.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.lessonNumber}>Урок {lesson.id}</Text>
              <Text style={s.lessonTitle}>{lesson.title}</Text>
              <Text style={s.lessonProgress}>⭐ {lesson.progress}</Text>
            </View>
            <Text style={s.arrow}>{lesson.completed ? "✓" : "›"}</Text>
          </TouchableOpacity>
        ))}

        <View style={s.chest}>
          <Text style={{ fontSize: 48 }}>🎁</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFD83B" },
  scroll: { paddingBottom: 20 },

  header: { padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logo: { fontSize: 40, fontWeight: "900", color: "#1F1F1F" },
  stats: { backgroundColor: "#FFF", padding: 12, borderRadius: 20, flexDirection: "row", gap: 16 },
  statText: { fontSize: 15, fontWeight: "600" },

  hero: { marginHorizontal: 20, marginBottom: 20 },
  heroTitle: { fontSize: 34, fontWeight: "800", color: "#222" },
  heroText: { fontSize: 18, marginTop: 10, color: "#333" },

  goalCard: { backgroundColor: "#FFF", marginHorizontal: 20, borderRadius: 24, padding: 20 },
  goalLabel: { color: "#666", fontSize: 14 },
  goalXp: { fontSize: 30, fontWeight: "800", marginVertical: 10 },
  progressBg: { height: 12, backgroundColor: "#EEE", borderRadius: 20, overflow: "hidden" },
  progressFill: { width: "75%", height: 12, borderRadius: 20, backgroundColor: "#FFC107" },

  sectionTitle: { fontSize: 28, fontWeight: "800", margin: 20, color: "#222" },

  lessonCard: {
    backgroundColor: "#FFF", marginHorizontal: 20, marginBottom: 16,
    borderRadius: 24, padding: 16, flexDirection: "row", alignItems: "center",
  },
  lessonIcon: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: "#FFD83B",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  lessonNumber: { color: "#F6A800", fontWeight: "700", fontSize: 13 },
  lessonTitle: { fontSize: 22, fontWeight: "800", marginVertical: 4, color: "#222" },
  lessonProgress: { color: "#777", fontSize: 14 },
  arrow: { fontSize: 30, fontWeight: "800", color: "#333" },

  chest: { alignItems: "center", marginVertical: 30 },
});
