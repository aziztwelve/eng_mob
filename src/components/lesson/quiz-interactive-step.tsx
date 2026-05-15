import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { parseStepContent, type StepComponentProps } from './step-types';

/**
 * Quiz (phase-2 формат): `{ question, options: [{text, is_correct}], explanation }`.
 * Single-select по индексу. Legacy `{ questions: [...] }` обрабатывает старый
 * `quiz-step.tsx`.
 */
interface QuizContentNew {
  instruction?: string;
  question: string;
  options: Array<{ text: string; is_correct: boolean }>;
  explanation?: string;
}

export function QuizInteractiveStep({ step, onSubmit, onContinue, isLast }: StepComponentProps) {
  const content = parseStepContent<QuizContentNew>(step);
  const [picked, setPicked] = useState<number | null>(null);
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content || !content.options) {
    return (
      <View className="p-6">
        <Text className="text-muted-foreground">
          Не phase-2 quiz формат (`{`{ options: [{ text, is_correct }] }`}`).
        </Text>
      </View>
    );
  }

  const locked = state.kind !== 'idle';

  const handleSubmit = async () => {
    if (picked === null) return;
    setState({ kind: 'submitting' });
    try {
      const resp = await onSubmit({ index: picked });
      const correctIdx = content.options.findIndex((o) => o.is_correct);
      const correctText = correctIdx >= 0 ? content.options[correctIdx].text : undefined;
      setState(
        resp.is_correct
          ? { kind: 'correct', explanation: resp.explanation ?? content.explanation }
          : {
              kind: 'wrong',
              explanation: resp.explanation ?? content.explanation,
              correctText,
            },
      );
    } catch (e) {
      console.error(e);
      setState({ kind: 'idle' });
    }
  };

  return (
    <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="pb-4">
      {content.instruction && (
        <Text className="text-muted-foreground text-sm font-bold mb-3">{content.instruction}</Text>
      )}
      <View className="bg-primary/10 rounded-2xl border-2 border-primary/20 p-4 mb-5">
        <Text className="text-foreground text-lg font-black">{content.question}</Text>
      </View>

      <View className="gap-2 mb-5">
        {content.options.map((opt, i) => {
          const isPicked = picked === i;
          const showCorrect = state.kind === 'correct' && isPicked;
          const showWrong = state.kind === 'wrong' && isPicked;
          const showCorrectOnReveal = state.kind === 'wrong' && opt.is_correct;
          return (
            <Pressable
              key={i}
              disabled={locked}
              onPress={() => setPicked(i)}
              className={`rounded-2xl border-2 p-4 ${
                showCorrect || showCorrectOnReveal
                  ? 'border-emerald-500 bg-emerald-500/15'
                  : showWrong
                    ? 'border-red-500 bg-red-500/10'
                    : isPicked
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card'
              }`}
            >
              <Text className="font-bold text-foreground">{opt.text}</Text>
            </Pressable>
          );
        })}
      </View>

      <FeedbackBar
        state={state}
        canSubmit={picked !== null}
        onSubmit={handleSubmit}
        onContinue={onContinue}
        isLast={isLast}
      />
    </ScrollView>
  );
}
