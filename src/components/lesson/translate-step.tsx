import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { parseStepContent, type StepComponentProps } from './step-types';
import type { TranslateContent } from '@/types/api';

/**
 * Translate (mobile): tap-only UX как Duolingo. Слово из bank → переходит
 * в answer area; обратный тап убирает. Submit отправляет `{ words: [...] }`.
 *
 * TODO Phase 2.5: апгрейд на полноценный DnD через
 * `react-native-gesture-handler` PanGestureHandler + Reanimated worklets.
 */
export function TranslateStep({ step, onSubmit, onContinue, isLast }: StepComponentProps) {
  const content = parseStepContent<TranslateContent>(step);
  const bank = content?.word_bank ?? [];
  const [picked, setPicked] = useState<number[]>([]);
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content) {
    return (
      <View className="p-6">
        <Text className="text-muted-foreground">
          Не удалось распарсить translate content.
        </Text>
      </View>
    );
  }

  const available = bank.map((_, i) => i).filter((i) => !picked.includes(i));
  const locked = state.kind !== 'idle';

  const handleSubmit = async () => {
    if (picked.length === 0) return;
    setState({ kind: 'submitting' });
    try {
      const words = picked.map((i) => bank[i]);
      const resp = await onSubmit({ words });
      const correctText =
        (resp.correct_answer as { text?: string } | undefined)?.text ??
        content.correct_translation;
      setState(
        resp.is_correct
          ? { kind: 'correct', explanation: resp.explanation }
          : { kind: 'wrong', explanation: resp.explanation, correctText },
      );
    } catch (e) {
      console.error(e);
      setState({ kind: 'idle' });
    }
  };

  return (
    <ScrollView
      className="flex-1 px-4 pt-4"
      contentContainerClassName="pb-4"
    >
      <View className="bg-primary/10 rounded-2xl border-2 border-primary/20 p-4 mb-5">
        <Text className="text-foreground text-lg font-black">{content.source_text}</Text>
        {content.instruction && (
          <Text className="text-muted-foreground text-sm font-medium mt-2">
            {content.instruction}
          </Text>
        )}
      </View>

      {/* Answer area */}
      <View className="min-h-[80px] rounded-2xl border-2 border-dashed border-border bg-muted/20 p-3 mb-4 flex-row flex-wrap gap-2">
        {picked.length === 0 ? (
          <Text className="text-muted-foreground text-sm font-medium m-auto">
            Нажми на слова из банка ниже
          </Text>
        ) : (
          picked.map((i) => (
            <Pressable
              key={`p-${i}`}
              disabled={locked}
              onPress={() => setPicked((p) => p.filter((x) => x !== i))}
              className="px-3 py-2 rounded-xl border-2 bg-card"
            >
              <Text className="font-bold text-foreground">{bank[i]}</Text>
            </Pressable>
          ))
        )}
      </View>

      {/* Word bank */}
      <View className="flex-row flex-wrap gap-2 mb-5">
        {available.map((i) => (
          <Pressable
            key={`b-${i}`}
            disabled={locked}
            onPress={() => setPicked((p) => [...p, i])}
            className="px-3 py-2 rounded-xl border-2 bg-card"
          >
            <Text className="font-bold text-foreground">{bank[i]}</Text>
          </Pressable>
        ))}
      </View>

      <FeedbackBar
        state={state}
        canSubmit={picked.length > 0}
        onSubmit={handleSubmit}
        onContinue={onContinue}
        isLast={isLast}
      />
    </ScrollView>
  );
}
