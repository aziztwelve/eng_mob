import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { VocabularyBankActivity, VocabularyBankWordDetail } from '@/types/api';
import { FigmaSvg } from '@/components/figma/FigmaSvg';
import { BankAudioButton, BankButton, BankCard, BankCoach, BankRetry, BankText } from './WordBankChrome';
import { wordbankAssets as assets } from './wordbank-assets';

export type BankAnswer = { value: string };
export type BankPlayAudio = (text: string, rate?: number) => Promise<void>;
export type BankRecordingSlot = (props: { target: string; onRecognized: (text: string) => void }) => ReactNode;
const text = (v: unknown) => typeof v === 'string' ? v : '';
const record = (v: unknown): Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const strings = (v: unknown) => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

export function BankInput({ value, onChange, placeholder, multiline = false }: { value: string; onChange: (value: string) => void; placeholder: string; multiline?: boolean }) {
  return <TextInput value={value} onChangeText={onChange} placeholder={placeholder} accessibilityLabel={placeholder} placeholderTextColor="#8A949B" multiline={multiline} autoCorrect={false} autoCapitalize="sentences" className={`rounded-[15px] border border-b-[3px] border-[#C9DFEB] bg-white px-4 py-3 font-nunito-semibold text-[17px] leading-6 text-[#171A1C] ${multiline ? 'min-h-[100px]' : 'min-h-[54px]'}`} style={multiline ? { textAlignVertical: 'top' } : undefined} />;
}
function WordTitle({ word }: { word: string }) {
  return <Text className="text-center font-nunito-black text-[32px] leading-[40px] text-[#152F60]">{word}</Text>;
}
export function BankSpeak({ value, onPlay }: { value: string; onPlay: BankPlayAudio }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const play = async () => { setBusy(true); setError(false); try { await onPlay(value); } catch { setError(true); } finally { setBusy(false); } };
  return <View className="items-center gap-1"><BankAudioButton label={t('practice.bank_player.listen')} busy={busy} onPress={() => { void play(); }} />{error ? <BankText small>{t('practice.bank_player.audio_error')}</BankText> : null}</View>;
}
function PracticeNote() {
  const { t } = useTranslation();
  return <View className="rounded-[12px] bg-[#F0FAFF] px-3 py-2"><Text className="text-center font-nunito-semibold text-[12px] leading-[17px] text-[#526879]">{t('practice.bank_player.practice_only')}</Text></View>;
}
export function WordScene({ entry, activity, compact = false }: { entry: VocabularyBankWordDetail; activity: VocabularyBankActivity; compact?: boolean }) {
  const { t } = useTranslation();
  const lemma = (entry.lemma || entry.word.word).trim().toLowerCase();
  const remote = text(activity.payload.image_url) || text(record(activity.payload.image).url);
  const action = lemma === 'action';
  const park = lemma === 'park';
  if (remote || action) return <Image source={remote ? { uri: remote } : assets.action} accessibilityLabel={t('practice.bank_player.scene')} className={`w-full rounded-[20px] ${compact ? 'h-[160px]' : 'h-[210px]'}`} resizeMode="cover" />;
  if (park) return <View className="items-center rounded-[20px] bg-white py-4"><FigmaSvg source={assets.park} width={248.018} height={159.798} /></View>;
  return <BankCoach compact={compact} />;
}
const ConfirmedContext = createContext(false);
const PendingContext = createContext(false);
function Footer({ children }: { children: ReactNode }) { const confirmed = useContext(ConfirmedContext); const pending = useContext(PendingContext); if (confirmed || pending) return null; return <View className="mt-auto gap-3 pt-4">{children}</View>; }

type ActivityProps = {
  entry: VocabularyBankWordDetail; activity: VocabularyBankActivity; onSubmit: (answer: BankAnswer) => void; onPlay: BankPlayAudio; renderRecording: BankRecordingSlot; confirmed?: boolean; pending?: boolean;
};
export function WordBankActivityView(props: ActivityProps) {
  return <PendingContext.Provider value={!!props.pending}><ConfirmedContext.Provider value={!!props.confirmed}><WordBankActivityBody {...props} /></ConfirmedContext.Provider></PendingContext.Provider>;
}
function WordBankActivityBody({ entry, activity, onSubmit, onPlay, renderRecording }: ActivityProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [hint, setHint] = useState(false);
  const submit = (answer = value) => onSubmit({ value: answer });
  const word = entry.word.word;
  const payload = activity.payload;
  const next = t('practice.bank_player.next');

  if (activity.type === 'discover') return <View className="flex-1 gap-4">
    <WordScene entry={entry} activity={activity} />
    {!revealed ? <>
      <BankText>{t('practice.bank_player.guess_scene')}</BankText>
      <BankInput value={value} onChange={setValue} placeholder={t('practice.bank_player.your_guess')} />
      <Footer><BankButton label={t('practice.bank_player.reveal')} onPress={() => setRevealed(true)} /></Footer>
    </> : <>
      <BankCard><View className="flex-row items-center justify-center gap-4"><View className="shrink"><WordTitle word={word} /></View><BankSpeak value={word} onPlay={onPlay} /></View><BankText small>{t('practice.bank_player.guess_recorded')}</BankText></BankCard>
      <Footer><BankButton label={next} onPress={() => submit()} /></Footer>
    </>}
  </View>;

  if (activity.type === 'listen') return <ListenWord word={word} onPlay={onPlay} onSubmit={() => submit('')} />;

  if (activity.type === 'tap_for_meaning') return <View className="flex-1 gap-4">
    <WordScene compact entry={entry} activity={activity} />
    <BankCard>
      <View className="flex-row items-center justify-between gap-3"><View className="flex-1"><WordTitle word={word} /></View><BankSpeak value={word} onPlay={onPlay} /></View>
      {revealed ? <>
        <Text className="text-center font-nunito-semibold text-[13px] text-[#5D686F]">{entry.word.part_of_speech}</Text>
        <Text className="rounded-[14px] bg-[#E9FBEF] px-3 py-3 text-center font-nunito-extrabold text-[24px] leading-[30px] text-[#171A1C]">{entry.word.translation}</Text>
        {entry.meaning !== entry.word.translation ? <BankText>{entry.meaning}</BankText> : null}
      </> : <Pressable onPress={() => setRevealed(true)} accessibilityRole="button" className="min-h-[92px] items-center justify-center rounded-[16px] border border-dashed border-[#59C8FF] bg-[#F0FAFF] px-4 py-4"><Text className="text-center font-nunito-bold text-[17px] leading-6 text-[#247FA8]">{t('practice.bank_player.tap_to_reveal')}</Text></Pressable>}
    </BankCard>
    <Footer><BankButton label={revealed ? next : t('practice.bank_player.open_meaning_first')} disabled={!revealed} onPress={() => submit('')} /></Footer>
  </View>;

  if (activity.type === 'repeat') return <View className="flex-1 gap-4">
    <BankCoach question={word} compact />
    <View className="self-center"><BankSpeak value={word} onPlay={onPlay} /></View>
    {renderRecording({ target: word, onRecognized: setValue })}
    <BankInput value={value} onChange={setValue} placeholder={t('practice.bank_player.or_type_answer')} />
    <PracticeNote />
    <Footer><BankButton label={next} disabled={!value.trim()} onPress={() => submit()} /></Footer>
  </View>;

  if (activity.type === 'word_match' || activity.type === 'meaning_choice') return <View className="flex-1 gap-4">
    {activity.type === 'word_match' ? <WordScene entry={entry} activity={activity} /> : <BankCard><View className="flex-row items-center justify-center gap-4"><View className="shrink"><WordTitle word={word} /></View><BankSpeak value={word} onPlay={onPlay} /></View></BankCard>}
    <View className={`gap-3 ${activity.type === 'word_match' ? 'flex-row flex-wrap' : ''}`}>
      {strings(payload.options).map((option, index) => <View key={`${option}:${index}`} className={activity.type === 'word_match' ? 'w-[48%] grow' : 'w-full'}><Choice label={option} selected={value === option} onPress={() => setValue(option)} /></View>)}
    </View>
    <Footer><BankButton label={t('practice.bank_player.check')} disabled={!value} onPress={() => submit()} /></Footer>
  </View>;

  if (activity.type === 'fill_the_blank') return <View className="flex-1 gap-4">
    <WordScene compact entry={entry} activity={activity} />
    <BankCard><Text className="font-nunito-bold text-[23px] leading-[32px] text-[#171A1C]">{text(payload.prompt)}</Text><BankInput value={value} onChange={setValue} placeholder={t('practice.bank_player.type_word')} /><View className="flex-row items-center justify-center gap-4"><BankSpeak value={text(payload.prompt).replace(/_+/g, '…')} onPlay={onPlay} /><Pressable onPress={() => setHint(!hint)} accessibilityRole="button" accessibilityLabel={t('practice.bank_player.hint')} className="h-12 w-12 items-center justify-center rounded-[14px] border-b-4 border-[#3E8CB2] bg-[#59C8FF]"><FigmaSvg source={assets.hint} width={24} height={24} /></Pressable></View>{hint ? <BankText>{entry.word.translation}</BankText> : null}</BankCard>
    <Footer><BankButton label={t('practice.bank_player.check')} disabled={!value.trim()} onPress={() => submit()} /></Footer>
  </View>;

  if (activity.type === 'sentence_builder') return <BuildSentence tokens={strings(payload.tokens)} onSubmit={submit} onPlay={onPlay} />;
  if (['present_question', 'past_question', 'future_question', 'wh_question'].includes(activity.type)) return <QuestionWord activity={activity} onPlay={onPlay} onSubmit={submit} />;
  if (activity.type === 'positive_answer' || activity.type === 'negative_answer') return <ModelWord activity={activity} onPlay={onPlay} onSubmit={submit} />;
  if (activity.type === 'speak_and_review') return <View className="flex-1 gap-4">
    <BankCoach question={t('practice.bank_player.use_in_sentence')} compact />
    <BankCard><View className="flex-row items-center justify-center gap-4"><View className="shrink"><WordTitle word={word} /></View><BankSpeak value={word} onPlay={onPlay} /></View><BankInput value={value} onChange={setValue} placeholder={t('practice.bank_player.sentence_placeholder')} multiline /></BankCard>
    <PracticeNote />
    <Footer><BankButton label={t('practice.bank_player.finish_schedule_review')} disabled={!value.trim()} onPress={() => submit()} /><BankText small>{t('practice.bank_player.review_next')}</BankText></Footer>
  </View>;
  return <BankCard><BankText>{t('practice.bank_player.unsupported')}</BankText></BankCard>;
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const confirmed = useContext(ConfirmedContext);
  return <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: selected }} className={`min-h-[56px] flex-row items-center justify-center gap-2 rounded-[16px] border border-b-4 px-3 py-3 ${confirmed && selected ? 'border-[#34C759] bg-[#ECFFF2]' : selected ? 'border-[#1AB3FF] bg-[#F0FAFF]' : 'border-[#E3E6E8] bg-white'}`}><Text className="shrink text-center font-nunito-semibold text-[16px] leading-[22px] text-[#171A1C]">{label}</Text>{confirmed && selected ? <Check size={17} color="#247FA8" /> : null}</Pressable>;
}
function ListenWord({ word, onSubmit, onPlay }: { word: string; onSubmit: () => void; onPlay: BankPlayAudio }) {
  const { t } = useTranslation();
  const [rate, setRate] = useState(1);
  const [heard, setHeard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const play = async (speed = rate) => { setRate(speed); setBusy(true); setError(false); try { await onPlay(word, speed); setHeard(true); } catch { setError(true); } finally { setBusy(false); } };
  return <View className="flex-1 gap-4">
    <BankCoach question={word} />
    <BankCard><WordTitle word={word} /><View className="items-center"><BankAudioButton label={t('practice.bank_player.listen')} busy={busy} onPress={() => { void play(); }} /></View><View className="flex-row justify-center gap-3">{[0.75, 1].map(speed => <Pressable key={speed} disabled={busy} onPress={() => { void play(speed); }} accessibilityRole="button" accessibilityState={{ selected: speed === rate }} className={`min-h-11 min-w-[80px] items-center justify-center rounded-[12px] border-b-[3px] px-4 py-2 ${speed === rate ? 'border-[#3E8CB2] bg-[#59C8FF]' : 'border-[#D7E3EB] bg-[#F3F7FA]'}`}><Text className={`font-nunito-bold text-[15px] ${speed === rate ? 'text-white' : 'text-[#5D686F]'}`}>{speed}×</Text></Pressable>)}</View>{error ? <BankText small>{t('practice.bank_player.audio_error')}</BankText> : null}</BankCard>
    <Footer><BankButton label={t('practice.bank_player.listened')} disabled={!heard || busy} onPress={onSubmit} /></Footer>
  </View>;
}
function BuildSentence({ tokens, onSubmit, onPlay }: { tokens: string[]; onSubmit: (value: string) => void; onPlay: BankPlayAudio }) {
  const { t } = useTranslation();
  const [order] = useState(() => {
    const indices = tokens.map((_, index) => index);
    for (let index = indices.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1));
      [indices[index], indices[other]] = [indices[other], indices[index]];
    }
    // A shuffle must not accidentally reveal the authored sentence.
    if (indices.length > 1 && indices.every((value, index) => value === index)) indices.reverse();
    return indices;
  });
  const [built, setBuilt] = useState<number[]>([]);
  const add = (index: number) => setBuilt(current => current.includes(index) ? current : [...current, index]);
  const sentence = built.map(index => tokens[index]).join(' ');
  return <View className="flex-1 gap-4">
    <BankCard><View className="min-h-[120px] flex-row flex-wrap items-start gap-2 rounded-[16px] border border-dashed border-[#C9DFEB] bg-[#F8FCFF] p-3">{built.length ? built.map(index => <Pressable key={index} onPress={() => setBuilt(current => current.filter(i => i !== index))} accessibilityRole="button" className="rounded-[10px] border-b-[3px] border-[#C5DDEB] bg-[#E5F6FF] px-3 py-2"><Text className="font-nunito-bold text-[18px] text-[#171A1C]">{tokens[index]}</Text></Pressable>) : <BankText>{t('practice.bank_player.build_sentence')}</BankText>}</View><View className="self-center"><BankSpeak value={sentence || tokens.join(' ')} onPlay={onPlay} /></View></BankCard>
    <View className="flex-row flex-wrap gap-3">{order.map(index => <Pressable key={index} disabled={built.includes(index)} onPress={() => add(index)} accessibilityRole="button" className={`min-h-12 items-center justify-center rounded-[12px] border border-b-4 border-[#D7DFE5] bg-white px-4 py-2 ${built.includes(index) ? 'opacity-30' : ''}`}><Text className="font-nunito-bold text-[18px] text-[#171A1C]">{tokens[index]}</Text></Pressable>)}</View>
    <BankRetry label={t('practice.bank_player.remove_last')} onPress={() => setBuilt(current => current.slice(0, -1))} />
    <Footer><BankButton label={t('practice.bank_player.check')} disabled={!tokens.length || built.length !== tokens.length} onPress={() => onSubmit(sentence)} /></Footer>
  </View>;
}
function QuestionWord({ activity, onPlay, onSubmit }: { activity: VocabularyBankActivity; onPlay: BankPlayAudio; onSubmit: (value: string) => void }) {
  const { t } = useTranslation();
  const content = record(activity.payload.content);
  const [value, setValue] = useState('');
  const [model, setModel] = useState(false);
  const [kind, setKind] = useState<'positive_answer' | 'negative_answer'>('positive_answer');
  const answer = record(content[kind]);
  const modelText = text(answer.full) || text(answer.short);
  const question = text(content.question);
  const tag = activity.type === 'past_question' ? 'Past' : activity.type === 'future_question' ? 'Future' : activity.type === 'wh_question' ? question.split(' ')[0].toUpperCase() : 'Present';
  return <View className="flex-1 gap-4">
    <View className="self-start rounded-full border border-[#C9EDFF] bg-white px-4 py-2"><Text className="font-nunito-extrabold text-[14px] text-[#247FA8]">{tag}</Text></View>
    <BankCoach compact question={question} />
    <View className="self-center"><BankSpeak value={question} onPlay={onPlay} /></View>
    <BankInput value={value} onChange={setValue} placeholder={t('practice.bank_player.your_answer')} multiline />
    <PracticeNote />
    {model ? <BankCard><BankText small>{t('practice.bank_player.model_label')}</BankText><View className="flex-row gap-2"><View className="flex-1"><Choice label={t('practice.bank_player.model_positive')} selected={kind === 'positive_answer'} onPress={() => setKind('positive_answer')} /></View><View className="flex-1"><Choice label={t('practice.bank_player.model_negative')} selected={kind === 'negative_answer'} onPress={() => setKind('negative_answer')} /></View></View><Text className="font-nunito-bold text-[19px] leading-7 text-[#171A1C]">{modelText || t('practice.bank_player.model_unavailable')}</Text></BankCard> : null}
    <Footer>{model ? <BankButton label={t('practice.bank_player.next')} disabled={!value.trim()} onPress={() => onSubmit(value)} /> : <BankButton label={t('practice.bank_player.show_model')} disabled={!value.trim()} onPress={() => setModel(true)} />}</Footer>
  </View>;
}
function ModelWord({ activity, onPlay, onSubmit }: { activity: VocabularyBankActivity; onPlay: BankPlayAudio; onSubmit: (value: string) => void }) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [shown, setShown] = useState(false);
  const answer = record(activity.payload.model_answer);
  const model = text(answer.full) || text(answer.short);
  const question = text(activity.payload.question);
  return <View className="flex-1 gap-4">
    <BankCoach compact question={question} />
    <View className="self-center"><BankSpeak value={question} onPlay={onPlay} /></View>
    <BankInput value={value} onChange={setValue} placeholder={t('practice.bank_player.your_answer')} multiline />
    <PracticeNote />
    {shown ? <BankCard><BankText small>{t('practice.bank_player.model_label')}</BankText><Text className="font-nunito-bold text-[20px] leading-7 text-[#171A1C]">{model || t('practice.bank_player.model_unavailable')}</Text></BankCard> : null}
    <Footer><BankButton label={shown ? t('practice.bank_player.next') : t('practice.bank_player.show_model')} disabled={!value.trim()} onPress={() => shown ? onSubmit(value) : setShown(true)} /></Footer>
  </View>;
}
