import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { parseStepContent, type StepComponentProps } from './step-types';
import { useTranslation } from 'react-i18next';
import { stepInstruction } from '@/lib/step-titles';

interface ChooseDefinitionContent {
  word: string;
  options: Array<{ id: string; text: string; is_correct: boolean }>;
  explanation?: string;
}

export function ChooseDefinitionStep({ step, onSubmit, onContinue, isLast }: StepComponentProps) {
  const { i18n } = useTranslation();
  const content = parseStepContent<ChooseDefinitionContent>(step);
  const [picked, setPicked] = useState<number | null>(null);
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content?.word || !content.options?.length) {
    return <Text className="p-6 text-muted-foreground">Invalid choose_definition content.</Text>;
  }

  const locked = state.kind !== 'idle';
  const submit = async () => {
    if (picked === null) return;
    setState({ kind: 'submitting' });
    try {
      const response = await onSubmit({ index: picked });
      const correctText = content.options.find((option) => option.is_correct)?.text;
      setState(response.is_correct
        ? { kind: 'correct', explanation: response.explanation ?? content.explanation }
        : { kind: 'wrong', explanation: response.explanation ?? content.explanation, correctText });
    } catch {
      setState({ kind: 'idle' });
    }
  };

  return (
    <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="pb-4">
      <Text className="text-muted-foreground text-sm font-bold mb-3">{stepInstruction(step.type, i18n.language)}</Text>
      <View className="rounded-2xl border border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.10)] p-5 mb-5 items-center">
        <Text className="text-muted-foreground text-sm font-bold">Word</Text>
        <Text className="text-foreground text-3xl font-black mt-1">{content.word}</Text>
      </View>
      <View className="gap-2 mb-5">
        {content.options.map((option, index) => {
          const selected = picked === index;
          const correct = state.kind === 'wrong' && option.is_correct;
          const wrong = state.kind === 'wrong' && selected;
          return (
            <Pressable key={option.id} disabled={locked} onPress={() => setPicked(index)} className={`rounded-2xl border-2 p-4 ${correct || (state.kind === 'correct' && selected) ? 'border-emerald-500 bg-emerald-500/15' : wrong ? 'border-red-500 bg-red-500/10' : selected ? 'border-[#FFDF5E] bg-[rgba(255,223,94,0.18)]' : 'border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.12)]'}`}>
              <Text className="text-foreground font-bold"><Text className="text-muted-foreground">{option.id}. </Text>{option.text}</Text>
            </Pressable>
          );
        })}
      </View>
      <FeedbackBar state={state} canSubmit={picked !== null} onSubmit={submit} onContinue={onContinue} isLast={isLast} />
    </ScrollView>
  );
}
