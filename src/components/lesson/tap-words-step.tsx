import React, { useState, useRef } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { DraggableWordBank } from './draggable-word-bank';
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
  const soundRef = useRef<Audio.Sound | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content) {
    return (
      <View className="p-6">
        <Text className="text-muted-foreground">{t('lesson.parse_error')}</Text>
      </View>
    );
  }

  const locked = state.kind !== 'idle';

  const play = async () => {
    try {
      if (content.audio_url) {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        const { sound } = await Audio.Sound.createAsync(
          { uri: content.audio_url },
          { shouldPlay: true },
        );
        soundRef.current = sound;
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
    <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="pb-4">
      {content.instruction && (
        <Text className="text-foreground font-bold text-base mb-4">{t('lesson.instruction.tap_words')}</Text>
      )}

      <View className="bg-[rgba(255,255,255,0.10)] rounded-2xl border border-[rgba(255,255,255,0.22)] p-4 mb-5 flex-row items-center gap-3">
        {content.audio_url || content.audio_text ? (
          <Pressable
            onPress={play}
            className="bg-[#FFDF5E] w-16 h-16 rounded-full items-center justify-center"
          >
            <Volume2 size={28} color="#3D0A1A" />
          </Pressable>
        ) : (
          <Text className="text-foreground font-bold text-base">{content.audio_text}</Text>
        )}
      </View>

      <DraggableWordBank
        bank={bank}
        picked={picked}
        onChange={setPicked}
        disabled={locked}
        emptyHint={t('lesson.word_bank_hint')}
      />

      <FeedbackBar
        state={state}
        canSubmit={picked.length > 0}
        onSubmit={handleSubmit}
        onContinue={onContinue}
        isLast={isLast}
      />
    </ScrollView>
  );
}
