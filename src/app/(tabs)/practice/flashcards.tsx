import React, { useCallback, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { X } from 'lucide-react-native';

import { useTodayQueue } from '@/hooks/use-flashcards';
import { FlashcardView } from '@/components/flashcards/FlashcardView';
import { fx } from '@/lib/fx';

const MAX_UNDO_STACK = 5;

interface HistoryEntry {
  cardIndex: number;
  remembered: number;
}

export default function FlashcardsPracticeScreen() {
  const todayQueue = useTodayQueue();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remembered, setRemembered] = useState(0);
  const undoStackRef = useRef<HistoryEntry[]>([]);

  const cards = todayQueue.data?.items ?? [];
  const currentCard = cards[currentIndex];
  const isLastCard = currentIndex === cards.length - 1;

  const pushUndo = useCallback(() => {
    undoStackRef.current.push({ cardIndex: currentIndex, remembered });
    if (undoStackRef.current.length > MAX_UNDO_STACK) {
      undoStackRef.current.shift();
    }
  }, [currentIndex, remembered]);

  const handleAnswer = useCallback(
    (quality: number) => {
      pushUndo();
      const newRemembered = quality >= 4 ? remembered + 1 : remembered;

      if (isLastCard) {
        fx.onXPGain();
        router.push({
          pathname: '/practice/flashcard-results' as any,
          params: { total: cards.length, remembered: newRemembered },
        });
      } else {
        setCurrentIndex((prev) => prev + 1);
        setRemembered(newRemembered);
      }
    },
    [remembered, isLastCard, cards.length, pushUndo],
  );

  const handleSkip = useCallback(() => {
    if (isLastCard) return;
    pushUndo();
    setCurrentIndex((prev) => prev + 1);
  }, [isLastCard, pushUndo]);

  const handleUndo = useCallback(() => {
    const entry = undoStackRef.current.pop();
    if (!entry) return;
    setCurrentIndex(entry.cardIndex);
    setRemembered(entry.remembered);
    fx.tap();
  }, []);

  if (todayQueue.isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#58cc02" />
      </View>
    );
  }

  if (!cards.length) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-foreground font-bold text-xl text-center">
          Нет карточек на сегодня
        </Text>
        <Pressable onPress={() => router.back()} className="bg-primary rounded-2xl px-6 py-3 mt-4">
          <Text className="text-white font-bold">Назад</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: `${currentIndex + 1} / ${cards.length}`,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="p-2">
              <X size={24} color="#999" />
            </Pressable>
          ),
        }}
      />

      <View className="flex-1 p-6 justify-center">
        {currentCard && (
          <FlashcardView
            word={currentCard.word}
            translation={currentCard.translation}
            definition={currentCard.definition}
            example={currentCard.example_sentence}
            audioUrl={currentCard.audio_url}
            onRemember={() => handleAnswer(5)}
            onForgot={() => handleAnswer(2)}
            onSkip={!isLastCard ? handleSkip : undefined}
            onUndo={undoStackRef.current.length > 0 ? handleUndo : undefined}
            canUndo={undoStackRef.current.length > 0}
          />
        )}
      </View>

      <View className="px-6 pb-6">
        <View className="h-2 bg-muted rounded-full overflow-hidden">
          <View
            className="h-full bg-primary"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </View>
      </View>
    </View>
  );
}
