import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SpeakerHigh } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { useFlashcardStats, useFlashcards, useReviewFlashcard, useSeedStarter, useTodayQueue } from '@/hooks/use-flashcards';
import { playWordTTS } from '@/lib/tts';
import { SKY } from '@/components/lesson/sky-lesson-header';
import { skyFont } from '@/components/lesson/sky-ui';
import { SkyPanel } from './practice-ui';
import { drainFlashcardReviews } from '@/lib/flashcard-review-queue';
import { newVocabularyAttemptId } from '@/lib/vocabulary-attempt-queue';
import type { Flashcard, FlashcardReviewRequest } from '@/types/api';

// "Quick review" variant: one flashcard at a time with Forgot / Got it.
export function WordsTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const stats = useFlashcardStats();
  const today = useTodayQueue(undefined, true);
  const all = useFlashcards({ limit: 30 });
  const review = useReviewFlashcard();
  const seedStarter = useSeedStarter();

  const dueCards = useMemo(() => today.data?.items ?? [], [today.data]);
  const sourceCards = useMemo(() => dueCards.length > 0 ? dueCards : all.data?.items ?? [], [dueCards, all.data?.items]);
  // Keep the session stable while saving invalidates and refetches the queries.
  const [deck, setDeck] = useState<Flashcard[] | null>(null);
  const saving = useRef(false);
  const intent = useRef<{ flashcardId: string; data: FlashcardReviewRequest } | null>(null);
  const [pending, setPending] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [recovering, setRecovering] = useState(true);
  const [recoveryError, setRecoveryError] = useState(false);
  const recover = useCallback(async () => {
    setRecovering(true);
    setRecoveryError(false);
    try { await drainFlashcardReviews(); }
    catch { setRecoveryError(true); }
    finally { setRecovering(false); }
  }, []);
  useEffect(() => { void recover(); }, [recover]);
  useEffect(() => {
    if (!recovering && !recoveryError && !today.isLoading && !all.isLoading && !today.isError && !all.isError && deck === null) {
      setDeck([...sourceCards]);
    }
  }, [recovering, recoveryError, today.isLoading, all.isLoading, today.isError, all.isError, deck, sourceCards]);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const shownAt = useRef(Date.now());

  useEffect(() => {
    shownAt.current = Date.now();
  }, [index]);

  const total = stats.data?.total_count ?? 0;

  if (recoveryError || (deck === null && (stats.isError || today.isError || all.isError))) {
    return <SkyPanel style={st.emptyCard}>
      <Text accessibilityRole="alert" style={st.emptyText}>{t(recoveryError ? 'common.save_failed' : 'common.load_failed')}</Text>
      <Pressable onPress={() => { void recover(); void stats.refetch(); void today.refetch(); void all.refetch(); }} style={st.btn}>
        <Text style={st.btnText}>{t('practice.bank_player.retry_sync')}</Text>
      </Pressable>
    </SkyPanel>;
  }

  if (recovering || stats.isLoading || deck === null) {
    return <ActivityIndicator color={SKY.blue} style={{ marginVertical: 40 }} />;
  }

  if (total === 0 || deck.length === 0) {
    return (
      <SkyPanel style={st.emptyCard}>
        <Text style={st.emptyTitle}>{t('practice.your_words')}</Text>
        <Text style={st.emptyText}>{t('practice.your_words_desc')}</Text>
        <Pressable onPress={() => seedStarter.mutate('en')} disabled={seedStarter.isPending} style={st.btn}>
          {seedStarter.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={st.btnText}>{t('practice.load_starter')}</Text>}
        </Pressable>
      </SkyPanel>
    );
  }

  const finished = index >= deck.length;
  const card = deck[index];
  const next = deck[index + 1];

  const answer = async (remembered: boolean) => {
    if (!card || saving.current || (!flipped && !intent.current)) return;
    saving.current = true;
    setPending(true);
    setSaveError(false);
    if (!intent.current) {
      intent.current = { flashcardId: card.id, data: {
        remembered,
        response_time_ms: Math.min(2147483647, Math.max(0, Date.now() - shownAt.current)),
        attempt_id: newVocabularyAttemptId(),
      } };
    }
    try {
      // Every personal card is saved, including practice outside today's selection.
      await review.mutateAsync(intent.current);
    } catch {
      saving.current = false;
      setPending(false);
      setSaveError(true);
      return;
    }
    remembered = intent.current.data.remembered;
    intent.current = null;
    saving.current = false;
    setPending(false);
    if (remembered) setDone((n) => n + 1);
    setFlipped(false);
    setIndex((i) => i + 1);
  };

  if (finished) {
    return (
      <SkyPanel style={st.emptyCard}>
        <Text style={st.emptyTitle}>{t('practice.review_done')}</Text>
        <Text style={st.emptyText}>{t('practice.review_done_desc', { count: done })}</Text>
        <Pressable onPress={() => { setDeck(null); setIndex(0); setDone(0); setFlipped(false); }} style={st.btn}>
          <Text style={st.btnText}>{t('practice.review_again')}</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/flashcards' as never)} style={[st.btn, st.btnWhite]}>
          <Text style={[st.btnText, { color: SKY.blueDark }]}>{t('practice.open_flashcards')}</Text>
        </Pressable>
      </SkyPanel>
    );
  }

  return (
    <View style={{ marginTop: 18 }}>
      <View style={st.head}>
        <Text style={st.title}>{t('practice.review_word')}</Text>
        <View style={st.counter}>
          <Text style={st.counterText}>{index + 1} / {deck.length}</Text>
        </View>
      </View>
      <View style={st.bar}>
        <View style={[st.barFill, { width: `${Math.max(3, (index / deck.length) * 100)}%` }]} />
      </View>

      <Pressable disabled={pending || saveError} onPress={() => setFlipped((v) => !v)} accessibilityRole="button" accessibilityLabel={t('practice.tap_to_see')}>
        <SkyPanel style={st.card}>
          <Text style={st.word} adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.6}>{card.word}</Text>
          <Pressable onPress={() => void playWordTTS(card.word, card.language || 'en')} style={st.speak} accessibilityRole="button" accessibilityLabel={t('practice.bank_player.listen_word')}>
            <SpeakerHigh size={24} weight="bold" color="#FFFFFF" />
          </Pressable>
          {flipped ? (
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={st.translation}>{card.translation}</Text>
              {card.definition ? <Text style={st.extra}>{card.definition}</Text> : null}
              {card.example_sentence ? <Text style={st.extra}>{card.example_sentence}</Text> : null}
            </View>
          ) : (
            <Text style={st.tap}>{t('practice.tap_to_see')}</Text>
          )}
        </SkyPanel>
      </Pressable>

      <View style={st.answers}>
        <Pressable disabled={!flipped || pending || saveError} accessibilityState={{ disabled: !flipped || pending || saveError }} onPress={() => void answer(false)} style={[st.answerBtn, st.forgot, (!flipped || pending || saveError) && st.disabled]} accessibilityRole="button">
          <Text style={[st.answerText, { color: '#B4232A' }]}>{t('practice.forgot_btn')}</Text>
        </Pressable>
        <Pressable disabled={!flipped || pending || saveError} accessibilityState={{ disabled: !flipped || pending || saveError }} onPress={() => void answer(true)} style={[st.answerBtn, st.got, (!flipped || pending || saveError) && st.disabled]} accessibilityRole="button">
          <Text style={[st.answerText, { color: '#FFFFFF' }]}>{t('practice.remembered_btn')}</Text>
        </Pressable>
      </View>

      {pending ? <View accessibilityRole="progressbar" accessibilityLabel={t('onboarding.common.saving')} style={st.saving}>
        <ActivityIndicator color={SKY.blueDark} /><Text style={st.extra}>{t('onboarding.common.saving')}</Text>
      </View> : null}
      {saveError ? <SkyPanel style={st.emptyCard}>
        <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={st.error}>{t('common.save_failed')}</Text>
        <Pressable onPress={() => void answer(intent.current?.data.remembered ?? true)} style={st.btn} accessibilityRole="button">
          <Text style={st.btnText}>{t('practice.bank_player.retry_sync')}</Text>
        </Pressable>
      </SkyPanel> : null}

      {next ? (
        <SkyPanel style={st.nextRow}>
          <View style={{ flex: 1 }}>
            <Text style={st.nextLabel}>{t('practice.next_word')}</Text>
            <Text style={st.nextWord} numberOfLines={1}>{next.word}</Text>
          </View>
        </SkyPanel>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: skyFont.title, fontSize: 20, color: SKY.ink },
  counter: { height: 24, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#EAF8FF', justifyContent: 'center' },
  counterText: { fontFamily: skyFont.strong, fontSize: 12, color: SKY.blueDark },
  bar: { height: 10, borderRadius: 5, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: SKY.line, overflow: 'hidden', marginTop: 10 },
  barFill: { height: '100%', borderRadius: 5, backgroundColor: SKY.blue },
  card: { marginTop: 16, minHeight: 250, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 12 },
  word: { fontFamily: skyFont.title, fontSize: 34, color: SKY.ink, textAlign: 'center' },
  speak: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: SKY.blue, borderBottomWidth: 4, borderBottomColor: SKY.blueDark },
  tap: { fontFamily: skyFont.bold, fontSize: 12, color: SKY.muted, marginTop: 4 },
  translation: { fontFamily: skyFont.title, fontSize: 24, color: SKY.blueDark, textAlign: 'center' },
  extra: { fontFamily: skyFont.medium, fontSize: 14, lineHeight: 20, color: SKY.muted, textAlign: 'center' },
  disabled: { opacity: 0.45 },
  saving: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  error: { fontFamily: skyFont.bold, color: '#B4232A', textAlign: 'center' },
  answers: { flexDirection: 'row', gap: 12, marginTop: 16 },
  answerBtn: { flex: 1, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4 },
  forgot: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#FFC9CC', borderBottomColor: '#FFC9CC' },
  got: { backgroundColor: SKY.green, borderBottomColor: SKY.greenDark },
  answerText: { fontFamily: skyFont.strong, fontSize: 16 },
  nextRow: { flexDirection: 'row', alignItems: 'center', padding: 14, marginTop: 16 },
  nextLabel: { fontFamily: skyFont.bold, fontSize: 12, color: SKY.muted },
  nextWord: { fontFamily: skyFont.title, fontSize: 16, color: SKY.ink },
  emptyCard: { marginTop: 20, padding: 22, alignItems: 'center', gap: 12 },
  emptyTitle: { fontFamily: skyFont.title, fontSize: 20, color: SKY.ink, textAlign: 'center' },
  emptyText: { fontFamily: skyFont.medium, fontSize: 14, lineHeight: 20, color: SKY.muted, textAlign: 'center' },
  btn: { alignSelf: 'stretch', height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: SKY.blue, borderBottomWidth: 4, borderBottomColor: SKY.blueDark },
  btnWhite: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: SKY.line, borderBottomColor: SKY.card },
  btnText: { fontFamily: skyFont.strong, fontSize: 15, color: '#FFFFFF' },
});
