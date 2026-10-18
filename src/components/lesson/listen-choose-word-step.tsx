import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { playOnce } from '@/lib/audio';
import { Play, Volume2 } from 'lucide-react-native';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { SKY } from './sky-lesson-header';
import { SkyCard, SkyIconButton, SkyLabel, SkyMissing, SkyOption, SkyStepLayout, resolveChoice, skyFont } from './sky-ui';
import { parseStepContent, type StepComponentProps } from './step-types';
import { useTranslation } from 'react-i18next';
import { stepInstruction } from '@/lib/step-titles';
import { playWordTTS } from '@/lib/tts';

interface ListenChooseWordContent {
  sentence_template: string;
  audio_text: string;
  language: string;
  audio_url?: string;
  options: Array<{ id: string; audio_text: string; audio_url?: string; is_correct: boolean }>;
  explanation?: string;
}

export function ListenChooseWordStep({ step, onSubmit, onContinue, isLast }: StepComponentProps) {
  const { t, i18n } = useTranslation();
  const content = parseStepContent<ListenChooseWordContent>(step);
  const [picked, setPicked] = useState<string | null>(null);
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content?.sentence_template || !content.audio_text || !content.options?.length) {
    return <SkyMissing message={t('lesson.parse_error')} />;
  }

  const locked = state.kind !== 'idle';
  const play = async (text: string, url?: string) => {
    if (url) {
      playOnce({ uri: url });
      return;
    }
    await playWordTTS(text, content.language);
  };
  const submit = async () => {
    if (!picked) return;
    setState({ kind: 'submitting' });
    try {
      const response = await onSubmit({ option_id: picked });
      setState(response.is_correct
        ? { kind: 'correct', explanation: response.explanation ?? content.explanation }
        : { kind: 'wrong', explanation: response.explanation ?? content.explanation });
    } catch {
      setState({ kind: 'idle' });
    }
  };

  return (
    <SkyStepLayout
      footer={<FeedbackBar state={state} canSubmit={picked !== null} onSubmit={submit} onContinue={onContinue} isLast={isLast} />}
    >
      <SkyCard>
        <SkyLabel>{stepInstruction(step.type, i18n.language)}</SkyLabel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <SkyIconButton label={t('lesson.listen_again')} onPress={() => void play(content.audio_text, content.audio_url)}>
            <Volume2 size={26} color="#FFFFFF" />
          </SkyIconButton>
          <Text style={{ flex: 1, fontFamily: skyFont.title, fontSize: 20, lineHeight: 28, color: SKY.ink }}>
            {content.sentence_template}
          </Text>
        </View>
      </SkyCard>
      <Text style={{ fontFamily: skyFont.title, fontSize: 16, color: SKY.ink, marginBottom: 10 }}>{t('lesson.which_word_missing')}</Text>
      <View style={{ gap: 12 }}>
        {content.options.map((option, index) => (
          <SkyOption
            key={option.id}
            label={option.audio_text}
            badge={String.fromCharCode(65 + index)}
            disabled={locked}
            onPress={() => setPicked(option.id)}
            state={resolveChoice(picked === option.id, option.is_correct, state.kind)}
            right={
              <View style={{ marginRight: 8 }}>
                <SkyIconButton size={40} tone="white" label={t('lesson.listen_again')} onPress={() => void play(option.audio_text, option.audio_url)}>
                  <Play size={16} color={SKY.blueDark} fill={SKY.blueDark} />
                </SkyIconButton>
              </View>
            }
          />
        ))}
      </View>
    </SkyStepLayout>
  );
}
