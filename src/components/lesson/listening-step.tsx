import React, { useState, useRef } from 'react';
import { Text, View } from 'react-native';
import { Volume2, Turtle } from 'lucide-react-native';
import { SoundSlot } from '@/lib/audio';
import { useTranslation } from 'react-i18next';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { SKY } from './sky-lesson-header';
import { SkyCard, SkyIconButton, SkyInput, SkyLabel, SkyMissing, SkyStepLayout, skyFont } from './sky-ui';
import { parseStepContent, type StepComponentProps } from './step-types';
import type { ListeningContent } from '@/types/api';
import { playWordTTS } from '@/lib/tts';

/**
 * Listening: expo-audio plays audio_url; turtle-button = playbackRate 0.5.
 * Если audio_url нет — fallback на TTS.
 */
export function ListeningStep({ step, onSubmit, onContinue, isLast }: StepComponentProps) {
  const { t } = useTranslation();
  const content = parseStepContent<ListeningContent>(step);
  const soundRef = useRef(new SoundSlot());
  const [text, setText] = useState('');
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content) {
    return <SkyMissing message={t('lesson.parse_error')} />;
  }

  const play = async (rate = 1) => {
    if (!content.audio_url) return;
    try {
      await soundRef.current.play({ uri: content.audio_url }, { rate });
    } catch (e) {
      console.warn('listening: play failed', e);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setState({ kind: 'submitting' });
    try {
      const resp = await onSubmit({ text });
      const correctText =
        (resp.correct_answer as { text?: string } | undefined)?.text ?? content.audio_text;
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

  const locked = state.kind !== 'idle';

  return (
    <SkyStepLayout
      footer={
        <FeedbackBar
          state={state}
          canSubmit={text.trim().length > 0}
          onSubmit={handleSubmit}
          onContinue={onContinue}
          isLast={isLast}
        />
      }
    >
      <SkyCard>
        {content.instruction ? <SkyLabel>{t('lesson.instruction.listening')}</SkyLabel> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {content.audio_url ? (
            <>
              <SkyIconButton size={64} onPress={() => play(1)} label={t('lesson.listen_again')}>
                <Volume2 size={28} color="#FFFFFF" />
              </SkyIconButton>
              <SkyIconButton size={48} tone="white" onPress={() => play(0.5)} label="0.5x">
                <Turtle size={22} color={SKY.blueDark} />
              </SkyIconButton>
            </>
          ) : (
            <SkyIconButton
              size={64}
              onPress={() => void playWordTTS(content.audio_text, content.language ?? 'en')}
              label={t('lesson.listen_again')}
            >
              <Volume2 size={28} color="#FFFFFF" />
            </SkyIconButton>
          )}
        </View>
      </SkyCard>

      <SkyInput
        value={text}
        onChangeText={setText}
        editable={!locked}
        placeholder={t('lesson.listening_placeholder')}
      />

      {content.translation_hint && state.kind === 'idle' ? (
        <Text style={{ fontFamily: skyFont.medium, fontSize: 13, color: SKY.muted, marginTop: 10 }}>
          {content.translation_hint}
        </Text>
      ) : null}
    </SkyStepLayout>
  );
}
