import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import { Headphones, Play, Volume2 } from 'lucide-react-native';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
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
  const { i18n } = useTranslation();
  const content = parseStepContent<ListenChooseWordContent>(step);
  const [picked, setPicked] = useState<string | null>(null);
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content?.sentence_template || !content.audio_text || !content.options?.length) {
    return <Text className="p-6 text-muted-foreground">Invalid listen_choose_word content.</Text>;
  }

  const locked = state.kind !== 'idle';
  const play = async (text: string, url?: string) => {
    if (url) {
      await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      return;
    }
    await playWordTTS(text, content.language);
  };
  const submit = async () => {
    if (!picked) return;
    setState({ kind: 'submitting' });
    try {
      const response = await onSubmit({ option_id: picked });
      setState(response.is_correct ? { kind: 'correct', explanation: response.explanation ?? content.explanation } : { kind: 'wrong', explanation: response.explanation ?? content.explanation });
    } catch {
      setState({ kind: 'idle' });
    }
  };

  return (
    <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="pb-4">
      <Text className="text-muted-foreground text-sm font-bold mb-3">{stepInstruction(step.type, i18n.language)}</Text>
      <View className="rounded-3xl border border-[rgba(255,255,255,0.22)] bg-[#1B3056] p-5 mb-5">
        <View className="flex-row items-center gap-2 mb-4">
          <Headphones size={18} color="#FFDF5E" />
          <Text className="text-[#FFDF5E] text-xs font-black uppercase tracking-wider">Listen to the sentence</Text>
        </View>
        <Text className="text-foreground text-2xl font-black leading-8 mb-5">{content.sentence_template}</Text>
        <Pressable onPress={() => void play(content.audio_text, content.audio_url)} className="flex-row items-center justify-center gap-3 rounded-2xl bg-[#FFDF5E] py-4">
          <Volume2 size={24} color="#3D0A1A" />
          <Text className="text-[#3D0A1A] font-black">Слушать ещё раз</Text>
        </Pressable>
      </View>
      <Text className="text-foreground font-black text-base mb-3">Какое слово пропущено?</Text>
      <View className="gap-3 mb-5">
        {content.options.map((option) => {
          const selected = picked === option.id;
          const correct = state.kind === 'wrong' && option.is_correct;
          const wrong = state.kind === 'wrong' && selected;
          const style = correct || (state.kind === 'correct' && selected)
            ? 'border-emerald-500 bg-emerald-500/15'
            : wrong
              ? 'border-red-500 bg-red-500/10'
              : selected
                ? 'border-[#FFDF5E] bg-[rgba(255,223,94,0.18)]'
                : 'border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.12)]';
          return (
            <View key={option.id} className={`flex-row items-center rounded-2xl border-2 ${style}`}>
              <Pressable disabled={locked} onPress={() => setPicked(option.id)} className="flex-1 flex-row items-center gap-3 px-4 py-4">
                <View className={`w-8 h-8 rounded-full items-center justify-center ${selected ? 'bg-[#FFDF5E]' : 'bg-white/10'}`}>
                  <Text className={`font-black ${selected ? 'text-[#3D0A1A]' : 'text-foreground'}`}>{option.id}</Text>
                </View>
                <Text className="text-foreground text-lg font-black">{option.audio_text}</Text>
              </Pressable>
              <Pressable disabled={locked} onPress={() => void play(option.audio_text, option.audio_url)} hitSlop={8} className="mr-3 w-11 h-11 rounded-xl items-center justify-center bg-white/10">
                <Play size={20} color="#FFDF5E" fill="#FFDF5E" />
              </Pressable>
            </View>
          );
        })}
      </View>
      <FeedbackBar state={state} canSubmit={picked !== null} onSubmit={submit} onContinue={onContinue} isLast={isLast} />
    </ScrollView>
  );
}
