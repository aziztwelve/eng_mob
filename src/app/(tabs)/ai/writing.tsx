import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { RotateCcw } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssessmentResult } from '@/components/ai/assessment-result';
import { LangPills } from '@/components/ai/lang-pills';
import { QuotaWidget, hasQuotaLeft } from '@/components/ai/quota-widget';
import { useAIQuota, useAssessWriting } from '@/hooks/use-ai';
import { AI_TARGET_LANGS, DEFAULT_TARGET_LANG } from '@/lib/ai-languages';
import { glass, SunsetHeader, SunsetSubhead, CtaButton } from '@/components/sunset';

const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const MIN_WORDS = 10;

export default function WritingScreen() {
  const [prompt, setPrompt] = useState('');
  const [text, setText] = useState('');
  const [lang, setLang] = useState(DEFAULT_TARGET_LANG);
  const [level, setLevel] = useState('B1');
  const insets = useSafeAreaInsets();

  const quota = useAIQuota();
  const mut = useAssessWriting();
  const canWrite = hasQuotaLeft(quota.data, 'writing');

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const tooShort = wordCount < MIN_WORDS;
  const submittable = !tooShort && canWrite && !mut.isPending;

  const handleSubmit = async () => {
    if (!submittable) return;
    try {
      await mut.mutateAsync({ prompt: prompt.trim() || undefined, user_text: text, target_language: lang, user_level: level });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Ошибка проверки', text2: err instanceof Error ? err.message : undefined });
    }
  };

  const handleReset = () => { mut.reset(); setText(''); setPrompt(''); };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 + insets.bottom }}
      >
        <SunsetHeader title="Проверить эссе" />

        <QuotaWidget compact />

        {mut.data ? (
          <View style={{ gap: 14, marginTop: 18 }}>
            <AssessmentResult data={mut.data} />
            <Pressable onPress={handleReset} style={[s.resetBtn, glass]}>
              <RotateCcw size={15} color="rgba(255,255,255,0.7)" />
              <Text style={s.resetText}>Проверить ещё одну работу</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 14, marginTop: 18 }}>
            {/* Настройки */}
            <View style={[s.card, glass]}>
              <Text style={s.label}>Язык</Text>
              <LangPills options={AI_TARGET_LANGS} value={lang} onChange={setLang} />

              <Text style={[s.label, { marginTop: 14 }]}>Уровень</Text>
              <View style={s.pillRow}>
                {LEVEL_OPTIONS.map((o) => (
                  <Pressable
                    key={o}
                    onPress={() => setLevel(o)}
                    style={[s.pill, level === o ? s.pillActive : glass]}
                  >
                    <Text style={[s.pillText, level === o && s.pillTextActive]}>{o}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Задание */}
            <View style={[s.card, glass]}>
              <Text style={s.label}>Задание (опционально)</Text>
              <TextInput
                value={prompt}
                onChangeText={setPrompt}
                placeholder="Например: Опишите ваш типичный рабочий день."
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={s.input}
              />
            </View>

            {/* Текст */}
            <View style={[s.card, glass]}>
              <Text style={s.label}>Ваш текст</Text>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Напишите минимум 10 слов…"
                placeholderTextColor="rgba(255,255,255,0.35)"
                multiline
                textAlignVertical="top"
                style={[s.input, { minHeight: 140 }]}
              />
              <Text style={s.wordCount}>
                {wordCount} слов{tooShort ? ` — минимум ${MIN_WORDS}` : ''}
              </Text>
            </View>

            {!canWrite && (
              <Text style={s.limitText}>Лимит проверок на сегодня исчерпан. Сбрасывается завтра.</Text>
            )}

            <CtaButton
              label={mut.isPending ? 'Анализируем…' : 'Проверить'}
              onPress={handleSubmit}
              block
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 22, padding: 16, gap: 8 },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14 },
  pillActive: { backgroundColor: '#A8243F', borderWidth: 0 },
  pillText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700' },
  pillTextActive: { color: '#fff' },

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
  wordCount: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '500', marginTop: 4 },
  limitText: { color: '#f87171', fontSize: 13, fontWeight: '600' },

  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, paddingVertical: 13 },
  resetText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
