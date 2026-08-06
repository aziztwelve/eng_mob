import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Volume2, Turtle } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { parseStepContent, type StepComponentProps } from './step-types';
import type { ListeningContent } from '@/types/api';
import { playWordTTS } from '@/lib/tts';

/**
 * Listening: expo-av plays audio_url; turtle-button = playbackRate 0.5.
 * Если audio_url нет — fallback на translation_hint.
 */
export function ListeningStep({ step, onSubmit, onContinue, isLast }: StepComponentProps) {
  const { t } = useTranslation();
  const content = parseStepContent<ListeningContent>(step);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [text, setText] = useState('');
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content) {
    return (
      <View className="p-6">
        <Text className="text-muted-foreground">Не удалось распарсить content.</Text>
      </View>
    );
  }

  const play = async (rate = 1) => {
    if (!content.audio_url) return;
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: content.audio_url },
        { shouldPlay: true, rate, shouldCorrectPitch: true },
      );
      soundRef.current = sound;
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
    <View className="flex-1">
    <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="pb-4" keyboardShouldPersistTaps="handled">
      {content.instruction && (
        <Text className="text-foreground font-bold text-base mb-4">{t('lesson.instruction.listening')}</Text>
      )}

      <View className="bg-[rgba(255,255,255,0.10)] rounded-2xl border border-[rgba(255,255,255,0.22)] p-4 mb-5 flex-row items-center gap-3">
        {content.audio_url ? (
          <>
            <Pressable
              onPress={() => play(1)}
              className="bg-[#FFDF5E] w-16 h-16 rounded-full items-center justify-center"
            >
              <Volume2 size={28} color="#3D0A1A" />
            </Pressable>
            <Pressable
              onPress={() => play(0.5)}
              className="bg-[rgba(255,255,255,0.14)] border border-[rgba(255,255,255,0.24)] w-12 h-12 rounded-full items-center justify-center"
            >
              <Turtle size={20} color="#fff" />
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={() => void playWordTTS(content.audio_text, content.language ?? 'en')}
            className="bg-[#FFDF5E] w-16 h-16 rounded-full items-center justify-center"
          >
            <Volume2 size={28} color="#3D0A1A" />
          </Pressable>
        )}
      </View>

      <TextInput
        value={text}
        onChangeText={setText}
        editable={!locked}
        placeholder={t('lesson.listening_placeholder')}
        placeholderTextColor="rgba(255,255,255,0.5)"
        className="border-2 border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.10)] rounded-2xl px-4 py-3 text-foreground font-bold mb-3"
      />

      {content.translation_hint && state.kind === 'idle' && (
        <Text className="text-xs font-medium mb-4" style={{ color: 'rgba(255,255,255,0.75)' }}>
          Подсказка: {content.translation_hint}
        </Text>
      )}
    </ScrollView>
      <View className="px-4 pb-3 pt-2">
        <FeedbackBar
          state={state}
          canSubmit={text.trim().length > 0}
          onSubmit={handleSubmit}
          onContinue={onContinue}
          isLast={isLast}
        />
      </View>
    </View>
  );
}
