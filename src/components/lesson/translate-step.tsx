import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { DraggableWordBank } from './draggable-word-bank';
import { parseStepContent, type StepComponentProps } from './step-types';
import type { TranslateContent } from '@/types/api';

/**
 * Translate (mobile): tap + DnD UX.
 *  - Тап слова в банке → добавить в answer area.
 *  - Тап слова в answer → вернуть в банк.
 *  - Drag-and-drop из банка/answer / reorder внутри answer (Phase 2.5).
 *
 * Submit отправляет `{ words: [...] }`.
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

      <DraggableWordBank
        bank={bank}
        picked={picked}
        onChange={setPicked}
        disabled={locked}
        emptyHint="Нажми или перетащи слова сюда"
      />

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
