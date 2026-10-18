import { useState } from 'react';
import { Text, View } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { VoiceRecorder } from '@/components/ai/voice-recorder';
import { useCheckPronunciation } from '@/hooks/use-ai';
import { playWordTTS } from '@/lib/tts';
import type { ListeningShadowingContent } from '@/types/api';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { SKY } from './sky-lesson-header';
import { SkyCard, SkyIconButton, SkyLabel, SkyMissing, SkyStepLayout, skyFont } from './sky-ui';
import { parseStepContent, type StepComponentProps } from './step-types';

export function ListeningShadowingStep({ step, onSubmit, onContinue, isLast }: StepComponentProps) {
  const { t } = useTranslation();
  const content = parseStepContent<ListeningShadowingContent>(step);
  const pronunciation = useCheckPronunciation();
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });
  const [failed, setFailed] = useState<string | null>(null);

  if (!content) {
    return <SkyMissing message={t('lesson.parse_error')} />;
  }

  const check = async (audio: Parameters<typeof pronunciation.mutateAsync>[0]['audio']) => {
    setFailed(null);
    setState({ kind: 'submitting' });
    try {
      const pronunciationResult = await pronunciation.mutateAsync({
        audio,
        target_text: content.audio_text,
        language: content.language ?? 'en',
        step_id: step.id,
      });
      if (!pronunciationResult.transcribed_text?.trim()) {
        // Nothing recognised (silence / too quiet): don't submit an empty answer.
        setFailed(`${t('voice.speech_unrecognized')}. ${t('voice.speak_clearer')}`);
        setState({ kind: 'idle' });
        return;
      }
      const accuracy = pronunciationResult.accuracy_score;
      if (accuracy < content.min_accuracy) {
        setState({
          kind: 'wrong',
          correctText: content.audio_text,
          explanation: t('lesson.shadow_low_acc', { acc: Math.round(accuracy * 100), min: Math.round(content.min_accuracy * 100) }),
        });
        return;
      }

      const response = await onSubmit({ text: pronunciationResult.transcribed_text });
      setState(response.is_correct
        ? { kind: 'correct', explanation: response.explanation }
        : { kind: 'wrong', explanation: response.explanation, correctText: content.audio_text });
    } catch (error) {
      console.error('listening_shadowing: check failed', error);
      setFailed(t('lesson.check_failed'));
      setState({ kind: 'idle' });
    }
  };

  const finished = state.kind === 'correct' || state.kind === 'wrong';

  return (
    <SkyStepLayout
      footer={
        finished ? (
          <FeedbackBar state={state} canSubmit={false} onSubmit={() => {}} onContinue={onContinue} isLast={isLast} />
        ) : null
      }
    >
      <SkyCard style={{ alignItems: 'center' }}>
        <SkyLabel>{t('lesson.listen_then_repeat')}</SkyLabel>
        <View style={{ marginTop: 8, alignItems: 'center', gap: 8 }}>
          <SkyIconButton size={72} onPress={() => void playWordTTS(content.audio_text, content.language ?? 'en')} label={t('lesson.listen_phrase')}>
            <Volume2 size={32} color="#FFFFFF" />
          </SkyIconButton>
          <Text style={{ fontFamily: skyFont.strong, fontSize: 14, color: SKY.blueDark }}>{t('lesson.listen_phrase')}</Text>
        </View>
        {content.translation_hint ? (
          <Text style={{ fontFamily: skyFont.medium, fontSize: 14, color: SKY.muted, marginTop: 12, textAlign: 'center' }}>
            {content.translation_hint}
          </Text>
        ) : null}
      </SkyCard>
      {failed && !finished ? (
        <View style={{ marginBottom: 16, padding: 14, borderRadius: 18, backgroundColor: '#FFECEC', borderWidth: 1.5, borderColor: '#FFC9CC' }}>
          <Text style={{ fontFamily: skyFont.bold, fontSize: 14, lineHeight: 20, color: '#B4232A' }}>{failed}</Text>
        </View>
      ) : null}
      {!finished ? <VoiceRecorder light loading={pronunciation.isPending} onSubmit={(audio) => void check(audio)} /> : null}
    </SkyStepLayout>
  );
}
