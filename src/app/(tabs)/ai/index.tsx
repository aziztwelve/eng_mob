import React from "react";
import { Pressable, ScrollView, Text, View, StyleSheet, StatusBar } from "react-native";
import { Stack, useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { glass, SunsetHeader, SunsetSubhead, SunsetOwl, CtaButton, GoArrow } from "@/components/sunset";

const FEATURES = [
  { href: "/ai/chat", emoji: "💬", title: "Свободный чат", desc: "Поговори с AI на изучаемом языке. История сохраняется." },
  { href: "/ai/roleplay", emoji: "🎭", title: "Roleplay", desc: "Ресторан, аэропорт, работа — выбери сценарий." },
  { href: "/ai/writing", emoji: "📝", title: "Проверить эссе", desc: "Оценка по 4 параметрам, исправленный текст и фидбэк." },
  { href: "/ai/pronunciation", emoji: "🗣️", title: "Произношение", desc: "Скажи фразу — AI оценит акцент и подскажет." },
] as const;

export default function AIHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 + insets.bottom }}
      >
        <SunsetHeader title="AI помощник" />

        <SunsetSubhead title="Инструменты" />

        <View style={{ gap: 14 }}>
          {FEATURES.map((f) => (
            <Pressable key={f.href} onPress={() => router.push(f.href as Href)} style={[s.card, glass]}>
              <View style={s.thumb}>
                <Text style={{ fontSize: 30 }}>{f.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{f.title}</Text>
                <Text style={s.cardDesc}>{f.desc}</Text>
              </View>
              <GoArrow />
            </Pressable>
          ))}
        </View>

        {/* Совет дня banner */}
        <View style={[s.banner, glass]}>
          <SunsetOwl size={78} />
          <View style={{ flex: 1 }}>
            <View style={s.tipPill}>
              <Text style={s.tipPillText}>🤖 Совет дня</Text>
            </View>
            <Text style={s.bannerTitle}>Попробуй Roleplay: кафе</Text>
            <Text style={s.bannerText}>5 реплик — и закрепишь 8 новых слов.</Text>
            <View style={{ marginTop: 11 }}>
              <CtaButton label="Начать 🎭" onPress={() => router.push("/ai/roleplay" as Href)} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 24 },
  thumb: {
    width: 66, height: 66, borderRadius: 18, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  cardDesc: { color: "rgba(255,255,255,0.78)", fontSize: 13, fontWeight: "600", marginTop: 4, lineHeight: 18 },

  banner: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 22, paddingVertical: 16, paddingHorizontal: 18, borderRadius: 24 },
  tipPill: { alignSelf: "flex-start", backgroundColor: "rgba(0,0,0,0.22)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 8 },
  tipPillText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  bannerTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  bannerText: { color: "rgba(255,255,255,0.82)", fontSize: 13, fontWeight: "600", marginTop: 5, lineHeight: 18 },
});
