import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { SKY } from './sky-lesson-header';
import { SkyCard, SkyInput, SkyLabel, SkyMissing, SkyStepLayout, skyFont } from './sky-ui';
import { parseStepContent, type StepComponentProps } from './step-types';
import type { FillBlankContent } from '@/types/api';

/**
 * Fill in the Blank: предложение с ___. Если есть options — кнопки
 * (autosubmit), иначе input.
 */
export function FillBlankStep({ step, onSubmit, onContinue, isLast }: StepComponentProps) {
  const { t } = useTranslation();
  const content = parseStepContent<FillBlankContent>(step);
  const [value, setValue] = useState('');
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content) {
    return <SkyMissing message={t('lesson.parse_error')} />;
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
  const textStyle = { fontFamily: skyFont.title, fontSize: 19, lineHeight: 28, color: SKY.ink } as const;

  return (
    <SkyStepLayout
      footer={
        <FeedbackBar
          state={state}
          canSubmit={value.trim().length > 0}
          onSubmit={() => handleSubmit(value)}
          onContinue={onContinue}
          isLast={isLast}
        />
      }
    >
      <SkyCard>
        <SkyLabel>{t('lesson.instruction.fill_blank')}</SkyLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline' }}>
          {tplParts.map((part, i) => (
            <React.Fragment key={i}>
              <Text style={textStyle}>{part}</Text>
              {i < tplParts.length - 1 && (
                <View style={{ marginHorizontal: 4, minWidth: 80, paddingHorizontal: 10, borderBottomWidth: 3, borderBottomColor: SKY.blue }}>
                  <Text style={[textStyle, { textAlign: 'center', color: SKY.blueDark }]}>{value || ' '}</Text>
                </View>
              )}
            </React.Fragment>
          ))}
        </View>
        {content.translation_hint ? (
          <Text style={{ fontFamily: skyFont.medium, fontSize: 14, color: SKY.muted, marginTop: 10 }}>{content.translation_hint}</Text>
        ) : null}
      </SkyCard>

      {content.options && content.options.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {content.options.map((opt) => {
            const sel = value === opt;
            return (
              <Pressable
                key={opt}
                disabled={locked}
                onPress={() => {
                  setValue(opt);
                  void handleSubmit(opt);
                }}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  borderRadius: 16,
                  backgroundColor: sel ? '#EAF8FF' : '#FFFFFF',
                  borderWidth: 1.5,
                  borderBottomWidth: 4,
                  borderColor: sel ? SKY.blue : '#DDE3E8',
                  borderBottomColor: sel ? SKY.blue : '#D3DAE0',
                  opacity: locked && !sel ? 0.6 : 1,
                }}
              >
                <Text style={{ fontFamily: skyFont.strong, fontSize: 16, color: SKY.ink }}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <SkyInput value={value} editable={!locked} onChangeText={setValue} placeholder={t('lesson.answer_placeholder')} />
      )}
    </SkyStepLayout>
  );
}
