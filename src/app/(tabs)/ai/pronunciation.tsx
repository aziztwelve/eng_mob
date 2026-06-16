import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LangPills } from '@/components/ai/lang-pills';
import { VoiceRecorder } from '@/components/ai/voice-recorder';
import { QuotaWidget, hasQuotaLeft } from '@/components/ai/quota-widget';
import { useAIQuota, useCheckPronunciation } from '@/hooks/use-ai';
import type { AIWordScore, CheckPronunciationResponse } from '@/types/api';
import type { PronunciationAudioInput } from '@/lib/ai-api';
import { AI_TARGET_LANGS, DEFAULT_TARGET_LANG } from '@/lib/ai-languages';
import { glass, SunsetHeader, SunsetSubhead, CtaButton } from '@/components/sunset';

export default function PronunciationScreen() {
  const [target, setTarget] = useState('');
  const [language, setLanguage] = useState(DEFAULT_TARGET_LANG);
  const [resetSignal, setResetSignal] = useState(0);
  const insets = useSafeAreaInsets();

  const quota = useAIQuota();
  const mut = useCheckPronunciation();
  const canVoice = hasQuotaLeft(quota.data, 'voice');

  const handleSubmit = async (audio: PronunciationAudioInput) => {
    if (!target.trim() || !canVoice) return;
    try {
      await mut.mutateAsync({ audio, target_text: target.trim(), language });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Ошибка проверки', text2: err instanceof Error ? err.message : undefined });
    }
  };

  const handleReset = () => { mut.reset(); setResetSignal((n) => n + 1); };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 + insets.bottom }}
      >
        <SunsetHeader title="Произношение" />

        <QuotaWidget compact />

        {/* Ввод фразы */}
        <View style={[s.card, glass, { marginTop: 18 }]}>
          <Text style={s.label}>Фраза для произношения</Text>
          <TextInput
            value={target}
            onChangeText={setTarget}
            placeholder='"I would like a coffee, please."'
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={s.input}
          />
          <Text style={[s.label, { marginTop: 14 }]}>Язык</Text>
          <LangPills options={AI_TARGET_LANGS} value={language} onChange={setLanguage} />
          {!canVoice && (
            <Text style={s.limitText}>Лимит голосовых минут исчерпан. Сбрасывается завтра.</Text>
          )}
        </View>

        {/* Запись */}
        {target.trim() ? (
          <View style={{ marginTop: 14 }}>
            <VoiceRecorder key={resetSignal} loading={mut.isPending} onSubmit={(audio) => handleSubmit(audio)} />
          </View>
        ) : (
          <View style={[s.hintCard, glass, { marginTop: 14 }]}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>🎤</Text>
            <Text style={s.hintText}>Введите фразу выше, чтобы появилась кнопка записи.</Text>
          </View>
        )}

        {mut.isError && (
          <View style={s.errCard}>
            <Text style={s.errText}>Ошибка проверки. Попробуйте ещё раз.</Text>
          </View>
        )}

        {mut.data && (
          <Result targetText={target} data={mut.data} onReset={handleReset} />
        )}
      </ScrollView>
    </View>
  );
}

function Result({ targetText, data, onReset }: { targetText: string; data: CheckPronunciationResponse; onReset: () => void }) {
  const overall = Number.isFinite(data.accuracy_score) ? Math.round(data.accuracy_score * 100) : 0;
  const isGood = overall >= 75;

  return (
    <View style={{ gap: 12, marginTop: 14 }}>
      {/* Общий счёт */}
      <View style={[s.card, glass]}>
        <View style={s.scoreRow}>
          <View>
            <Text style={s.label}>Точность</Text>
            <Text style={[s.scoreBig, { color: isGood ? '#10b981' : '#f59e0b' }]}>
              {overall}<Text style={s.scoreDenom}> /100</Text>
            </Text>
          </View>
          <View style={[s.badgeRow, { backgroundColor: isGood ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', borderColor: isGood ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)' }]}>
            {isGood ? <CheckCircle2 size={15} color="#10b981" /> : <XCircle size={15} color="#f59e0b" />}
            <Text style={[s.badgeText, { color: isGood ? '#10b981' : '#f59e0b' }]}>
              {isGood ? 'Хорошо' : 'Ещё попрактикуйтесь'}
            </Text>
          </View>
        </View>
        {/* Прогресс */}
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${overall}%` as any, backgroundColor: isGood ? '#10b981' : '#f59e0b' }]} />
        </View>
        {data.feedback ? <Text style={s.feedbackText}>{data.feedback}</Text> : null}
      </View>

      {/* Фразы */}
      <View style={[s.card, glass]}>
        <Text style={s.sectionTitle}>Целевая фраза</Text>
        <View style={s.phraseBox}>
          <Text style={s.phraseText}>{targetText}</Text>
        </View>
        <Text style={[s.sectionTitle, { marginTop: 12 }]}>Распознано</Text>
        <View style={s.phraseBox}>
          <Text style={[s.phraseText, { fontStyle: 'italic', color: 'rgba(255,255,255,0.8)' }]}>
            {data.transcribed_text}
          </Text>
        </View>
        {data.word_scores && data.word_scores.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { marginTop: 12 }]}>По словам</Text>
            <View style={s.wordsRow}>
              {data.word_scores.map((w, i) => <WordScoreBadge key={i} item={w} />)}
            </View>
          </>
        )}
      </View>

      <Pressable onPress={onReset} style={[s.resetBtn, glass]}>
        <RotateCcw size={15} color="rgba(255,255,255,0.7)" />
        <Text style={s.resetText}>Попробовать ещё раз</Text>
      </Pressable>
    </View>
  );
}

function WordScoreBadge({ item }: { item: AIWordScore }) {
  const pct = Number.isFinite(item.score) ? Math.round(item.score * 100) : 0;
  const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#f87171';
  const bg = pct >= 80 ? 'rgba(16,185,129,0.12)' : pct >= 60 ? 'rgba(245,158,11,0.12)' : 'rgba(248,113,113,0.12)';
  const border = pct >= 80 ? 'rgba(16,185,129,0.3)' : pct >= 60 ? 'rgba(245,158,11,0.3)' : 'rgba(248,113,113,0.3)';
  return (
    <View style={[s.wordBadge, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[s.wordText, { color }]}>{item.word}</Text>
      <Text style={s.wordPct}>{pct}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 22, padding: 16, gap: 8 },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
  },
  limitText: { color: '#f87171', fontSize: 13, fontWeight: '600', marginTop: 4 },

  hintCard: { borderRadius: 22, padding: 32, alignItems: 'center' },
  hintText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500', textAlign: 'center' },

  errCard: { marginTop: 12, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'rgba(248,113,113,0.08)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.25)' },
  errText: { color: '#f87171', fontSize: 13, fontWeight: '600' },

  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  scoreBig: { fontSize: 48, fontWeight: '900', lineHeight: 54 },
  scoreDenom: { fontSize: 22, color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  progressBg: { height: 7, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', marginTop: 6 },
  progressFill: { height: '100%', borderRadius: 6 },
  feedbackText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500', marginTop: 4, lineHeight: 19 },

  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  phraseBox: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 4 },
  phraseText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  wordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  wordBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  wordText: { fontSize: 13, fontWeight: '700' },
  wordPct: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700' },

  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, paddingVertical: 13 },
  resetText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
