import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import type { VocabularyBankXPAward } from '@/types/api';
import { drainVocabularyAttempts, vocabularyAttemptQueue, vocabularyQueueUserId, newVocabularyAttemptId } from '@/lib/vocabulary-attempt-queue';
import { playWordTTS, prefetchWordTTS } from '@/lib/tts';
import { useCheckPronunciation } from '@/hooks/use-ai';
import { VOCABULARY_BANK_KEY, useVocabularyBankFeed, useVocabularyBankProgress, useVocabularyBankWord } from '@/hooks/use-vocabulary-bank';
import { VoiceRecorder } from '@/components/ai/voice-recorder';
import { BankButton, BankCard, BankCoach, BankFeedbackPanel, BankText, WordBankFrame, type BankFeedback } from '@/components/vocabulary/player/WordBankChrome';
import { WordBankActivityView, type BankAnswer } from '@/components/vocabulary/player/WordBankActivity';
import { WordSelectionStep } from '@/components/vocabulary/WordSelectionStep';

export default function VocabularyBankLessonScreen() {
  const { externalId } = useLocalSearchParams<{ externalId: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  // Live app language: the feed (and its "next word" candidates) must match
  // the language the user sees, even if it changed after this screen mounted.
  const locale = (i18n.resolvedLanguage ?? 'ru').slice(0, 2).toLowerCase();
  const query = useVocabularyBankWord(externalId, locale);
  const progressQuery = useVocabularyBankProgress(externalId);
  const feed = useVocabularyBankFeed({ locale, new_limit: 5, in_progress_limit: 5 });
  const entry = query.data?.entry;
  const activities = useMemo(() => entry?.activities.slice().sort((a, b) => a.step - b.step) ?? [], [entry?.activities]);
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [identityLoading, setIdentityLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [saveError, setSaveError] = useState(false);
  const [feedback, setFeedback] = useState<BankFeedback>(null);
  const confirmedStep = useRef<number | null>(null);
  const [reset, setReset] = useState(0);
  const startedAt = useRef(Date.now());
  const [index, setIndex] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [showWordSelection, setShowWordSelection] = useState(false);
  const [xpAward, setXpAward] = useState<VocabularyBankXPAward | null>(null);

  useEffect(() => {
    if (entry?.word.word) void prefetchWordTTS(entry.word.word, 'en').catch(() => undefined);
  }, [entry?.word.word]);

  useEffect(() => { void vocabularyQueueUserId().then(setUserId).catch(() => setSaveError(true)).finally(() => setIdentityLoading(false)); }, []);

  useEffect(() => {
    if (!activities.length || progressQuery.isPending || pendingRef.current || confirmedStep.current !== null || finished) return;
    const step = progressQuery.data?.progress.completed_at ? 1 : progressQuery.data?.progress.current_step ?? 1;
    const savedIndex = activities.findIndex((activity) => activity.step === step);
    setIndex((current) => current !== null && progressQuery.data?.progress.completed_at ? current : savedIndex >= 0 ? savedIndex : 0);
  }, [activities, finished, progressQuery.data, progressQuery.isPending]);

  useEffect(() => {
    if (!userId || !activities.length) return;
    let active = true;
    const unsubscribe = vocabularyAttemptQueue.subscribe((owner, item, response) => {
      if (owner !== userId || item.externalId !== externalId) return;
      pendingRef.current = false; setPending(false); setSaveError(false);
      if (response.xp) setXpAward(response.xp);
      if (response.can_advance) {
        if (response.assessment_mode === 'checked') {
          confirmedStep.current = item.step;
          setFeedback({ kind: 'correct' });
        } else {
          if (item.step === 15) setFinished(true);
          else setIndex(activities.findIndex((activity) => activity.step === item.step + 1));
          setFeedback(null);
        }
      } else {
        const activity = activities.find(value => value.step === item.step);
        setFeedback({ kind: 'wrong', answer: typeof activity?.payload.answer === 'string' ? activity.payload.answer : undefined });
      }
      if (!response.can_advance) setReset((value) => value + 1);
      startedAt.current = Date.now();
      void queryClient.invalidateQueries({ queryKey: VOCABULARY_BANK_KEY });
    });
    void vocabularyAttemptQueue.pending(userId).then((items) => {
      if (!active) return;
      if (items.some((item) => item.externalId === externalId)) { pendingRef.current = true; setPending(true); }
      void drainVocabularyAttempts().catch(() => undefined);
    }).catch(() => { if (active) setSaveError(true); });
    return () => { active = false; unsubscribe(); };
  }, [activities, externalId, queryClient, userId]);

  // Next-word candidate for the finish screen: first untouched word from the
  // feed (server randomizes new words), current one excluded.
  const nextWord = useMemo(() => {
    const pool = [...(feed.data?.new_words ?? []), ...(feed.data?.in_progress ?? [])];
    return pool.find((candidate) => candidate.word.external_id !== externalId)?.word ?? null;
  }, [feed.data, externalId]);

  const advance = async (result: BankAnswer) => {
    if (index === null || !userId || pendingRef.current) return;
    const activity = activities[index];
    pendingRef.current = true; setPending(true); setSaveError(false); setFeedback(null);
    try {
      await vocabularyAttemptQueue.enqueue(userId, {
        id: newVocabularyAttemptId(), externalId, step: activity.step,
        answer: { value: result.value ?? '', completed: true },
        timeSpentMs: Math.min(Date.now() - startedAt.current, 2147483647),
      });
    } catch {
      pendingRef.current = false; setPending(false); setSaveError(true); return;
    }
    // Stay on this step until the server acknowledges the saved answer.
    void drainVocabularyAttempts().catch(() => undefined);
  };

  const continueConfirmed = () => {
    const step = confirmedStep.current;
    if (step === null) return;
    confirmedStep.current = null;
    setFeedback(null);
    setIndex(activities.findIndex(activity => activity.step === step + 1));
    startedAt.current = Date.now();
  };
  const chrome = <><Stack.Screen options={{ headerShown: false }} /><StatusBar style="dark" /></>;
  if ((!identityLoading && !userId) || query.error || query.isSuccess && (!entry || !activities.length)) return <View className="flex-1 bg-white px-6 py-10">{chrome}<BankText>{t('practice.bank_player.load_error')}</BankText><BankButton label={t('practice.bank_back')} secondary onPress={() => router.back()} /></View>;
  if (identityLoading || query.isLoading || index === null || !entry) return <View className="flex-1 items-center justify-center bg-[#E8F7FF]">{chrome}<ActivityIndicator color="#2FA8E6" /></View>;
  if (finished && showWordSelection && entry) return <WordSelectionStep
    source="bank"
    candidates={[{
      vocabulary_id: entry.word.external_id,
      word: entry.word.word,
      translation: entry.word.translation,
    }]}
    onDone={() => router.back()}
    onSkip={() => router.back()}
  />;
  if (finished) return <WordBankFrame step={16} title={t('practice.bank_finish_title')} onBack={() => router.back()} bottomInset={insets.bottom}>
    {chrome}
    <BankCoach question={entry.word.word} />
    <BankCard><Text className="text-center font-nunito-extrabold text-[23px] leading-8 text-[#152F60]">{t('practice.bank_completed')}</Text><BankText>{t('practice.bank_finish_text', { word: entry.word.word })}</BankText>{xpAward ? <Text className="text-center font-nunito-extrabold text-[22px] text-[#239A42]">{t('practice.bank_finish_xp', { count: xpAward.amount })}</Text> : null}{xpAward?.leveled_up ? <BankText>{t('practice.bank_finish_levelup', { level: xpAward.new_level })}</BankText> : null}</BankCard>
     <View className="mt-auto gap-3 pt-4"><BankButton label={t('words.selection_title')} onPress={() => setShowWordSelection(true)} />{nextWord ? <BankButton label={`${t('practice.bank_next_word')} · ${nextWord.word}`} secondary onPress={() => router.replace(`/practice/vocabulary/${nextWord.external_id}` as never)} /> : null}<BankButton label={t('practice.bank_back')} secondary onPress={() => router.back()} /></View>
  </WordBankFrame>;
  const activity = activities[index];
  if (!activity) return <View className="flex-1 bg-white p-6">{chrome}<BankText>{t('practice.bank_player.load_error')}</BankText></View>;
  const blocked = pending || feedback?.kind === 'correct';
  return <WordBankFrame step={activity.step} title={t(`practice.bank_player.headings.${activity.type}`, { defaultValue: activity.instruction })} onBack={() => router.back()} bottomInset={insets.bottom}>
    {chrome}
    <View className="flex-1" pointerEvents={blocked ? 'none' : 'auto'} accessibilityElementsHidden={blocked} importantForAccessibility={blocked ? 'no-hide-descendants' : 'auto'}>
      <WordBankActivityView pending={pending} confirmed={feedback?.kind === 'correct'} key={`${externalId}:${activity.step}:${reset}`} entry={entry} activity={activity} onSubmit={advance} onPlay={(value, speed) => playWordTTS(value, 'en', undefined, speed)} renderRecording={({ target, onRecognized }) => <BankPronunciationRecorder target={target} onRecognized={onRecognized} />} />
    </View>
    <BankFeedbackPanel feedback={feedback} pending={pending} saveError={saveError} onRetry={() => { void drainVocabularyAttempts().catch(() => undefined); }} />
    {feedback?.kind === 'correct' ? <BankButton label={t('practice.bank_player.next')} tone="green" onPress={continueConfirmed} /> : null}
  </WordBankFrame>;
}

function BankPronunciationRecorder({ target, onRecognized }: { target: string; onRecognized: (value: string) => void }) {
  const { t } = useTranslation();
  const check = useCheckPronunciation();
  const [error, setError] = useState(false);
  return <View className="gap-2">
    <VoiceRecorder light loading={check.isPending} minDurationSec={1} onSubmit={async audio => {
      setError(false);
      try {
        const result = await check.mutateAsync({ audio, target_text: target, language: 'en' });
        if (result.transcribed_text?.trim()) onRecognized(result.transcribed_text);
        else setError(true);
      } catch { setError(true); }
    }} />
    {error ? <BankText small>{t('ai.check_err')}</BankText> : null}
  </View>;
}
