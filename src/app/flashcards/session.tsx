import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useTodayQueue, useReviewFlashcard } from '@/hooks/use-flashcards';
import { FlashcardView } from '@/components/flashcards/FlashcardView';
import { drainFlashcardReviews } from '@/lib/flashcard-review-queue';
import { newVocabularyAttemptId } from '@/lib/vocabulary-attempt-queue';
import { fx } from '@/lib/fx';
import type { Flashcard, FlashcardReviewRequest } from '@/types/api';

/**
 * /flashcards/session — сессия повторения «забыл/помню».
 *
 * Best-practice SRS-цикл:
 *  - показываем слово (active recall) → переворот → самооценка;
 *  - «Помню» (quality 5) / «Забыл» (quality 2) уходят в SM-2 на бэк
 *    через POST /flashcards/:id/review; переход ждёт подтверждения;
 *  - забытые карточки возвращаются в конец очереди и показываются снова
 *    в этой же сессии (re-queue), пока не будут отмечены «помню»;
 *  - прогресс считается по уникальным выученным словам.
 */
export default function FlashcardSessionScreen() {
  const { t } = useTranslation();
  const todayQueue = useTodayQueue(undefined, true);
  const review = useReviewFlashcard();

  // Рабочая очередь (мутабельная: забытые добавляются в конец).
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [rememberedIds, setRememberedIds] = useState<Set<string>>(new Set());
  const seededRef = useRef(false);
  const saving = useRef(false);
  const intent = useRef<{ flashcardId: string; data: FlashcardReviewRequest } | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [recovering, setRecovering] = useState(true);
  const [recoveryError, setRecoveryError] = useState(false);
  const recover = useCallback(async () => {
    setRecovering(true); setRecoveryError(false);
    try { await drainFlashcardReviews(); }
    catch { setRecoveryError(true); }
    finally { setRecovering(false); }
  }, []);
  useEffect(() => { void recover(); }, [recover]);
  const [pending, setPending] = useState(false);
  const shownAtRef = useRef<number>(Date.now());

  // Инициализируем очередь один раз, когда пришли данные.
  const sourceCards = useMemo(() => todayQueue.data?.items ?? [], [todayQueue.data?.items]);
  useEffect(() => {
    if (!seededRef.current && sourceCards.length > 0) {
      seededRef.current = true;
      setQueue(sourceCards);
      shownAtRef.current = Date.now();
    }
  }, [sourceCards]);

  const total = new Set(queue.map(card => card.id)).size; // уникальных слов на сегодня
  const currentCard = queue[index];
  const rememberedCount = rememberedIds.size;

  const finish = useCallback(
    (rememberedFinal: number) => {
      fx.onXPGain();
      router.replace({
        pathname: '/flashcards/results' as any,
        params: { total, remembered: rememberedFinal },
      });
    },
    [total],
  );

  const advance = useCallback(
    (nextQueue: Flashcard[], nextRemembered: Set<string>) => {
      const nextIndex = index + 1;
      if (nextIndex >= nextQueue.length) {
        finish(nextRemembered.size);
        return;
      }
      setIndex(nextIndex);
      shownAtRef.current = Date.now();
    },
    [index, finish],
  );

  const handleAnswer = useCallback(
    async (remembered: boolean) => {
      const card = queue[index];
      if (!card || saving.current) return;
      saving.current = true; setPending(true); setSaveError(false);

      const responseTimeMs = Math.min(2147483647, Math.max(0, Date.now() - shownAtRef.current));
      // Persist a stable retry intent and await the server before showing success.
      if (!intent.current) intent.current = { flashcardId: card.id, data: { remembered, response_time_ms: responseTimeMs, attempt_id: newVocabularyAttemptId() } };
      try {
        await review.mutateAsync(intent.current);
      } catch {
        setSaveError(true); saving.current = false; setPending(false); return;
      }
      remembered = intent.current.data.remembered;
      intent.current = null;
      saving.current = false; setPending(false);

      const nextRemembered = new Set(rememberedIds);
      let nextQueue = queue;
      if (remembered) {
        nextRemembered.add(card.id);
      } else {
        // Re-queue: показать снова в конце сессии. Снимаем из remembered,
        // если ранее была отмечена помню (повторный проход).
        nextRemembered.delete(card.id);
        nextQueue = [...queue, card];
        setQueue(nextQueue);
      }
      setRememberedIds(nextRemembered);
      advance(nextQueue, nextRemembered);
    },
    [queue, index, rememberedIds, review, advance],
  );

  const handleSkip = useCallback(() => {
    const card = queue[index];
    if (!card || saving.current || intent.current) return;
    // Skip без оценки — карта возвращается в конец, чтобы не потерять её.
    const nextQueue = [...queue, card];
    setQueue(nextQueue);
    fx.tap();
    advance(nextQueue, rememberedIds);
  }, [queue, index, rememberedIds, advance]);

  const progressPct = useMemo(
    () => (total > 0 ? Math.min(100, (rememberedCount / total) * 100) : 0),
    [rememberedCount, total],
  );

  if (recoveryError) return <View className="flex-1 items-center justify-center gap-4 p-6"><Text className="text-[#171A1C]">{t('common.save_failed')}</Text><Pressable onPress={() => void recover()}><Text className="text-[#171A1C]">{t('practice.bank_player.retry_sync')}</Text></Pressable></View>;

  if (recovering || todayQueue.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2FA8E6" />
      </View>
    );
  }

  if (todayQueue.isError) return <View className="flex-1 items-center justify-center gap-4 p-6"><Text>{t('common.save_failed')}</Text><Pressable onPress={() => void todayQueue.refetch()}><Text>{t('practice.bank_player.retry_sync')}</Text></Pressable></View>;

  if (!total || !currentCard) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Stack.Screen options={{ title: t('fc.session_title') }} />
        <Text className="text-[#171A1C] font-bold text-xl text-center">
          {t('fc.no_cards')}
        </Text>
        <Pressable onPress={() => router.back()} className="bg-[#D6EFFC] rounded-2xl px-6 py-3 mt-4">
          <Text className="text-[#171A1C] font-bold">{t('common.back')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          title: `${rememberedCount} / ${total}`,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="p-2">
              <X size={24} color="#171A1C" />
            </Pressable>
          ),
        }}
      />

      <ScrollView removeClippedSubviews={false} className="flex-1" contentContainerStyle={{ flexGrow: 1, padding: 20, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        {/* Keep the native parent stable when the save lock changes before navigation. */}
        <View collapsable={false} pointerEvents={pending || saveError ? 'none' : 'auto'}><FlashcardView
          key={`${currentCard.id}-${index}`}
          word={currentCard.word}
          translation={currentCard.translation}
          definition={currentCard.definition}
          example={currentCard.example_sentence}
          transcription={currentCard.transcription}
          audioUrl={currentCard.audio_url}
          ttsLanguage={currentCard.language}
          stackCount={Math.max(0, queue.length - index - 1)}
          onRemember={() => void handleAnswer(true)}
          onForgot={() => void handleAnswer(false)}
          onSkip={handleSkip}
        /></View>
        {pending ? <ActivityIndicator color="#2FA8E6" /> : null}
        {saveError ? <View className="gap-3 py-4"><Text accessibilityRole="alert" className="text-center text-[#171A1C]">{t('common.save_failed')}</Text><Pressable onPress={() => void handleAnswer(intent.current?.data.remembered ?? true)} className="rounded-2xl bg-[#D6EFFC] p-4"><Text className="text-center text-[#171A1C]">{t('practice.bank_player.retry_sync')}</Text></Pressable></View> : null}
      </ScrollView>

      <View className="px-6 pb-4 pt-2">
        <View className="h-2 bg-[#EAF8FF] rounded-full overflow-hidden">
          <View className="h-full bg-[#59C8FF]" style={{ width: `${progressPct}%` }} />
        </View>
      </View>
    </View>
  );
}
