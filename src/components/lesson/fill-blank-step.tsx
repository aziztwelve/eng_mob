import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { parseStepContent, type StepComponentProps } from './step-types';
import type { FillBlankContent } from '@/types/api';

/**
 * Fill in the Blank: предложение с ___. Если есть options — кнопки
 * (autosubmit), иначе input.
 */
export function FillBlankStep({ step, onSubmit, onContinue, isLast }: StepComponentProps) {
  const content = parseStepContent<FillBlankContent>(step);
  const [value, setValue] = useState('');
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content) {
    return (
      <View className="p-6">
        <Text className="text-muted-foreground">Не удалось распарсить content.</Text>
      </View>
    );
  }

  const locked = state.kind !== 'idle';

  const handleSubmit = async (val: string) => {
    if (!val.trim()) return;
    setState({ kind: 'submitting' });
    try {
      const resp = await onSubmit({ answer: val });
      const correctText =
        (resp.correct_answer as { answer?: string } | undefined)?.answer ??
        content.correct_answer;
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

  const tplParts = content.sentence_template.split('___');

  return (
    <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="pb-4">
      {content.instruction && (
        <Text className="text-foreground font-bold text-base mb-4">{content.instruction}</Text>
      )}

      <View className="bg-primary/10 rounded-2xl border-2 border-primary/20 p-5 mb-5">
        <View className="flex-row flex-wrap items-baseline">
          {tplParts.map((part, i) => (
            <React.Fragment key={i}>
              <Text className="text-foreground text-lg font-black">{part}</Text>
              {i < tplParts.length - 1 && (
                <View className="mx-1 px-3 py-1 border-b-4 border-primary min-w-[80px]">
                  <Text className="text-foreground text-lg font-black text-center">
                    {value || '___'}
                  </Text>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>
        {content.translation_hint && (
          <Text className="text-sm text-muted-foreground font-medium mt-3">
            {content.translation_hint}
          </Text>
        )}
      </View>

      {content.options && content.options.length > 0 ? (
        <View className="flex-row flex-wrap gap-2 mb-5">
          {content.options.map((opt) => (
            <Pressable
              key={opt}
              disabled={locked}
              onPress={() => {
                setValue(opt);
                void handleSubmit(opt);
              }}
              className={`px-4 py-3 rounded-2xl border-2 ${
                value === opt
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card'
              } ${locked ? 'opacity-70' : ''}`}
            >
              <Text className="font-bold text-foreground">{opt}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <TextInput
          value={value}
          editable={!locked}
          onChangeText={setValue}
          placeholder="Введите ответ..."
          placeholderTextColor="#9ca3af"
          className="border-2 border-border rounded-2xl px-4 py-3 text-foreground font-bold mb-4"
        />
      )}

      <FeedbackBar
        state={state}
        canSubmit={value.trim().length > 0}
        onSubmit={() => handleSubmit(value)}
        onContinue={onContinue}
        isLast={isLast}
      />
    </ScrollView>
  );
}
