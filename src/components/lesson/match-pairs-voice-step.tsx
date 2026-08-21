import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import { Check, Headphones, Play, Volume2, X } from 'lucide-react-native';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { playWordTTS } from '@/lib/tts';
import { parseStepContent, type StepComponentProps } from './step-types';

type VoicePair = { id: string; audio_text: string; audio_url?: string; text: string };
type MatchPairsVoiceContent = { language: string; pairs: VoicePair[]; explanation?: string };

export function MatchPairsVoiceStep({ step, onSubmit, onContinue, isLast }: StepComponentProps) {
  const content = parseStepContent<MatchPairsVoiceContent>(step);
  const pairs = content?.pairs ?? [];
  const textOrder = useMemo(() => [...pairs.keys()].reverse(), [pairs.length]);
  const [selectedAudio, setSelectedAudio] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrongText, setWrongText] = useState<number | null>(null);
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content || pairs.length < 2) {
    return <Text className="p-6 text-muted-foreground">Invalid match_pairs_voice content.</Text>;
  }

  const play = async (pair: VoicePair) => {
    if (pair.audio_url) {
      await Audio.Sound.createAsync({ uri: pair.audio_url }, { shouldPlay: true });
      return;
    }
    await playWordTTS(pair.audio_text, content.language);
  };

  const pickText = (textIndex: number) => {
    if (selectedAudio === null || state.kind !== 'idle') return;
    if (selectedAudio === textIndex) {
      setMatched((items) => [...items, textIndex]);
      setSelectedAudio(null);
      return;
    }
    setWrongText(textIndex);
    setTimeout(() => {
      setWrongText(null);
      setSelectedAudio(null);
    }, 550);
  };

  const submit = async () => {
    setState({ kind: 'submitting' });
    try {
      const response = await onSubmit({ pairs: Object.fromEntries(pairs.map((pair) => [pair.id, pair.text])) });
      setState(response.is_correct
        ? { kind: 'correct', explanation: response.explanation ?? content.explanation }
        : { kind: 'wrong', explanation: response.explanation ?? content.explanation });
    } catch {
      setState({ kind: 'idle' });
    }
  };

  const locked = state.kind !== 'idle';
  const audioCardClass = (index: number) => `rounded-2xl border-2 p-4 mb-3 ${matched.includes(index) ? 'border-emerald-500 bg-emerald-500/15' : selectedAudio === index ? 'border-[#FFDF5E] bg-[rgba(255,223,94,0.18)]' : 'border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.12)]'}`;
  const textCardClass = (index: number) => `flex-row items-center rounded-2xl border-2 p-4 mb-3 ${matched.includes(index) ? 'border-emerald-500 bg-emerald-500/15' : wrongText === index ? 'border-red-500 bg-red-500/10' : 'border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.12)]'}`;

  return (
    <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="pb-4">
      <View className="rounded-3xl border border-white/20 bg-[#1B3056] p-5 mb-5">
        <View className="flex-row items-center gap-2 mb-2"><Headphones size={18} color="#FFDF5E" /><Text className="text-[#FFDF5E] text-xs font-black uppercase tracking-wider">Sound and spelling</Text></View>
        <Text className="text-foreground text-lg font-black">Слушайте слово слева, затем выберите его написание справа.</Text>
      </View>
      <View className="flex-row gap-3 mb-5">
        <View className="flex-1">
          <Text className="text-muted-foreground text-xs font-black uppercase mb-2">Аудио</Text>
          {pairs.map((pair, index) => (
            <View key={pair.id} className={audioCardClass(index)}>
              <Pressable disabled={locked || matched.includes(index)} onPress={() => setSelectedAudio(index)} className="flex-row items-center gap-3">
                <View className={`w-10 h-10 rounded-xl items-center justify-center ${selectedAudio === index ? 'bg-[#FFDF5E]' : 'bg-white/10'}`}><Volume2 size={22} color={selectedAudio === index ? '#3D0A1A' : '#fff'} /></View>
                <Text className="flex-1 text-foreground font-black">Звук {index + 1}</Text>
                {matched.includes(index) && <Check size={20} color="#10b981" />}
              </Pressable>
              <Pressable disabled={locked || matched.includes(index)} onPress={() => void play(pair)} className="mt-3 flex-row items-center justify-center gap-2 rounded-xl bg-white/10 py-2"><Play size={15} color="#FFDF5E" fill="#FFDF5E" /><Text className="text-[#FFDF5E] text-xs font-bold">Слушать</Text></Pressable>
            </View>
          ))}
        </View>
        <View className="flex-1">
          <Text className="text-muted-foreground text-xs font-black uppercase mb-2">Слово</Text>
          {textOrder.map((index) => (
            <Pressable key={pairs[index].id} disabled={locked || matched.includes(index) || selectedAudio === null} onPress={() => pickText(index)} className={textCardClass(index)}>
              <Text className="flex-1 text-foreground text-lg font-black">{pairs[index].text}</Text>
              {matched.includes(index) && <Check size={20} color="#10b981" />}
              {wrongText === index && <X size={20} color="#ef4444" />}
            </Pressable>
          ))}
        </View>
      </View>
      {selectedAudio !== null && <Text className="text-center text-sm font-bold text-[#FFDF5E] mb-4">Теперь выберите написание для звука {selectedAudio + 1}.</Text>}
      <FeedbackBar state={state} canSubmit={matched.length === pairs.length} onSubmit={submit} onContinue={onContinue} isLast={isLast} />
    </ScrollView>
  );
}
