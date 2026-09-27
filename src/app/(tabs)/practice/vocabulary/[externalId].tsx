import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { useTranslation } from 'react-i18next';

import { useVocabularyBankProgress, useVocabularyBankWord } from '@/hooks/use-vocabulary-bank';

const GOLD = ["#FFDF5E", "#FFB338"] as const;
const CTA = ["#A8243F", "#CC5A1F"] as const;
const TOTAL_STEPS = 15;

/** Compact glyph per activity type — unknown types fall back to a dot. */
const STEP_ICONS: Record<string, string> = {
  discover: '🖼️',
  listen: '🔊',
  tap_for_meaning: '👆',
  repeat: '🎙️',
  word_match: '🔗',
  meaning_choice: '❓',
  fill_the_blank: '✏️',
  sentence_builder: '🧩',
  present_question: '💬',
  past_question: '💬',
  future_question: '💬',
  wh_question: '💬',
  positive_answer: '💬',
  negative_answer: '💬',
  speak_and_review: '🗣️',
};

export default function VocabularyBankPreviewScreen() {
  const { externalId } = useLocalSearchParams<{ externalId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const query = useVocabularyBankWord(externalId);
  const progressQuery = useVocabularyBankProgress(externalId);
  const entry = query.data?.entry;

  const progress = progressQuery.data?.progress;
  const completed = !!progress?.completed_at;
  const currentStep = progress?.current_step ?? 1;
  const started = currentStep > 1 || completed;

  const activities = useMemo(
    () => (entry?.activities ?? []).slice().sort((a, b) => a.step - b.step),
    [entry?.activities],
  );

  const speak = () => {
    if (entry?.word.word) Speech.speak(entry.word.word, { language: 'en-US', rate: 0.85 });
  };

  const cta = completed
    ? t('practice.bank_repeat_word')
    : started
      ? t('practice.bank_continue_word')
      : t('practice.bank_start');

  return (
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Stack.Screen options={{ title: entry?.word.word ?? t('practice.bank_title') }} />
      {query.isLoading ? <ActivityIndicator color="#FFD84A" style={{ marginTop: 48 }} /> : query.error || !entry ? (
        <Text style={s.message}>{t('practice.bank_error')}</Text>
      ) : <>
        {/* hero */}
        <View style={s.hero}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
              <Text style={s.word}>{entry.word.word}</Text>
              <View style={s.level}><Text style={s.levelText}>{entry.word.cefr_level}</Text></View>
              {completed ? (
                <View style={s.done}><Text style={s.doneText}>✓ {t('practice.bank_completed')}</Text></View>
              ) : null}
            </View>
            <Text style={s.translation}>{entry.word.translation}</Text>
            <Text style={s.meta}>{entry.word.part_of_speech}</Text>
          </View>
          <Pressable onPress={speak} style={s.speak} accessibilityRole="button" accessibilityLabel={t('practice.bank_listen')}>
            <Text style={s.speakIcon}>🔊</Text>
          </Pressable>
        </View>

        {/* lesson progress + CTA */}
        <View style={s.card}>
          <View style={s.stepsRow}>
            <Text style={s.stepsLabel}>{t('practice.bank_lesson_steps', { count: TOTAL_STEPS })}</Text>
            <Text style={s.stepsPct}>{Math.round((Math.min(currentStep, TOTAL_STEPS) / TOTAL_STEPS) * 100)}%</Text>
          </View>
          <View style={s.track}>
            <LinearGradient
              colors={GOLD as unknown as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[s.trackFill, { width: `${Math.round((Math.min(currentStep, TOTAL_STEPS) / TOTAL_STEPS) * 100)}%` }]}
            />
          </View>
          {started && !completed ? (
            <Text style={s.stepNow}>{t('practice.bank_step', { step: currentStep, total: TOTAL_STEPS })}</Text>
          ) : null}
          <Pressable
            onPress={() => router.push(`/practice/vocabulary/${externalId}/learn` as never)}
            accessibilityRole="button"
          >
            <LinearGradient colors={CTA as unknown as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.cta}>
              <Text style={s.ctaText}>{cta}</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* meaning */}
        <View style={s.card}>
          <Text style={s.heading}>{t('practice.bank_meaning')}</Text>
          <Text style={s.body}>{entry.meaning}</Text>
        </View>

        {/* lesson plan */}
        <Text style={s.planTitle}>{t('practice.bank_lesson_steps', { count: TOTAL_STEPS })}</Text>
        <View style={{ gap: 7 }}>
          {activities.map((activity) => {
            const done = activity.step < currentStep || completed;
            return (
              <View key={activity.step} style={[s.step, done && s.stepDone]}>
                <View style={[s.stepNo, done && s.stepNoDone]}>
                  <Text style={[s.stepNoText, done && s.stepNoTextDone]}>{done ? '✓' : activity.step}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.stepType}>
                    {STEP_ICONS[activity.type] ?? '•'} {activity.type.replaceAll('_', ' ')}
                  </Text>
                  <Text style={s.stepHint} numberOfLines={2}>{activity.instruction}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </>}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, gap: 14, paddingBottom: 48 },
  message: { color: '#fff', textAlign: 'center', marginTop: 48, fontWeight: '700' },

  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  word: { color: '#fff', fontSize: 32, fontWeight: '900' },
  level: { backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 3 },
  levelText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '900' },
  done: { backgroundColor: 'rgba(46,236,200,0.16)', borderWidth: 1, borderColor: '#2EECC8', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 3 },
  doneText: { color: '#2EECC8', fontSize: 11, fontWeight: '900' },
  translation: { color: '#FFD84A', fontSize: 18, fontWeight: '800', marginTop: 6 },
  meta: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '700', marginTop: 3, textTransform: 'capitalize' },
  speak: {
    width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,216,74,0.16)', borderWidth: 1, borderColor: 'rgba(255,216,74,0.4)',
  },
  speakIcon: { fontSize: 24 },

  card: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 16, gap: 10 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepsLabel: { color: '#fff', fontSize: 15, fontWeight: '900' },
  stepsPct: { color: '#FFD84A', fontSize: 13, fontWeight: '900' },
  track: { height: 8, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 5 },
  stepNow: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '800' },
  cta: { paddingVertical: 15, borderRadius: 15, alignItems: 'center', marginTop: 2 },
  ctaText: { color: '#fff', fontWeight: '900', fontSize: 16 },

  heading: { color: '#fff', fontSize: 17, fontWeight: '900' },
  body: { color: 'rgba(255,255,255,0.82)', lineHeight: 21, fontSize: 15 },

  planTitle: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 6 },
  step: { flexDirection: 'row', gap: 12, padding: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  stepDone: { opacity: 0.6 },
  stepNo: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)' },
  stepNoDone: { backgroundColor: 'rgba(46,236,200,0.2)' },
  stepNoText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  stepNoTextDone: { color: '#2EECC8' },
  stepType: { color: '#fff', fontWeight: '800', fontSize: 13, textTransform: 'capitalize' },
  stepHint: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2, lineHeight: 16 },
});
