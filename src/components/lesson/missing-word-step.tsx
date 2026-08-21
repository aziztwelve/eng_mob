import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { parseStepContent, type StepComponentProps } from './step-types';
import { useTranslation } from 'react-i18next';
import { stepInstruction } from '@/lib/step-titles';

interface MissingWordContent {
  sentence_template: string;
  correct_answer: string;
  hint_prefix: string;
  explanation?: string;
}

export function MissingWordStep({ step, onSubmit, onContinue, isLast }: StepComponentProps) {
  const { i18n } = useTranslation();
  const content = parseStepContent<MissingWordContent>(step);
  const [suffix, setSuffix] = useState('');
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content?.sentence_template || !content.hint_prefix) {
    return <Text className="p-6 text-muted-foreground">Invalid missing_word content.</Text>;
  }

  const locked = state.kind !== 'idle';
  const submit = async () => {
    if (!suffix.trim()) return;
    setState({ kind: 'submitting' });
    try {
      const response = await onSubmit({ text: `${content.hint_prefix}${suffix}` });
      setState(response.is_correct ? { kind: 'correct', explanation: response.explanation ?? content.explanation } : { kind: 'wrong', explanation: response.explanation ?? content.explanation, correctText: content.correct_answer });
    } catch {
      setState({ kind: 'idle' });
    }
  };

  return (
    <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="pb-4">
      <Text className="text-muted-foreground text-sm font-bold mb-3">{stepInstruction(step.type, i18n.language)}</Text>
      <View className="rounded-2xl border border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.10)] p-5 mb-5"><Text className="text-foreground text-2xl font-black text-center">{content.sentence_template}</Text></View>
      <View className="flex-row justify-center mb-5"><Text className="border-2 border-r-0 border-[#FFDF5E] bg-[rgba(255,223,94,0.18)] rounded-l-2xl px-4 py-3 text-foreground text-xl font-black">{content.hint_prefix}</Text><TextInput value={suffix} onChangeText={setSuffix} editable={!locked} autoCapitalize="none" className="w-40 border-2 border-[rgba(255,255,255,0.22)] rounded-r-2xl px-3 py-2 text-foreground text-xl font-bold" /></View>
      <FeedbackBar state={state} canSubmit={suffix.trim().length > 0} onSubmit={submit} onContinue={onContinue} isLast={isLast} />
    </ScrollView>
  );
}
