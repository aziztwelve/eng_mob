import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { playOnce } from '@/lib/audio';
import { Check, Play, Volume2, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { SKY } from './sky-lesson-header';
import { SkyCard, SkyLabel, SkyMissing, SkyStepLayout, skyFont } from './sky-ui';
import { playWordTTS } from '@/lib/tts';
import { parseStepContent, type StepComponentProps } from './step-types';

type VoicePair = { id: string; audio_text: string; audio_url?: string; text: string };
type MatchPairsVoiceContent = { language: string; pairs: VoicePair[]; explanation?: string };

export function MatchPairsVoiceStep({ step, onSubmit, onContinue, isLast }: StepComponentProps) {
  const { t } = useTranslation();
  const content = parseStepContent<MatchPairsVoiceContent>(step);
  const pairs = content?.pairs ?? [];
  const textOrder = useMemo(() => [...pairs.keys()].reverse(), [pairs.length]);
  const [selectedAudio, setSelectedAudio] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrongText, setWrongText] = useState<number | null>(null);
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content || pairs.length < 2) {
    return <SkyMissing message={t('lesson.parse_error')} />;
  }

  const play = async (pair: VoicePair) => {
    if (pair.audio_url) {
      playOnce({ uri: pair.audio_url });
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
  const card = (bg: string, border: string, shadow: string) => ({
    backgroundColor: bg,
    borderWidth: 1.5,
    borderBottomWidth: 4,
    borderColor: border,
    borderBottomColor: shadow,
    borderRadius: 16,
    marginBottom: 10,
  });
  const colLabel = { fontFamily: skyFont.strong, fontSize: 11, letterSpacing: 0.9, textTransform: 'uppercase', color: SKY.blueDark, marginBottom: 8, paddingHorizontal: 4 } as const;

  return (
    <SkyStepLayout
      footer={<FeedbackBar state={state} canSubmit={matched.length === pairs.length} onSubmit={submit} onContinue={onContinue} isLast={isLast} />}
    >
      <SkyCard>
        <SkyLabel>{t('lesson.sound_spelling')}</SkyLabel>
        <Text style={{ fontFamily: skyFont.title, fontSize: 18, lineHeight: 25, color: SKY.ink }}>{t('lesson.match_voice_desc')}</Text>
      </SkyCard>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={colLabel}>{t('lesson.audio_col')}</Text>
          {pairs.map((pair, index) => {
            const done = matched.includes(index);
            const sel = selectedAudio === index;
            const look = done ? card('#E9FBEF', SKY.green, SKY.green) : sel ? card('#EAF8FF', SKY.blue, SKY.blue) : card('#FFFFFF', '#DDE3E8', '#D3DAE0');
            return (
              <View key={pair.id} style={[look, { padding: 10 }]}>
                <Pressable disabled={locked || done} onPress={() => setSelectedAudio(index)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? SKY.blue : '#EEF2F5' }}>
                    <Volume2 size={20} color={sel ? '#FFFFFF' : SKY.muted} />
                  </View>
                  <Text style={{ flex: 1, fontFamily: skyFont.strong, fontSize: 14, color: SKY.ink }}>{t('lesson.sound_n', { n: index + 1 })}</Text>
                  {done ? <Check size={18} color={SKY.green} /> : null}
                </Pressable>
                <Pressable
                  disabled={locked || done}
                  onPress={() => void play(pair)}
                  style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 7, backgroundColor: '#EAF8FF' }}
                >
                  <Play size={14} color={SKY.blueDark} fill={SKY.blueDark} />
                  <Text style={{ fontFamily: skyFont.strong, fontSize: 12, color: SKY.blueDark }}>{t('lesson_act.listen')}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={colLabel}>{t('lesson.word_col')}</Text>
          {textOrder.map((index) => {
            const done = matched.includes(index);
            const bad = wrongText === index;
            const look = done ? card('#E9FBEF', SKY.green, SKY.green) : bad ? card('#FFECEC', SKY.red, SKY.red) : card('#FFFFFF', '#DDE3E8', '#D3DAE0');
            return (
              <Pressable
                key={pairs[index].id}
                disabled={locked || done || selectedAudio === null}
                onPress={() => pickText(index)}
                style={[look, { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 56, paddingHorizontal: 12, paddingVertical: 8 }]}
              >
                <Text style={{ flex: 1, fontFamily: skyFont.strong, fontSize: 16, color: SKY.ink }}>{pairs[index].text}</Text>
                {done ? <Check size={18} color={SKY.green} /> : null}
                {bad ? <X size={18} color={SKY.red} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
      {selectedAudio !== null ? (
        <Text style={{ textAlign: 'center', fontFamily: skyFont.strong, fontSize: 14, color: SKY.blueDark, marginTop: 6 }}>
          {t('lesson.select_spelling', { n: selectedAudio + 1 })}
        </Text>
      ) : null}
    </SkyStepLayout>
  );
}
