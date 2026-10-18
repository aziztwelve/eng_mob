import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { SKY } from './sky-lesson-header';
import { SkyCard, SkyLabel, SkyMissing, SkyOption, SkyStepLayout, resolveChoice, skyFont } from './sky-ui';
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

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function QuizInteractiveStep({ step, onSubmit, onContinue, isLast }: StepComponentProps) {
  const { t } = useTranslation();
  const content = parseStepContent<QuizContentNew>(step);
  const [picked, setPicked] = useState<number | null>(null);
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content || !content.options) {
    return <SkyMissing message={t('lesson.parse_error')} />;
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
          : { kind: 'wrong', explanation: resp.explanation ?? content.explanation, correctText },
      );
    } catch (e) {
      console.error(e);
      setState({ kind: 'idle' });
    }
  };

  return (
    <SkyStepLayout
      footer={
        <FeedbackBar
          state={state}
          canSubmit={picked !== null}
          onSubmit={handleSubmit}
          onContinue={onContinue}
          isLast={isLast}
        />
      }
    >
      <SkyCard>
        {content.instruction ? <SkyLabel>{t('lesson.instruction.quiz')}</SkyLabel> : null}
        <Text style={{ fontFamily: skyFont.title, fontSize: 20, lineHeight: 27, color: SKY.ink }}>{content.question}</Text>
      </SkyCard>

      <View style={{ gap: 12 }}>
        {content.options.map((opt, i) => (
          <SkyOption
            key={i}
            label={opt.text}
            badge={LETTERS[i]}
            disabled={locked}
            onPress={() => setPicked(i)}
            state={resolveChoice(picked === i, opt.is_correct, state.kind)}
          />
        ))}
      </View>
    </SkyStepLayout>
  );
}
