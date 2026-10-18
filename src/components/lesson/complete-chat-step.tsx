import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { SKY } from './sky-lesson-header';
import { SkyCard, SkyLabel, SkyMissing, SkyOption, SkyStepLayout, resolveChoice, skyFont } from './sky-ui';
import { parseStepContent, type StepComponentProps } from './step-types';
import { stepInstruction } from '@/lib/step-titles';

interface CompleteChatContent {
  dialogue: Array<{ speaker: string; text: string }>;
  answer_speaker?: string;
  options: Array<{ id: string; text: string; is_correct: boolean }>;
  explanation?: string;
}

export function CompleteChatStep({ step, onSubmit, onContinue, isLast }: StepComponentProps) {
  const { t, i18n } = useTranslation();
  const content = parseStepContent<CompleteChatContent>(step);
  const [picked, setPicked] = useState<string | null>(null);
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content?.dialogue?.length || !content.options?.length) {
    return <SkyMissing message={t('lesson.parse_error')} />;
  }

  const locked = state.kind !== 'idle';
  const submit = async () => {
    if (!picked) return;
    setState({ kind: 'submitting' });
    try {
      const response = await onSubmit({ option_id: picked });
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
      <SkyCard style={{ gap: 12 }}>
        <SkyLabel>{stepInstruction(step.type, i18n.language)}</SkyLabel>
        {content.dialogue.map((line, index) => (
          <View key={index}>
            <Text style={{ fontFamily: skyFont.strong, fontSize: 12, color: SKY.blueDark }}>{line.speaker}</Text>
            <Text style={{ fontFamily: skyFont.strong, fontSize: 16, lineHeight: 22, color: SKY.ink }}>{line.text}</Text>
          </View>
        ))}
        <View style={{ borderTopWidth: 1.5, borderTopColor: SKY.card, paddingTop: 12 }}>
          <Text style={{ fontFamily: skyFont.strong, fontSize: 16, color: SKY.muted }}>
            {content.answer_speaker ?? t('lesson.you')}: ___
          </Text>
        </View>
      </SkyCard>
      <View style={{ gap: 12 }}>
        {content.options.map((option, index) => (
          <SkyOption
            key={option.id}
            label={option.text}
            badge={String.fromCharCode(65 + index)}
            disabled={locked}
            onPress={() => setPicked(option.id)}
            state={resolveChoice(picked === option.id, option.is_correct, state.kind)}
          />
        ))}
      </View>
    </SkyStepLayout>
  );
}
