import React, { useState, useRef } from 'react';
import { Text, View } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { SoundSlot } from '@/lib/audio';
import { useTranslation } from 'react-i18next';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { DraggableWordBank } from './draggable-word-bank';
import { SKY } from './sky-lesson-header';
import { SkyCard, SkyIconButton, SkyLabel, SkyMissing, SkyStepLayout, skyFont } from './sky-ui';
import { parseStepContent, type StepComponentProps } from './step-types';
import type { TapWordsContent } from '@/types/api';
import { playWordTTS } from '@/lib/tts';

/**
 * Tap What You Hear (mobile): аудио + tap + DnD word bank.
 * Порядок слов важен — submit проверяет per-position match.
 */
export function TapWordsStep({ step, onSubmit, onContinue, isLast }: StepComponentProps) {
  const { t } = useTranslation();
  const content = parseStepContent<TapWordsContent>(step);
  const bank = content?.word_bank ?? [];
  const soundRef = useRef(new SoundSlot());
  const [picked, setPicked] = useState<number[]>([]);
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content) {
    return <SkyMissing message={t('lesson.parse_error')} />;
  }

  const locked = state.kind !== 'idle';

  const play = async () => {
    try {
      if (content.audio_url) {
        await soundRef.current.play({ uri: content.audio_url });
        return;
      }
      if (content.audio_text) {
        await playWordTTS(content.audio_text, 'en');
      }
    } catch (e) {
      console.warn('tap_words: play failed', e);
    }
  };

  const handleSubmit = async () => {
    if (picked.length === 0) return;
    setState({ kind: 'submitting' });
    try {
      const words = picked.map((i) => bank[i]);
      const resp = await onSubmit({ words });
      const correct = resp.correct_answer as string[] | undefined;
      setState(
        resp.is_correct
          ? { kind: 'correct', explanation: resp.explanation }
          : {
              kind: 'wrong',
              explanation: resp.explanation,
              correctText: Array.isArray(correct) ? correct.join(' ') : undefined,
            },
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
        {content.audio_url || content.audio_text ? (
          <>
            {content.instruction ? <SkyLabel>{t('lesson.instruction.tap_words')}</SkyLabel> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <SkyIconButton size={64} onPress={play} label={t('lesson.listen_again')}>
                <Volume2 size={28} color="#FFFFFF" />
              </SkyIconButton>
            </View>
          </>
        ) : (
          <Text style={{ fontFamily: skyFont.title, fontSize: 20, lineHeight: 27, color: SKY.ink }}>
            {t('lesson.instruction.tap_words')}
          </Text>
        )}
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
