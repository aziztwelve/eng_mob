import React, { useState } from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { DraggableWordBank } from './draggable-word-bank';
import { SKY } from './sky-lesson-header';
import { SkyCard, SkyMissing, SkyStepLayout, skyFont } from './sky-ui';
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
  const { t } = useTranslation();
  const content = parseStepContent<TranslateContent>(step);
  const bank = content?.word_bank ?? [];
  const [picked, setPicked] = useState<number[]>([]);
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content) {
    return <SkyMissing message={t('lesson.parse_error')} />;
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
    <SkyStepLayout
      footer={
        <FeedbackBar
          state={state}
          canSubmit={picked.length > 0}
          onSubmit={handleSubmit}
          onContinue={onContinue}
          isLast={isLast}
        />
      }
    >
      <SkyCard>
        <Text style={{ fontFamily: skyFont.title, fontSize: 21, lineHeight: 28, color: SKY.ink }}>{content.source_text}</Text>
      </SkyCard>

      <DraggableWordBank
        bank={bank}
        picked={picked}
        onChange={setPicked}
        disabled={locked}
        emptyHint={t('lesson.word_bank_hint')}
      />
    </SkyStepLayout>
  );
}
