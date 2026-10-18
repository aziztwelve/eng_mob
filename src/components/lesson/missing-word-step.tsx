import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { SKY } from './sky-lesson-header';
import { SkyCard, SkyInput, SkyLabel, SkyMissing, SkyStepLayout, skyFont } from './sky-ui';
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
  const { t, i18n } = useTranslation();
  const content = parseStepContent<MissingWordContent>(step);
  const [suffix, setSuffix] = useState('');
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content?.sentence_template || !content.hint_prefix) {
    return <SkyMissing message={t('lesson.parse_error')} />;
  }

  const locked = state.kind !== 'idle';
  const submit = async () => {
    if (!suffix.trim()) return;
    setState({ kind: 'submitting' });
    try {
      const response = await onSubmit({ text: `${content.hint_prefix}${suffix}` });
      setState(response.is_correct
        ? { kind: 'correct', explanation: response.explanation ?? content.explanation }
        : { kind: 'wrong', explanation: response.explanation ?? content.explanation, correctText: content.correct_answer });
    } catch {
      setState({ kind: 'idle' });
    }
  };

  return (
    <SkyStepLayout
      footer={<FeedbackBar state={state} canSubmit={suffix.trim().length > 0} onSubmit={submit} onContinue={onContinue} isLast={isLast} />}
    >
      <SkyCard>
        <SkyLabel>{stepInstruction(step.type, i18n.language)}</SkyLabel>
        <Text style={{ fontFamily: skyFont.title, fontSize: 24, lineHeight: 32, color: SKY.ink, textAlign: 'center' }}>
          {content.sentence_template}
        </Text>
      </SkyCard>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            minHeight: 56,
            justifyContent: 'center',
            paddingHorizontal: 16,
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
            backgroundColor: '#EAF8FF',
            borderWidth: 1.5,
            borderRightWidth: 0,
            borderBottomWidth: 4,
            borderColor: SKY.blue,
          }}
        >
          <Text style={{ fontFamily: skyFont.title, fontSize: 20, color: SKY.ink }}>{content.hint_prefix}</Text>
        </View>
        <SkyInput
          value={suffix}
          onChangeText={setSuffix}
          editable={!locked}
          autoCapitalize="none"
          style={{ width: 160, fontSize: 20, fontFamily: skyFont.title, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
        />
      </View>
    </SkyStepLayout>
  );
}
