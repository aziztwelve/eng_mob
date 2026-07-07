import React, { useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, TextInput, View, StyleSheet, StatusBar } from "react-native";
import { Stack, useRouter, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import Toast from "react-native-toast-message";
import { Send, Square } from "lucide-react-native";
import type { Icon as PhosphorIcon } from "phosphor-react-native";
import { Translate } from "phosphor-react-native/src/icons/Translate";
import { Lightbulb } from "phosphor-react-native/src/icons/Lightbulb";
import { ChatsCircle } from "phosphor-react-native/src/icons/ChatsCircle";
import { Books } from "phosphor-react-native/src/icons/Books";
import { ChatCircle } from "phosphor-react-native/src/icons/ChatCircle";
import { MaskHappy } from "phosphor-react-native/src/icons/MaskHappy";
import { PencilLine } from "phosphor-react-native/src/icons/PencilLine";
import { Microphone } from "phosphor-react-native/src/icons/Microphone";
import { Sparkle } from "phosphor-react-native/src/icons/Sparkle";
import Svg, { Circle, Polyline, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";

import { useUserStats } from "@/hooks/use-user-stats";
import { useStartConversation, useTranscribeAudio } from "@/hooks/use-ai";
import { DEFAULT_TARGET_LANG } from "@/lib/ai-languages";
import { glass, GOLD, SunsetOwl } from "@/components/sunset";

/* ------------------------------------------------------------------ */
/* Фон — берётся из макета (тёмно-фиолетовый верх → оранжевый низ).     */
/* Применяется ТОЛЬКО к этому экрану.                                  */
/* ------------------------------------------------------------------ */
const AI_BG = ["#100626", "#2C0B42", "#6E1C32", "#C2400F"] as const;
const AI_BG_LOC = [0, 0.4, 0.72, 1] as const;
const SEND = ["#7C5CFF", "#5B36E0"] as const;

/* STT — формат записи под Google STT (как в chat-input). */
const STT_SR = 16000;
const STT_REC_OPTS: Audio.RecordingOptions = {
  isMeteringEnabled: false,
  android: { extension: ".amr", outputFormat: Audio.AndroidOutputFormat.AMR_WB, audioEncoder: Audio.AndroidAudioEncoder.AMR_WB, sampleRate: STT_SR, numberOfChannels: 1, bitRate: 23850 },
  ios: { extension: ".wav", outputFormat: Audio.IOSOutputFormat.LINEARPCM, audioQuality: Audio.IOSAudioQuality.HIGH, sampleRate: STT_SR, numberOfChannels: 1, bitRate: 256000, linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false },
  web: { mimeType: "audio/webm", bitsPerSecond: 128000 },
};
function sttMeta(): { encoding: string; sampleRate: number; type: string; name: string } {
  if (Platform.OS === "ios") return { encoding: "LINEAR16", sampleRate: STT_SR, type: "audio/wav", name: "rec.wav" };
  if (Platform.OS === "web") return { encoding: "WEBM_OPUS", sampleRate: 48000, type: "audio/webm", name: "rec.webm" };
  return { encoding: "AMR_WB", sampleRate: STT_SR, type: "audio/amr-wb", name: "rec.amr" };
}

/* ------------------------------------------------------------------ */
/* Данные                                                              */
/* ------------------------------------------------------------------ */
type Quick = { title: string; sub: string; Icon: PhosphorIcon; tint: string; href: Href };

// Быстрые категории из макета. Каждая ведёт на реальный существующий экран.
const QUICK: Quick[] = [
  { title: "Перевод", sub: "слов и фраз", Icon: Translate, tint: "#5B6BFF", href: "/ai/tutor" },
  { title: "Объяснение", sub: "правил", Icon: Lightbulb, tint: "#F5A623", href: "/ai/tutor" },
  { title: "Практика", sub: "с диалогами", Icon: ChatsCircle, tint: "#3FA9FF", href: "/ai/roleplay" },
  { title: "Примеры", sub: "предложений", Icon: Books, tint: "#F2542D", href: "/ai/chat" },
];

// Существующие инструменты — сохраняем доступ ко всем.
type Tool = { title: string; desc: string; Icon: PhosphorIcon; tint: string; href: Href };
const TOOLS: Tool[] = [
  { title: "Свободный чат", desc: "Поговори с AI на изучаемом языке", Icon: ChatCircle, tint: "#3FA9FF", href: "/ai/chat" },
  { title: "Roleplay", desc: "Ресторан, аэропорт, работа", Icon: MaskHappy, tint: "#F25B6E", href: "/ai/roleplay" },
  { title: "Проверить эссе", desc: "Оценка, исправления и фидбэк", Icon: PencilLine, tint: "#F5A623", href: "/ai/writing" },
  { title: "Произношение", desc: "Скажи фразу — AI оценит акцент", Icon: Microphone, tint: "#2EC4A0", href: "/ai/pronunciation" },
];

/* ------------------------------------------------------------------ */
/* Кольцо прогресса (SVG)                                              */
/* ------------------------------------------------------------------ */
function ProgressRing({ pct, size = 66, stroke = 7 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  const cx = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFE16A" />
            <Stop offset="1" stopColor="#FF8A3D" />
          </SvgGradient>
        </Defs>
        <Circle cx={cx} cy={cx} r={r} stroke="rgba(255,255,255,0.16)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={cx}
          cy={cx}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </Svg>
      <Text style={s.ringText}>{pct}%</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* AskBar — текст/голос → новый свободный чат                          */
/* ------------------------------------------------------------------ */
function AskBar() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const recRef = useRef<Audio.Recording | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startMut = useStartConversation();
  const transcribeMut = useTranscribeAudio();
  const busy = startMut.isPending;
  const transcribing = transcribeMut.isPending;

  const createChat = async (firstMessage: string) => {
    const msg = firstMessage.trim();
    if (!msg || busy) return;
    try {
      const resp = await startMut.mutateAsync({ scenario: "free_chat", target_language: DEFAULT_TARGET_LANG });
      setText("");
      router.push(`/ai/chat/${resp.conversation.id}?draft=${encodeURIComponent(msg)}` as Href);
    } catch (e) {
      Toast.show({ type: "error", text1: "Не удалось создать чат", text2: e instanceof Error ? e.message : undefined });
    }
  };

  const startRec = async () => {
    if (busy || transcribing) return;
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) { Toast.show({ type: "error", text1: "Нет доступа к микрофону" }); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(STT_REC_OPTS);
      recRef.current = rec;
      setRecording(true);
      let elapsed = 0;
      tickRef.current = setInterval(() => { elapsed += 1; if (elapsed >= 60) stopRec(); }, 1000);
    } catch (e) { console.error("rec failed", e); Toast.show({ type: "error", text1: "Не удалось начать запись" }); }
  };

  const stopRec = async () => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    const rec = recRef.current;
    recRef.current = null;
    setRecording(false);
    if (!rec) return;
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true }).catch(() => {});
      if (!uri) return;
      const meta = sttMeta();
      const out = await transcribeMut.mutateAsync({ audio: { uri, type: meta.type, name: meta.name }, language: DEFAULT_TARGET_LANG, encoding: meta.encoding, sample_rate: meta.sampleRate });
      const recognized = out.text?.trim();
      if (!recognized) { Toast.show({ type: "info", text1: "Речь не распознана" }); return; }
      setText((prev) => (prev.trim() ? `${prev.trim()} ${recognized}` : recognized));
    } catch (e) { console.error("stt failed", e); Toast.show({ type: "error", text1: "Не удалось распознать" }); }
  };

  return (
    <View style={s.askBar}>
      <Pressable
        onPress={recording ? stopRec : startRec}
        disabled={busy || transcribing}
        style={[s.askBot, recording && s.askBotRec]}
        accessibilityLabel={recording ? "Стоп" : "Голосовой ввод"}
      >
        {transcribing ? (
          <ActivityIndicator size="small" color="#7C5CFF" />
        ) : recording ? (
          <Square size={15} color="#f87171" fill="#f87171" />
        ) : (
          <Microphone size={18} color="#7C5CFF" weight="fill" />
        )}
      </Pressable>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={transcribing ? "Распознаём речь…" : "Спроси меня о языке…"}
        placeholderTextColor="#8B7F86"
        style={s.askInput}
        editable={!busy && !transcribing}
        onSubmitEditing={() => createChat(text)}
        returnKeyType="send"
      />
      <Pressable onPress={() => createChat(text)} disabled={busy || !text.trim()}>
        <LinearGradient colors={SEND} style={[s.askSend, (busy || !text.trim()) && { opacity: 0.5 }]}>
          {busy ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color="#fff" />}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Экран                                                               */
/* ------------------------------------------------------------------ */
export default function AIHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: stats } = useUserStats();

  const streak = stats?.current_streak ?? 0;
  const hearts = stats?.hearts ?? 0;
  const gems = stats?.gems ?? 0;
  const level = stats?.level ?? 1;

  const go = (href: Href) => router.push(href);

  return (
    <LinearGradient colors={AI_BG} locations={AI_BG_LOC} style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 90 + insets.bottom }}
      >
        {/* Stats */}
        <View style={s.statsRow}>
          <View style={[s.stat, glass]}><Text style={s.statText}>🔥 {streak}</Text></View>
          <View style={[s.stat, glass]}><Text style={s.statText}>❤️ {hearts}</Text></View>
          <View style={[s.stat, glass]}><Text style={s.statText}>💎 {gems}</Text></View>
          <LinearGradient colors={GOLD} style={[s.stat, s.statLvl]}>
            <Text style={s.lvlText}>✦ LV {level}</Text>
          </LinearGradient>
        </View>

        {/* Header + owl */}
        <View style={s.headerRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={s.title}>AI-помощник</Text>
            <Text style={s.subtitle}>Привет! Я LingoIQ, твой помощник на пути к знаниям 🚀</Text>
          </View>
          <View style={s.owlWrap}>
            <View style={s.owlGlow} />
            <SunsetOwl size={96} />
            <Sparkle size={16} color="#FFE16A" weight="fill" style={s.spark1} />
            <Sparkle size={11} color="#FFD84A" weight="fill" style={s.spark2} />
            <Sparkle size={9} color="#FFFFFF" weight="fill" style={s.spark3} />
          </View>
        </View>

        {/* Ask bar → новый свободный чат (текст + голос) */}
        <AskBar />

        {/* Quick categories */}
        <View style={s.quickRow}>
          {QUICK.map((q) => (
            <Pressable key={q.title} onPress={() => go(q.href)} style={[s.quickCard, glass]}>
              <View style={[s.quickIcon, { backgroundColor: q.tint, shadowColor: q.tint }]}>
                <q.Icon size={24} color="#fff" weight="fill" />
              </View>
              <Text style={s.quickTitle} numberOfLines={1}>{q.title}</Text>
              <Text style={s.quickSub} numberOfLines={1}>{q.sub}</Text>
            </Pressable>
          ))}
        </View>

        {/* Existing tools (kept) */}
        <Text style={s.sectionTitle}>Инструменты</Text>
        <View style={s.toolsGrid}>
          {TOOLS.map((t) => (
            <Pressable key={t.href as string} onPress={() => go(t.href)} style={[s.toolCard, glass]}>
              <View style={[s.toolThumb, { backgroundColor: `${t.tint}26`, borderColor: `${t.tint}66` }]}>
                <t.Icon size={22} color={t.tint} weight="duotone" />
              </View>
              <Text style={s.toolTitle}>{t.title}</Text>
              <Text style={s.toolDesc} numberOfLines={2}>{t.desc}</Text>
            </Pressable>
          ))}
        </View>

        {/* Progress card */}
        <View style={[s.progressCard, glass]}>
          <ProgressRing pct={75} />
          <View style={{ flex: 1 }}>
            <Text style={s.progressTitle}>Твой прогресс с AI</Text>
            <Text style={s.progressText}>Ты задал 15 вопросов</Text>
            <Text style={s.progressText}>Продолжай в том же духе!</Text>
          </View>
          <View style={s.chartWrap}>
            <Svg width={84} height={46}>
              <Polyline
                points="2,40 18,30 34,33 50,17 66,21 82,5"
                fill="none"
                stroke="#FFD84A"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={s.chartStar}>⭐</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  /* stats */
  statsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  stat: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  statText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  statLvl: { marginLeft: "auto", borderWidth: 0 },
  lvlText: { color: "#5a3b00", fontWeight: "900", fontSize: 13 },

  /* header */
  headerRow: { flexDirection: "row", alignItems: "center", marginTop: 14, minHeight: 96 },
  title: { color: "#fff", fontSize: 30, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "600", marginTop: 8, lineHeight: 20 },
  owlWrap: { width: 104, height: 104, alignItems: "center", justifyContent: "center" },
  owlGlow: {
    position: "absolute", width: 96, height: 96, borderRadius: 48,
    backgroundColor: "rgba(255,180,90,0.22)",
    shadowColor: "#FF9E3D", shadowOpacity: 0.9, shadowRadius: 24, shadowOffset: { width: 0, height: 0 },
  },
  spark1: { position: "absolute", top: 4, right: 2 },
  spark2: { position: "absolute", top: 30, right: -2 },
  spark3: { position: "absolute", bottom: 14, left: 6 },

  /* ask bar */
  askBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F6EFEF", borderRadius: 20,
    paddingLeft: 10, paddingRight: 7, paddingVertical: 7, marginTop: 16, gap: 10,
    shadowColor: "#000", shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  askBot: {
    width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(124,92,255,0.14)",
  },
  askBotRec: { backgroundColor: "rgba(248,113,113,0.16)" },
  askInput: { flex: 1, color: "#2B1422", fontSize: 15, fontWeight: "600", paddingVertical: 0 },
  askSend: {
    width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center",
    shadowColor: "#5B36E0", shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },

  /* quick categories */
  quickRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  quickCard: {
    flex: 1, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 8, alignItems: "center", gap: 8,
  },
  quickIcon: {
    width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center",
    shadowOpacity: 0.55, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  quickTitle: { color: "#fff", fontSize: 12.5, fontWeight: "800", textAlign: "center" },
  quickSub: { color: "rgba(255,255,255,0.7)", fontSize: 10.5, fontWeight: "600", textAlign: "center", marginTop: -4 },

  /* sections */
  sectionTitle: { color: "#fff", fontSize: 17, fontWeight: "800", marginTop: 22, marginBottom: 12 },

  /* tools grid */
  toolsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  toolCard: {
    width: "48.5%", borderRadius: 18, padding: 13, gap: 8, minHeight: 128,
  },
  toolThumb: {
    width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  toolTitle: { color: "#fff", fontSize: 15, fontWeight: "800" },
  toolDesc: { color: "rgba(255,255,255,0.78)", fontSize: 12, fontWeight: "600", lineHeight: 16 },

  /* progress card */
  progressCard: {
    flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 22, padding: 16, marginTop: 22,
  },
  ringText: { position: "absolute", color: "#fff", fontSize: 16, fontWeight: "900" },
  progressTitle: { color: "#fff", fontSize: 16, fontWeight: "900" },
  progressText: { color: "rgba(255,255,255,0.8)", fontSize: 12.5, fontWeight: "600", marginTop: 2 },
  chartWrap: { width: 84, height: 46, justifyContent: "center" },
  chartStar: { position: "absolute", right: -2, top: -6, fontSize: 14 },
});
