import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import { useVocabularyBankProgress, useVocabularyBankWord } from '@/hooks/use-vocabulary-bank';
import {
  IconBookOpen,
  IconCheck,
  IconChevronRight,
  IconEye,
  IconHeadphones,
  IconImage,
  IconLayers,
  IconLink,
  IconMessage,
  IconMic,
  IconPencil,
  IconPlay,
  IconRefresh,
  IconVolume,
} from '@/components/ui/icons';

const GOLD = ["#FFDF5E", "#FFB338"] as const;
const CTA = ["#A8243F", "#CC5A1F"] as const;
const MINT = '#2EECC8';
const TOTAL_STEPS = 15;

/** Timeline icon per activity type — unknown types fall back to a dot. */
const STEP_ICONS: Record<string, typeof IconEye> = {
  discover: IconImage,
  listen: IconHeadphones,
  tap_for_meaning: IconEye,
  repeat: IconMic,
  word_match: IconLink,
  meaning_choice: IconBookOpen,
  fill_the_blank: IconPencil,
  sentence_builder: IconLayers,
  present_question: IconMessage,
  past_question: IconMessage,
  future_question: IconMessage,
  wh_question: IconMessage,
  positive_answer: IconMessage,
  negative_answer: IconMessage,
  speak_and_review: IconVolume,
};

const STEP_TITLES: Record<string, string> = {
  discover: 'Discover',
  listen: 'Listen',
  tap_for_meaning: 'Tap for meaning',
  repeat: 'Repeat',
  word_match: 'Word match',
  meaning_choice: 'Meaning choice',
  fill_the_blank: 'Fill the blank',
  sentence_builder: 'Sentence builder',
  present_question: 'Present question',
  past_question: 'Past question',
  future_question: 'Future question',
  wh_question: 'Wh- question',
  positive_answer: 'Positive answer',
  negative_answer: 'Negative answer',
  speak_and_review: 'Speak & review',
};

/** Localized step title with English fallback for unknown types. */
function stepTitle(t: (key: string) => string, type: string): string {
  const localized = t(`practice.bank_steps.${type}`);
  if (localized && localized !== `practice.bank_steps.${type}`) return localized;
  return STEP_TITLES[type] ?? type.replaceAll('_', ' ');
}

export default function VocabularyBankPreviewScreen() {
  const { externalId } = useLocalSearchParams<{ externalId: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const tabBarHeight = useBottomTabBarHeight();
  // Follows the live app language so the word detail is never mixed-language.
  const locale = (i18n.resolvedLanguage ?? 'ru').slice(0, 2).toLowerCase();
  const query = useVocabularyBankWord(externalId, locale);
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

  const pct = Math.round((Math.min(currentStep, TOTAL_STEPS) / TOTAL_STEPS) * 100);
  const cta = completed
    ? t('practice.bank_repeat_word')
    : started
      ? t('practice.bank_continue_word')
      : t('practice.bank_start');

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[s.content, { paddingBottom: 24 + tabBarHeight }]}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <Stack.Screen options={{ title: entry?.word.word ?? t('practice.bank_title') }} />
      {query.isLoading ? <ActivityIndicator color="#FFD84A" style={{ marginTop: 48 }} /> : query.error || !entry ? (
        <Text style={s.message}>{t('practice.bank_error')}</Text>
      ) : <>
        {/* hero card */}
        <View style={s.hero}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={s.heroChips}>
              <View style={s.level}><Text style={s.levelText}>{entry.word.cefr_level}</Text></View>
              {completed ? (
                <View style={s.doneChip}><IconCheck size={11} color={MINT} /><Text style={s.doneText}>{t('practice.bank_completed')}</Text></View>
              ) : started ? (
                <View style={s.progChip}><Text style={s.progText}>{currentStep}/{TOTAL_STEPS}</Text></View>
              ) : null}
            </View>
            <Pressable onPress={speak} style={({ pressed }) => [s.speak, pressed && { opacity: 0.75 }]} accessibilityRole="button" accessibilityLabel={t('practice.bank_listen')}>
              <IconVolume size={22} color="#FFD84A" />
            </Pressable>
          </View>
          <Text style={s.word}>{entry.word.word}</Text>
          <Text style={s.translation}>{entry.word.translation}</Text>
          <Text style={s.meta}>{entry.word.part_of_speech}</Text>
        </View>

        {/* lesson progress + CTA */}
        <View style={s.card}>
          <View style={s.stepsRow}>
            <Text style={s.stepsLabel}>{t('practice.bank_lesson_steps', { count: TOTAL_STEPS })}</Text>
            <Text style={s.stepsPct}>{pct}%</Text>
          </View>
          <View style={s.track}>
            <LinearGradient
              colors={GOLD as unknown as [string, string]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[s.trackFill, { width: `${pct}%` }]}
            />
          </View>
          <Pressable
            onPress={() => router.push(`/practice/vocabulary/${externalId}/learn` as never)}
            accessibilityRole="button"
            style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
          >
            <LinearGradient
              colors={completed ? (GOLD as unknown as [string, string]) : (CTA as unknown as [string, string])}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.cta}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {completed ? <IconRefresh size={16} color="#3D0A1A" /> : <IconPlay size={14} color="#fff" />}
                <Text style={[s.ctaText, completed && s.ctaTextGold]}>{cta}</Text>
              </View>
            </LinearGradient>
          </Pressable>
        </View>

        {/* meaning */}
        <View style={[s.card, { gap: 6 }]}>
          <Text style={s.heading}>{t('practice.bank_meaning')}</Text>
          <Text style={s.body}>{entry.meaning}</Text>
        </View>

        {/* lesson timeline */}
        <View style={s.planRow}>
          <Text style={s.planTitle}>{t('practice.bank_lesson_steps', { count: TOTAL_STEPS })}</Text>
        </View>
        <View style={{ gap: 0 }}>
          {activities.map((activity, i) => {
            const done = activity.step < currentStep || completed;
            const current = !completed && activity.step === currentStep;
            const Icon = STEP_ICONS[activity.type];
            const last = i === activities.length - 1;
            return (
              <View key={activity.step} style={s.tlRow}>
                <View style={s.tlRail}>
                  <View style={[s.tlNode, done && s.tlNodeDone, current && s.tlNodeCurrent]}>
                    {done ? <IconCheck size={12} color={MINT} strokeWidth={2.6} />
                      : Icon ? <Icon size={14} color={current ? '#3D0A1A' : 'rgba(255,255,255,0.75)'} />
                        : <Text style={s.tlNum}>{activity.step}</Text>}
                  </View>
                  {!last ? <View style={[s.tlLine, done && s.tlLineDone]} /> : null}
                </View>
                <Pressable
                  onPress={() => router.push(`/practice/vocabulary/${externalId}/learn` as never)}
                  style={({ pressed }) => [s.tlCard, done && s.tlCardDone, current && s.tlCardCurrent, pressed && { opacity: 0.8 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${STEP_TITLES[activity.type] ?? activity.type}, ${activity.instruction}`}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[s.tlTitle, done && { color: 'rgba(255,255,255,0.5)' }]}>
                      {stepTitle(t, activity.type)}
                    </Text>
                    <Text style={s.tlHint} numberOfLines={2}>{activity.instruction}</Text>
                  </View>
                  <IconChevronRight size={14} color={done ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.45)'} />
                </Pressable>
              </View>
            );
          })}
        </View>
      </>}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, paddingTop: 12, gap: 14, paddingBottom: 56 },
  message: { color: '#fff', textAlign: 'center', marginTop: 48, fontWeight: '700' },

  hero: {
    borderRadius: 22, padding: 20, gap: 4,
    backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
  },
  heroChips: { flexDirection: 'row', gap: 6 },
  level: { backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 3 },
  levelText: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '900' },
  doneChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(46,236,200,0.12)', borderWidth: 1, borderColor: 'rgba(46,236,200,0.4)', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 3 },
  doneText: { color: MINT, fontSize: 10.5, fontWeight: '900' },
  progChip: { backgroundColor: 'rgba(255,216,74,0.13)', borderWidth: 1, borderColor: 'rgba(255,216,74,0.4)', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 3 },
  progText: { color: '#FFD84A', fontSize: 10.5, fontWeight: '900' },
  speak: {
    width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,216,74,0.12)', borderWidth: 1, borderColor: 'rgba(255,216,74,0.4)',
  },
  word: { color: '#fff', fontSize: 34, fontWeight: '900', marginTop: 10, letterSpacing: 0.3 },
  translation: { color: '#FFD84A', fontSize: 17, fontWeight: '800', marginTop: 2 },
  meta: { color: 'rgba(255,255,255,0.5)', fontSize: 12.5, fontWeight: '700', marginTop: 2, textTransform: 'capitalize' },

  card: { backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', borderRadius: 18, padding: 16, gap: 10 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepsLabel: { color: '#fff', fontSize: 14.5, fontWeight: '900' },
  stepsPct: { color: '#FFD84A', fontSize: 13, fontWeight: '900' },
  track: { height: 8, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 5 },
  cta: { paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 2 },
  ctaText: { color: '#fff', fontWeight: '900', fontSize: 15.5 },
  ctaTextGold: { color: '#3D0A1A' },

  heading: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  body: { color: 'rgba(255,255,255,0.75)', lineHeight: 21, fontSize: 14.5 },

  planRow: { marginTop: 4 },
  planTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },

  tlRow: { flexDirection: 'row', gap: 10 },
  tlRail: { width: 30, alignItems: 'center' },
  tlNode: {
    width: 30, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  tlNodeDone: { backgroundColor: 'rgba(46,236,200,0.10)', borderColor: 'rgba(46,236,200,0.35)' },
  tlNodeCurrent: { backgroundColor: '#FFD84A', borderColor: '#FFD84A', elevation: 3 },
  tlNum: { color: 'rgba(255,255,255,0.7)', fontWeight: '900', fontSize: 12 },
  tlLine: { flex: 1, width: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 2 },
  tlLineDone: { backgroundColor: 'rgba(46,236,200,0.25)' },
  tlCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14, padding: 12, marginBottom: 8,
  },
  tlCardDone: { opacity: 0.55 },
  tlCardCurrent: { backgroundColor: 'rgba(255,216,74,0.10)', borderColor: 'rgba(255,216,74,0.4)' },
  tlTitle: { color: '#fff', fontWeight: '800', fontSize: 13 },
  tlHint: { color: 'rgba(255,255,255,0.5)', fontSize: 11.5, marginTop: 2, lineHeight: 15 },
});
