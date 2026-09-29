import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import type { CheckPronunciationResponse, VocabularyBankActivity, VocabularyBankXPAward } from '@/types/api';
import { VocabularyBankApi } from '@/lib/api-client';
import { playWordTTS, prefetchWordTTS } from '@/lib/tts';
import { useCheckPronunciation } from '@/hooks/use-ai';
import { useVocabularyBankFeed, useVocabularyBankProgress, useVocabularyBankWord } from '@/hooks/use-vocabulary-bank';
import { VoiceRecorder } from '@/components/ai/voice-recorder';
import {
  IconArrowRight,
  IconMic,
  IconTrophy,
  IconVolume,
} from '@/components/ui/icons';

const GOLD = ["#FFDF5E", "#FFB338"] as const;

const progressKey = (externalId: string) => `vocabulary-bank-player:${externalId}:step`;
const asText = (value: unknown) => typeof value === 'string' ? value : '';
const asOptions = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
const asRecord = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

export default function VocabularyBankLessonScreen() {
  const { externalId } = useLocalSearchParams<{ externalId: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const tabBarHeight = useBottomTabBarHeight();
  // Live app language: the feed (and its "next word" candidates) must match
  // the language the user sees, even if it changed after this screen mounted.
  const locale = (i18n.resolvedLanguage ?? 'ru').slice(0, 2).toLowerCase();
  const query = useVocabularyBankWord(externalId, locale);
  const progressQuery = useVocabularyBankProgress(externalId);
  const feed = useVocabularyBankFeed({ locale, new_limit: 5, in_progress_limit: 5 });
  const entry = query.data?.entry;
  const activities = useMemo(() => entry?.activities.slice().sort((a, b) => a.step - b.step) ?? [], [entry?.activities]);
  const [index, setIndex] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [xpAward, setXpAward] = useState<VocabularyBankXPAward | null>(null);

  useEffect(() => {
    if (entry?.word.word) void prefetchWordTTS(entry.word.word, 'en').catch(() => undefined);
  }, [entry?.word.word]);

  useEffect(() => {
    if (!externalId || !activities.length) return;
    void AsyncStorage.getItem(progressKey(externalId)).then((stored) => {
      const step = progressQuery.data?.progress.current_step ?? Number(stored);
      const savedIndex = activities.findIndex((activity) => activity.step === step);
      setIndex(savedIndex >= 0 ? savedIndex : 0);
    });
  }, [activities, externalId, progressQuery.data?.progress.current_step]);

  // Next-word candidate for the finish screen: first untouched word from the
  // feed (server randomizes new words), current one excluded.
  const nextWord = useMemo(() => {
    const pool = [...(feed.data?.new_words ?? []), ...(feed.data?.in_progress ?? [])];
    return pool.find((candidate) => candidate.word.external_id !== externalId)?.word ?? null;
  }, [feed.data, externalId]);

  const submitAttempt = (step: number, isCorrect: boolean, score: number, pronunciationScore?: number) => {
    // Network sync is non-blocking: the local checkpoint guarantees resume
    // during an offline session, and the protected API records the attempt
    // as soon as the connection is available.
    VocabularyBankApi.recordAttempt(externalId, step, {
      answer: { source: 'mobile_player' }, is_correct: isCorrect, score, pronunciation_score: pronunciationScore,
    }).then((response) => {
      if (response?.xp) setXpAward(response.xp);
    }).catch(() => undefined);
  };

  const advance = (result: { is_correct: boolean; score?: number; pronunciation_score?: number }) => {
    if (index === null) return;
    const completedActivity = activities[index];
    const next = index + 1;
    submitAttempt(completedActivity.step, result.is_correct, result.score ?? (result.is_correct ? 100 : 0), result.pronunciation_score);
    if (next >= activities.length) {
      void AsyncStorage.removeItem(progressKey(externalId));
      setFinished(true);
      return;
    }
    void AsyncStorage.setItem(progressKey(externalId), String(activities[next].step));
    setIndex(next);
  };

  // Wrong answers are recorded immediately: they never block advancing, but
  // the attempts table (and SRS quality) must see them.
  const noteWrong = (step: number) => {
    submitAttempt(step, false, 0);
  };

  if (query.isLoading || index === null) return <ActivityIndicator color="#FFD84A" style={{ marginTop: 56 }} />;
  if (query.error || !entry || !activities.length) return <Text style={s.message}>{t('practice.bank_player.load_error')}</Text>;
  if (finished) {
    return <View style={s.finish}>
      <Stack.Screen options={{ title: entry.word.word }} />
      <LinearGradient colors={GOLD as unknown as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.finishMedal}>
        <IconTrophy size={38} color="#3D0A1A" />
      </LinearGradient>
      <Text style={s.title}>{t('practice.bank_finish_title')}</Text>
      <Text style={s.muted}>{t('practice.bank_finish_text', { word: entry.word.word })}</Text>
      {xpAward ? (
        <View style={s.xpChip}>
          <Text style={s.xpChipText}>{t('practice.bank_finish_xp', { count: xpAward.amount })}</Text>
        </View>
      ) : null}
      {xpAward?.leveled_up ? (
        <Text style={s.levelUp}>{t('practice.bank_finish_levelup', { level: xpAward.new_level })}</Text>
      ) : null}
      {nextWord ? (
        <Pressable
          onPress={() => router.replace(`/practice/vocabulary/${nextWord.external_id}` as never)}
          accessibilityRole="button"
        >
          <LinearGradient colors={GOLD as unknown as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.primaryGold}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.primaryGoldText}>{t('practice.bank_next_word')} · {nextWord.word}</Text>
              <IconArrowRight size={15} color="#3D0A1A" />
            </View>
          </LinearGradient>
        </Pressable>
      ) : null}
      <Pressable onPress={() => router.back()} style={s.primary}>
        <Text style={s.primaryText}>{t('practice.bank_back')}</Text>
      </Pressable>
    </View>;
  }

  const activity = activities[index];
  return <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.content, { paddingBottom: 24 + tabBarHeight }]} keyboardShouldPersistTaps="handled" nestedScrollEnabled showsVerticalScrollIndicator={false}>
    <Stack.Screen options={{ title: entry.word.word }} />
    <View style={s.progressRow}>
      <Text style={s.progressText}>{activity.step} / {activities.length}</Text>
      <Text style={s.progressPct}>{Math.round(((index + 1) / activities.length) * 100)}%</Text>
    </View>
    <View style={s.segments}>
      {activities.map((item, i) => (
        <View key={item.step} style={[s.segment, i < index && s.segmentDone, i === index && s.segmentCurrent]} />
      ))}
    </View>
    <Text style={s.instruction}>{activity.instruction}</Text>
    <ActivityBody
      activity={activity}
      word={entry.word.word}
      translation={entry.word.translation}
      meaning={entry.meaning}
      onAdvance={advance}
      onWrong={() => noteWrong(activity.step)}
    />
  </ScrollView>;
}

function ActivityBody({ activity, word, translation, meaning, onAdvance, onWrong }: { activity: VocabularyBankActivity; word: string; translation: string; meaning: string; onAdvance: (result: { is_correct: boolean; score?: number; pronunciation_score?: number }) => void; onWrong: () => void }) {
  const { t } = useTranslation();
  const payload = activity.payload ?? {};
  const [selected, setSelected] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const target = asText(payload.answer);
  const options = asOptions(payload.options);
  const next = () => onAdvance({ is_correct: feedback === 'correct' || feedback === null, score: feedback === 'wrong' ? 0 : 100 });
  const check = (value: string) => {
    const correct = value.trim().toLocaleLowerCase() === target.trim().toLocaleLowerCase();
    setSelected(value); setFeedback(correct ? 'correct' : 'wrong');
    if (!correct) onWrong();
  };
  const isChoice = activity.type === 'word_match' || activity.type === 'meaning_choice';

  if (activity.type === 'discover') return <DiscoverActivity word={word} onAdvance={next} />;
  if (activity.type === 'listen') return <ListenActivity word={word} onAdvance={next} />;
  if (activity.type === 'tap_for_meaning') return <RevealCard word={word} translation={translation} meaning={meaning} onAdvance={next} />;
  if (activity.type === 'repeat') return <PronounceActivity word={word} onAdvance={next} />;
  if (isChoice) {
    const choose = (option: string) => {
      const correct = option.trim().toLocaleLowerCase() === target.trim().toLocaleLowerCase();
      setSelected(option);
      if (correct) {
        setFeedback('correct');
        // There is no hidden "Continue" below the options: on a small
        // screen a correct choice always moves the learner forward.
        setTimeout(() => onAdvance({ is_correct: true, score: 100 }), 250);
      } else {
        setFeedback('wrong');
        onWrong();
      }
    };
    return <View style={s.card}>
      {activity.type === 'meaning_choice' ? <Text style={s.word}>{word}</Text> : <Text style={s.prompt}>{t('practice.bank_player.choose_word')}</Text>}
      {feedback === 'wrong' ? <Text style={s.tryAgain}>{t('practice.bank_player.try_again')}</Text> : null}
      {options.map((option) => <Pressable key={option} disabled={feedback === 'correct'} onPress={() => choose(option)} style={[s.option, selected === option && s.selected, feedback === 'correct' && selected === option && s.correct, feedback === 'wrong' && selected === option && s.wrong]}><Text style={s.optionText}>{option}</Text></Pressable>)}
    </View>;
  }
  if (activity.type === 'fill_the_blank') return <View style={s.card}><Text style={s.prompt}>{asText(payload.prompt)}</Text><TextInput value={answer} onChangeText={setAnswer} editable={feedback === null} autoCapitalize="characters" placeholder={t('practice.bank_player.type_word')} placeholderTextColor="rgba(255,255,255,0.48)" style={s.input} /><Pressable disabled={!answer.trim() || feedback !== null} onPress={() => check(answer)} style={[s.primary, (!answer.trim() || feedback !== null) && s.disabled]}><Text style={s.primaryText}>{t('practice.bank_player.check')}</Text></Pressable><Feedback feedback={feedback} answer={target} onAdvance={next} /></View>;
  if (activity.type === 'sentence_builder') return <SentenceBuilder tokens={asOptions(payload.tokens)} answer={target} onAdvance={next} onWrong={onWrong} />;
  if (['present_question', 'past_question', 'future_question', 'wh_question'].includes(activity.type)) return <QuestionPractice content={asRecord(payload.content)} onAdvance={next} />;
  if (activity.type === 'positive_answer' || activity.type === 'negative_answer') return <ModelAnswerPractice question={asText(payload.question)} modelAnswer={asRecord(payload.model_answer)} positive={activity.type === 'positive_answer'} onAdvance={next} />;
  if (activity.type === 'speak_and_review') return <SpeakAndReview word={word} onAdvance={next} />;
  return <View style={s.centerCard}><Text style={s.word}>{word}</Text><Text style={s.muted}>{t('practice.bank_player.unsupported')}</Text><Pressable style={s.secondary} onPress={next}><Text style={s.secondaryText}>{t('practice.bank_player.skip')}</Text></Pressable></View>;
}

function RevealCard({ word, translation, meaning, onAdvance }: { word: string; translation: string; meaning: string; onAdvance: () => void }) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);
  return <View style={s.centerCard}><Pressable onPress={() => setRevealed(true)} style={s.reveal}><Text style={s.word}>{word}</Text><Text style={s.muted}>{revealed ? translation : t('practice.bank_player.tap_to_reveal')}</Text>{revealed && <Text style={s.definition}>{meaning}</Text>}</Pressable>{revealed && <Pressable style={s.primary} onPress={onAdvance}><Text style={s.primaryText}>{t('practice.bank_player.next')}</Text></Pressable>}</View>;
}

function Feedback({ feedback, answer, onAdvance }: { feedback: 'correct' | 'wrong' | null; answer: string; onAdvance: () => void }) {
  const { t } = useTranslation();
  if (!feedback) return null;
  return <View style={[s.feedback, feedback === 'correct' ? s.correct : s.wrong]}><Text style={s.feedbackText}>{feedback === 'correct' ? t('practice.bank_player.correct') : t('practice.bank_player.right_answer', { answer })}</Text><Pressable onPress={onAdvance}><Text style={s.continueText}>{t('practice.bank_player.next')}</Text></Pressable></View>;
}

function SentenceBuilder({ tokens, answer, onAdvance, onWrong }: { tokens: string[]; answer: string; onAdvance: () => void; onWrong: () => void }) {
  const { t } = useTranslation();
  const [built, setBuilt] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const availableIndexes = tokens.map((_, index) => index).filter((index) => !built.includes(String(index)));
  const selectedIndexes = built.map(Number);
  const add = (index: number) => { if (!feedback) setBuilt((current) => [...current, String(index)]); };
  const removeLast = () => { if (!feedback) setBuilt((current) => current.slice(0, -1)); };
  const value = selectedIndexes.map((index) => tokens[index]).join(' ');
  const check = () => {
    const correct = value.trim().toLocaleLowerCase() === answer.trim().toLocaleLowerCase();
    setFeedback(correct ? 'correct' : 'wrong');
    if (!correct) onWrong();
  };
  return <View style={s.card}><Text style={s.sentence}>{value || t('practice.bank_player.build_sentence')}</Text><View style={s.tokenRow}>{availableIndexes.map((index) => <Pressable key={index} disabled={feedback !== null} onPress={() => add(index)} style={s.token}><Text style={s.tokenText}>{tokens[index]}</Text></Pressable>)}</View><Pressable disabled={!built.length || feedback !== null} onPress={removeLast} style={[s.secondary, (!built.length || feedback !== null) && s.disabled]}><Text style={s.secondaryText}>{t('practice.bank_player.remove_last')}</Text></Pressable><Pressable disabled={built.length !== tokens.length || feedback !== null} onPress={check} style={[s.primary, (built.length !== tokens.length || feedback !== null) && s.disabled]}><Text style={s.primaryText}>{t('practice.bank_player.check')}</Text></Pressable><Feedback feedback={feedback} answer={answer} onAdvance={onAdvance} /></View>;
}

function DiscoverActivity({ word, onAdvance }: { word: string; onAdvance: () => void }) {
  const { t } = useTranslation();
  const [prediction, setPrediction] = useState('');
  const [revealed, setRevealed] = useState(false);
  return <View style={s.centerCard}><View style={s.scene}><IconVolume size={40} color="rgba(255,255,255,0.35)" /><Text style={s.muted}>{t('practice.bank_player.guess_scene')}</Text></View><TextInput value={prediction} onChangeText={setPrediction} placeholder={t('practice.bank_player.your_guess')} placeholderTextColor="rgba(255,255,255,0.48)" style={s.input} autoCapitalize="characters" />{revealed ? <><Text style={s.word}>{word}</Text><Text style={s.muted}>{t('practice.bank_player.guess_recorded')}</Text><Pressable style={s.primary} onPress={onAdvance}><Text style={s.primaryText}>{t('practice.bank_player.next')}</Text></Pressable></> : <Pressable style={s.primary} onPress={() => setRevealed(true)}><Text style={s.primaryText}>Reveal</Text></Pressable>}</View>;
}

function ListenActivity({ word, onAdvance }: { word: string; onAdvance: () => void }) {
  const { t } = useTranslation();
  const [speed, setSpeed] = useState(1);
  const speak = (rate = speed) => void playWordTTS(word, 'en', undefined, rate);
  return <View style={s.centerCard}><Text style={s.word}>{word}</Text><Pressable onPress={() => speak()} style={s.listen}><IconVolume size={30} color="#FFD84A" /><Text style={s.listenText}>{t('practice.bank_player.listen')}</Text></Pressable><View style={s.speedRow}>{[0.75, 1].map((value) => <Pressable key={value} onPress={() => { setSpeed(value); speak(value); }} style={[s.speed, speed === value && s.speedSelected]}><Text style={s.optionText}>{value}×</Text></Pressable>)}</View><Pressable style={s.primary} onPress={onAdvance}><Text style={s.primaryText}>{t('practice.bank_player.listened')}</Text></Pressable></View>;
}

function PronounceActivity({ word, onAdvance }: { word: string; onAdvance: (result: { is_correct: boolean; score?: number; pronunciation_score?: number }) => void }) {
  const { t } = useTranslation();
  const check = useCheckPronunciation();
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<CheckPronunciationResponse | null>(null);
  const [recorderKey, setRecorderKey] = useState(0);
  const score = result ? Math.round(result.accuracy_score * 100) : 0;
  const isClear = score >= 70;

  const submit = async (audio: { uri: string; type: string; name: string }) => {
    try {
      const response = await check.mutateAsync({ audio, target_text: word, language: 'en' });
      setAttempts((count) => count + 1);
      setResult(response);
    } catch {
      setAttempts((count) => count + 1);
    }
  };

  return <View style={s.centerCard}>
    <Text style={s.word}>{word}</Text>
    <Text style={s.muted}>{t('practice.bank_player.say_the_word')}</Text>
    {!result && attempts < 3 ? <VoiceRecorder key={recorderKey} loading={check.isPending} minDurationSec={1} onSubmit={submit} /> : null}
    {check.isError ? <Text style={s.tryAgain}>{t('ai.check_err')}</Text> : null}
    {result ? <View style={s.model}>
      <Text style={s.modelLabel}>{t('ai.accuracy')}</Text>
      <Text style={[s.modelText, { color: isClear ? '#4ADE80' : '#FFD84A' }]}>{score}%</Text>
      {result.feedback ? <Text style={s.muted}>{result.feedback}</Text> : null}
      {result.transcribed_text ? <Text style={s.muted}>{t('ai.recognized')}: {result.transcribed_text}</Text> : null}
      {attempts < 3 ? <Pressable onPress={() => { setResult(null); check.reset(); setRecorderKey((key) => key + 1); }} style={s.secondary}><Text style={s.secondaryText}>{t('ai.try_again')}</Text></Pressable> : null}
    </View> : null}
    {attempts >= 3 && !result ? <Text style={s.tryAgain}>{t('ai.check_err')}</Text> : null}
    <Pressable disabled={!result} style={[s.primary, !result && s.disabled]} onPress={() => onAdvance({ is_correct: isClear, score, pronunciation_score: result?.accuracy_score })}><Text style={s.primaryText}>{t('practice.bank_player.next')}</Text></Pressable>
  </View>;
}

function QuestionPractice({ content, onAdvance }: { content: Record<string, unknown>; onAdvance: () => void }) {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState<'positive' | 'negative' | null>(null);
  const question = asText(content.question);
  const positive = asRecord(content.positive_answer);
  const negative = asRecord(content.negative_answer);
  const current = answer === 'positive' ? positive : answer === 'negative' ? negative : {};
  const [typed, setTyped] = useState('');
  const [submitted, setSubmitted] = useState(false);
  return <View style={s.card}><Text style={s.question}>{question}</Text><Text style={s.muted}>{t('practice.bank_player.answer_then_model')}</Text>{(['positive', 'negative'] as const).map((kind) => <Pressable key={kind} onPress={() => setAnswer(kind)} style={[s.option, answer === kind && s.selected]}><Text style={s.optionText}>{kind === 'positive' ? t('practice.bank_player.answer_positive') : t('practice.bank_player.answer_negative')}</Text></Pressable>)}<TextInput value={typed} onChangeText={setTyped} placeholder={t('practice.bank_player.or_type_answer')} placeholderTextColor="rgba(255,255,255,0.48)" style={s.input} /><Pressable disabled={!answer && !typed.trim()} style={[s.primary, !answer && !typed.trim() && s.disabled]} onPress={() => setSubmitted(true)}><Text style={s.primaryText}>{t('practice.bank_player.check_answer')}</Text></Pressable>{submitted && <View style={s.model}><Text style={s.modelLabel}>{t('practice.bank_player.model_label')}</Text><Text style={s.modelText}>{asText(current.full) || asText(current.short)}</Text><Pressable style={s.secondary} onPress={onAdvance}><Text style={s.secondaryText}>{t('practice.bank_player.next')}</Text></Pressable></View>}</View>;
}

function ModelAnswerPractice({ question, modelAnswer, positive, onAdvance }: { question: string; modelAnswer: Record<string, unknown>; positive: boolean; onAdvance: () => void }) {
  const { t } = useTranslation();
  const text = asText(modelAnswer.full) || asText(modelAnswer.short);
  const [typed, setTyped] = useState('');
  const [submitted, setSubmitted] = useState(false);
  return <View style={s.centerCard}><Text style={s.question}>{question}</Text><Text style={s.muted}>{positive ? t('practice.bank_player.formulate_positive') : t('practice.bank_player.formulate_negative')}</Text><TextInput value={typed} onChangeText={setTyped} placeholder={t('practice.bank_player.your_answer')} placeholderTextColor="rgba(255,255,255,0.48)" style={s.input} /><Pressable disabled={!typed.trim()} style={[s.primary, !typed.trim() && s.disabled]} onPress={() => setSubmitted(true)}><Text style={s.primaryText}>{t('practice.bank_player.check_answer')}</Text></Pressable>{submitted && <View style={s.model}><Text style={s.modelLabel}>{t('practice.bank_player.model_label')}</Text><Text style={s.modelText}>{text}</Text><Pressable style={s.secondary} onPress={onAdvance}><Text style={s.secondaryText}>{t('practice.bank_player.next')}</Text></Pressable></View>}</View>;
}

function SpeakAndReview({ word, onAdvance }: { word: string; onAdvance: () => void }) {
  const { t } = useTranslation();
  const [sentence, setSentence] = useState('');
  const [seconds, setSeconds] = useState(3);
  const [recordingNow, setRecordingNow] = useState(false);
  const speak = () => void playWordTTS(word, 'en', undefined, 0.8);
  useEffect(() => { if (seconds <= 0) return; const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, [seconds]);
  return <View style={s.card}><Text style={s.word}>{word}</Text><Text style={s.muted}>{seconds > 0 ? t('practice.bank_player.prepare', { seconds }) : t('practice.bank_player.now_speak')}</Text><Text style={s.muted}>{t('practice.bank_player.use_in_sentence')}</Text><Pressable onPress={speak} style={s.listen}><IconVolume size={30} color="#FFD84A" /><Text style={s.listenText}>{t('practice.bank_player.listen_word')}</Text></Pressable><Pressable onPress={() => setRecordingNow((value) => !value)} style={s.listen}>{recordingNow ? <Text style={s.listenIcon}>⏹</Text> : <IconMic size={30} color="#FFD84A" />}<Text style={s.listenText}>{recordingNow ? t('practice.bank_player.stop_recording') : t('practice.bank_player.record_answer')}</Text></Pressable><TextInput value={sentence} onChangeText={setSentence} multiline placeholder="My sentence with this word…" placeholderTextColor="rgba(255,255,255,0.48)" style={[s.input, s.multiline]} accessibilityLabel={t('practice.bank_player.use_in_sentence')} /><Pressable disabled={!sentence.trim() && !recordingNow} onPress={onAdvance} style={[s.primary, !sentence.trim() && !recordingNow && s.disabled]}><Text style={s.primaryText}>{t('practice.bank_player.finish_schedule_review')}</Text></Pressable></View>;
}

const s = StyleSheet.create({
  scene: { minHeight: 140, alignSelf: 'stretch', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', gap: 8 }, speedRow: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' }, speed: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 12, padding: 12, alignItems: 'center' }, speedSelected: { borderColor: '#FFD84A', backgroundColor: 'rgba(255,216,74,0.15)' },
  content: { flexGrow: 1, padding: 20, gap: 16 }, finish: { flex: 1, padding: 30, justifyContent: 'center', alignItems: 'center', gap: 16 }, finishMedal: { width: 88, height: 88, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#FFB338', shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 }, title: { color: '#fff', fontSize: 27, fontWeight: '900', textAlign: 'center' }, message: { color: '#fff', textAlign: 'center', marginTop: 52, fontWeight: '700' }, progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }, progressText: { color: 'rgba(255,255,255,0.55)', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 }, progressPct: { color: '#FFD84A', fontWeight: '900', fontSize: 12 }, segments: { flexDirection: 'row', gap: 3 }, segment: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.14)' }, segmentDone: { backgroundColor: 'rgba(255,216,74,0.45)' }, segmentCurrent: { backgroundColor: '#FFD84A', height: 7 }, instruction: { color: '#fff', fontSize: 21, fontWeight: '900', lineHeight: 28, marginTop: 4 }, card: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderRadius: 20, padding: 18, gap: 12 }, centerCard: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderRadius: 20, padding: 24, gap: 16, alignItems: 'center' }, word: { color: '#fff', fontSize: 32, fontWeight: '900', textAlign: 'center' }, muted: { color: 'rgba(255,255,255,0.78)', fontSize: 15, lineHeight: 21, textAlign: 'center' }, definition: { color: '#fff', fontSize: 16, textAlign: 'center', lineHeight: 23 }, primary: { backgroundColor: '#FFD84A', paddingVertical: 15, paddingHorizontal: 22, borderRadius: 15, alignItems: 'center', alignSelf: 'stretch' }, primaryText: { color: '#3D0A1A', fontWeight: '900', fontSize: 16 }, primaryGold: { paddingVertical: 15, paddingHorizontal: 22, borderRadius: 15, alignItems: 'center', alignSelf: 'stretch' }, primaryGoldText: { color: '#3D0A1A', fontWeight: '900', fontSize: 15 }, secondary: { borderColor: 'rgba(255,255,255,0.35)', borderWidth: 1, paddingVertical: 14, paddingHorizontal: 22, borderRadius: 15, alignItems: 'center', alignSelf: 'stretch' }, secondaryText: { color: '#fff', fontWeight: '900' }, listen: { backgroundColor: 'rgba(255,216,74,0.16)', borderColor: '#FFD84A', borderWidth: 1, padding: 20, borderRadius: 18, alignItems: 'center', alignSelf: 'stretch', gap: 7 }, listenIcon: { fontSize: 30, color: '#FFD84A' }, listenText: { color: '#FFD84A', fontWeight: '900' }, reveal: { alignSelf: 'stretch', alignItems: 'center', gap: 12, paddingVertical: 14 }, prompt: { color: '#fff', fontSize: 20, lineHeight: 28, fontWeight: '800' }, question: { color: '#fff', fontSize: 22, lineHeight: 30, fontWeight: '900', textAlign: 'center' }, tryAgain: { color: '#FFD84A', fontWeight: '800', textAlign: 'center' }, option: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.22)', padding: 15, borderRadius: 15 }, optionText: { color: '#fff', fontWeight: '800', fontSize: 16 }, selected: { borderColor: '#FFD84A', backgroundColor: 'rgba(255,216,74,0.12)' }, correct: { borderColor: '#4ADE80', backgroundColor: 'rgba(74,222,128,0.15)' }, wrong: { borderColor: '#FB7185', backgroundColor: 'rgba(251,113,133,0.14)' }, input: { color: '#fff', borderWidth: 2, borderColor: 'rgba(255,255,255,0.28)', borderRadius: 15, padding: 15, fontSize: 18, fontWeight: '800' }, multiline: { minHeight: 106, textAlignVertical: 'top' }, disabled: { opacity: 0.45 }, feedback: { borderWidth: 1, borderRadius: 15, padding: 14, gap: 10, alignItems: 'center' }, feedbackText: { color: '#fff', fontWeight: '800', textAlign: 'center' }, continueText: { color: '#fff', fontWeight: '900', fontSize: 15 }, sentence: { color: '#fff', fontWeight: '900', fontSize: 20, lineHeight: 29, minHeight: 58 }, tokenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, token: { borderWidth: 1, borderColor: '#FFD84A', backgroundColor: 'rgba(255,216,74,0.12)', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12 }, tokenText: { color: '#fff', fontWeight: '800' }, model: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 14, gap: 5, alignSelf: 'stretch' }, modelLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }, modelText: { color: '#fff', fontSize: 17, fontWeight: '800', lineHeight: 24 }, xpChip: { backgroundColor: 'rgba(255,216,74,0.16)', borderWidth: 1, borderColor: '#FFD84A', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 8 }, xpChipText: { color: '#FFD84A', fontSize: 20, fontWeight: '900' }, levelUp: { color: '#2EECC8', fontSize: 16, fontWeight: '900', textAlign: 'center' },
});
