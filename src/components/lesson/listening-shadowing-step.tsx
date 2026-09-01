import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { VoiceRecorder } from '@/components/ai/voice-recorder';
import { useCheckPronunciation } from '@/hooks/use-ai';
import { playWordTTS } from '@/lib/tts';
import type { ListeningShadowingContent } from '@/types/api';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { parseStepContent, type StepComponentProps } from './step-types';

export function ListeningShadowingStep({ step, onSubmit, onContinue, isLast }: StepComponentProps) {
  const { t } = useTranslation();
  const content = parseStepContent<ListeningShadowingContent>(step);
  const pronunciation = useCheckPronunciation();
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content) {
    return <View className="flex-1 items-center justify-center p-6"><Text className="text-muted-foreground">{t('lesson.parse_error')}</Text></View>;
  }

  const check = async (audio: Parameters<typeof pronunciation.mutateAsync>[0]['audio']) => {
    setState({ kind: 'submitting' });
    try {
      const pronunciationResult = await pronunciation.mutateAsync({
        audio,
        target_text: content.audio_text,
        language: content.language ?? 'en',
        step_id: step.id,
      });
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
      setState({ kind: 'idle' });
    }
  };

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-4 pb-4">
        <Text className="text-foreground text-base font-bold">{t('lesson.listen_then_repeat')}</Text>
        <View className="rounded-2xl border border-white/20 bg-white/10 p-5">
          <Pressable
            onPress={() => void playWordTTS(content.audio_text, content.language ?? 'en')}
            className="items-center rounded-2xl bg-[#FFDF5E] py-4"
          >
            <Volume2 size={28} color="#3D0A1A" />
            <Text className="mt-2 font-black text-[#3D0A1A]">{t('lesson.listen_phrase')}</Text>
          </Pressable>
          {content.translation_hint && <Text className="mt-4 text-center text-sm text-white/70">{content.translation_hint}</Text>}
        </View>
        <VoiceRecorder loading={pronunciation.isPending} onSubmit={(audio) => void check(audio)} />
      </ScrollView>
      <View className="px-4 pb-3 pt-2">
        <FeedbackBar state={state} canSubmit={false} onSubmit={() => {}} onContinue={onContinue} isLast={isLast} />
      </View>
    </View>
  );
}
