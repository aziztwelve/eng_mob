import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useTodayQueue, useReviewFlashcard } from '@/hooks/use-flashcards';
import { FlashcardView } from '@/components/flashcards/FlashcardView';
import { fx } from '@/lib/fx';
import type { Flashcard } from '@/types/api';

/**
 * /flashcards/session — сессия повторения «забыл/помню».
 *
 * Best-practice SRS-цикл:
 *  - показываем слово (active recall) → переворот → самооценка;
 *  - «Помню» (quality 5) / «Забыл» (quality 2) уходят в SM-2 на бэк
 *    через POST /flashcards/:id/review (оптимистично, UI не ждёт сети);
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
  const shownAtRef = useRef<number>(Date.now());

  // Инициализируем очередь один раз, когда пришли данные.
  const sourceCards = todayQueue.data?.items ?? [];
  useEffect(() => {
    if (!seededRef.current && sourceCards.length > 0) {
      seededRef.current = true;
      setQueue(sourceCards);
      shownAtRef.current = Date.now();
    }
  }, [sourceCards]);

  const total = sourceCards.length; // уникальных слов на сегодня
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
    (remembered: boolean) => {
      const card = queue[index];
      if (!card) return;

      const responseTimeMs = Date.now() - shownAtRef.current;
      // Оптимистично: шлём ревью в фон, не блокируя UI.
      review.mutate({ flashcardId: card.id, data: { remembered, response_time_ms: responseTimeMs } });

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
    if (!card) return;
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

  if (todayQueue.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#FFD84A" />
      </View>
    );
  }

  if (!total || !currentCard) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Stack.Screen options={{ title: t('fc.session_title') }} />
        <Text className="text-white font-bold text-xl text-center">
          {t('fc.no_cards')}
        </Text>
        <Pressable onPress={() => router.back()} className="bg-[#A8243F] rounded-2xl px-6 py-3 mt-4">
          <Text className="text-white font-bold">{t('common.back')}</Text>
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
              <X size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />

      <View className="flex-1 p-6 justify-center">
        <FlashcardView
          key={`${currentCard.id}-${index}`}
          word={currentCard.word}
          translation={currentCard.translation}
          definition={currentCard.definition}
          example={currentCard.example_sentence}
          transcription={currentCard.transcription}
          audioUrl={currentCard.audio_url}
          ttsLanguage={currentCard.language}
          stackCount={Math.max(0, queue.length - index - 1)}
          onRemember={() => handleAnswer(true)}
          onForgot={() => handleAnswer(false)}
          onSkip={handleSkip}
        />
      </View>

      <View className="px-6 pb-6">
        <View className="h-2 bg-white/20 rounded-full overflow-hidden">
          <View className="h-full bg-[#FFD84A]" style={{ width: `${progressPct}%` }} />
        </View>
      </View>
    </View>
  );
}
