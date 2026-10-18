import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { SKY } from './sky-lesson-header';
import { SkyCard, SkyLabel, SkyMissing, SkyOption, SkyStepLayout, resolveChoice, skyFont } from './sky-ui';
import { parseStepContent, type StepComponentProps } from './step-types';
import { stepInstruction } from '@/lib/step-titles';

interface ChooseDefinitionContent {
  word: string;
  options: Array<{ id: string; text: string; is_correct: boolean }>;
  explanation?: string;
}

export function ChooseDefinitionStep({ step, onSubmit, onContinue, isLast }: StepComponentProps) {
  const { t, i18n } = useTranslation();
  const content = parseStepContent<ChooseDefinitionContent>(step);
  const [picked, setPicked] = useState<number | null>(null);
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content?.word || !content.options?.length) {
    return <SkyMissing message={t('lesson.parse_error')} />;
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
    <SkyStepLayout
      footer={<FeedbackBar state={state} canSubmit={picked !== null} onSubmit={submit} onContinue={onContinue} isLast={isLast} />}
    >
      <SkyCard style={{ alignItems: 'center' }}>
        <SkyLabel>{stepInstruction(step.type, i18n.language)}</SkyLabel>
        <Text style={{ fontFamily: skyFont.bold, fontSize: 13, color: SKY.muted, marginTop: 4 }}>{t('lesson.word_col')}</Text>
        <Text style={{ fontFamily: skyFont.title, fontSize: 32, color: SKY.ink, marginTop: 2 }}>{content.word}</Text>
      </SkyCard>
      <View style={{ gap: 12 }}>
        {content.options.map((option, index) => (
          <SkyOption
            key={option.id}
            label={option.text}
            badge={String.fromCharCode(65 + index)}
            disabled={locked}
            onPress={() => setPicked(index)}
            state={resolveChoice(picked === index, option.is_correct, state.kind)}
          />
        ))}
      </View>
    </SkyStepLayout>
  );
}
