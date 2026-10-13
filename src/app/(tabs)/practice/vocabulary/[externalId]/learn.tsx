import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
  IconCheck,
  IconMic,
  IconTrophy,
  IconVolume,
  IconX,
} from '@/components/ui/icons';

const GOLD: [string, string] = ['#FFDF5E', '#FFB338'];
const GOLD_TEXT = '#FFE166';
const ON_GOLD = '#3D0A1A';
const MINT = '#2EECC8';
const ROSE = '#FB7185';

const progressKey = (externalId: string) => `vocabulary-bank-player:${externalId}:step`;
const asText = (value: unknown) => typeof value === 'string' ? value : '';
const asOptions = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
const asRecord = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

/** Primary action — gold gradient with a warm glow, mirrors the bank hero button. */
function GoldButton({ onPress, disabled, children }: { onPress: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" style={({ pressed }) => [s.btnHit, pressed && s.btnPressed, disabled && s.disabled]}>
      <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.goldBtn}>
        {children}
      </LinearGradient>
    </Pressable>
  );
}

/** Secondary action — quiet gold glass, never competes with the primary. */
function GhostButton({ onPress, disabled, children }: { onPress: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" style={({ pressed }) => [s.ghostBtn, pressed && s.btnPressed, disabled && s.disabled]}>
      {children}
    </Pressable>
  );
}

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
      <View style={s.finishCard}>
        <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.finishMedal}>
          <IconTrophy size={38} color={ON_GOLD} />
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
        <View style={s.finishActions}>
          {nextWord ? (
            <GoldButton onPress={() => router.replace(`/practice/vocabulary/${nextWord.external_id}` as never)}>
              <Text style={s.goldBtnText}>{t('practice.bank_next_word')} · {nextWord.word}</Text>
              <IconArrowRight size={15} color={ON_GOLD} />
            </GoldButton>
          ) : null}
          <GhostButton onPress={() => router.back()}>
            <Text style={s.ghostText}>{t('practice.bank_back')}</Text>
          </GhostButton>
        </View>
      </View>
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
      {options.map((option) => (
        <Pressable
          key={option}
          disabled={feedback === 'correct'}
          onPress={() => choose(option)}
          style={({ pressed }) => [s.option, pressed && s.btnPressed, selected === option && s.selected, feedback === 'correct' && selected === option && s.correct, feedback === 'wrong' && selected === option && s.wrong]}
        >
          <Text style={s.optionText}>{option}</Text>
        </Pressable>
      ))}
    </View>;
  }
  if (activity.type === 'fill_the_blank') return <View style={s.card}>
    <Text style={s.prompt}>{asText(payload.prompt)}</Text>
    <TextInput value={answer} onChangeText={setAnswer} editable={feedback === null} autoCapitalize="characters" placeholder={t('practice.bank_player.type_word')} placeholderTextColor="rgba(255,255,255,0.48)" style={s.input} />
    <GoldButton disabled={!answer.trim() || feedback !== null} onPress={() => check(answer)}>
      <Text style={s.goldBtnText}>{t('practice.bank_player.check')}</Text>
    </GoldButton>
    <Feedback feedback={feedback} answer={target} onAdvance={next} />
  </View>;
  if (activity.type === 'sentence_builder') return <SentenceBuilder tokens={asOptions(payload.tokens)} answer={target} onAdvance={next} onWrong={onWrong} />;
  if (['present_question', 'past_question', 'future_question', 'wh_question'].includes(activity.type)) return <QuestionPractice content={asRecord(payload.content)} onAdvance={next} />;
  if (activity.type === 'positive_answer' || activity.type === 'negative_answer') return <ModelAnswerPractice question={asText(payload.question)} modelAnswer={asRecord(payload.model_answer)} positive={activity.type === 'positive_answer'} onAdvance={next} />;
  if (activity.type === 'speak_and_review') return <SpeakAndReview word={word} onAdvance={next} />;
  return <View style={s.centerCard}>
    <Text style={s.word}>{word}</Text>
    <Text style={s.muted}>{t('practice.bank_player.unsupported')}</Text>
    <GhostButton onPress={next}><Text style={s.ghostText}>{t('practice.bank_player.skip')}</Text></GhostButton>
  </View>;
}

function RevealCard({ word, translation, meaning, onAdvance }: { word: string; translation: string; meaning: string; onAdvance: () => void }) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);
  return <View style={s.centerCard}>
    <Pressable onPress={() => setRevealed(true)} style={s.reveal}>
      <Text style={s.word}>{word}</Text>
      <Text style={revealed ? s.translation : s.muted}>{revealed ? translation : t('practice.bank_player.tap_to_reveal')}</Text>
      {revealed ? <Text style={s.definition}>{meaning}</Text> : null}
    </Pressable>
    {revealed ? <GoldButton onPress={onAdvance}><Text style={s.goldBtnText}>{t('practice.bank_player.next')}</Text></GoldButton> : null}
  </View>;
}

function Feedback({ feedback, answer, onAdvance }: { feedback: 'correct' | 'wrong' | null; answer: string; onAdvance: () => void }) {
  const { t } = useTranslation();
  if (!feedback) return null;
  const correct = feedback === 'correct';
  return <View style={[s.feedback, correct ? s.feedbackCorrect : s.feedbackWrong]}>
    <View style={s.feedbackHead}>
      <View style={s.feedbackIcon}>
        {correct ? <IconCheck size={13} color={MINT} strokeWidth={2.6} /> : <IconX size={12} color={ROSE} />}
      </View>
      <Text style={s.feedbackText}>{correct ? t('practice.bank_player.correct') : t('practice.bank_player.right_answer', { answer })}</Text>
    </View>
    <GoldButton onPress={onAdvance}>
      <Text style={s.goldBtnText}>{t('practice.bank_player.next')}</Text>
      <IconArrowRight size={15} color={ON_GOLD} />
    </GoldButton>
  </View>;
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
  return <View style={s.card}>
    <View style={s.sentenceBox}>
      <Text style={value ? s.sentence : s.sentenceEmpty}>{value || t('practice.bank_player.build_sentence')}</Text>
    </View>
    <View style={s.tokenRow}>
      {availableIndexes.map((index) => (
        <Pressable key={index} disabled={feedback !== null} onPress={() => add(index)} style={({ pressed }) => [s.token, pressed && s.btnPressed]}>
          <Text style={s.tokenText}>{tokens[index]}</Text>
        </Pressable>
      ))}
    </View>
    <GhostButton disabled={!built.length || feedback !== null} onPress={removeLast}>
      <Text style={s.ghostText}>{t('practice.bank_player.remove_last')}</Text>
    </GhostButton>
    <GoldButton disabled={built.length !== tokens.length || feedback !== null} onPress={check}>
      <Text style={s.goldBtnText}>{t('practice.bank_player.check')}</Text>
    </GoldButton>
    <Feedback feedback={feedback} answer={answer} onAdvance={onAdvance} />
  </View>;
}

function DiscoverActivity({ word, onAdvance }: { word: string; onAdvance: () => void }) {
  const { t } = useTranslation();
  const [prediction, setPrediction] = useState('');
  const [revealed, setRevealed] = useState(false);
  return <View style={s.centerCard}>
    <View style={s.scene}>
      <View style={s.sceneIcon}><IconVolume size={28} color={GOLD_TEXT} /></View>
      <Text style={s.muted}>{t('practice.bank_player.guess_scene')}</Text>
    </View>
    <TextInput value={prediction} onChangeText={setPrediction} placeholder={t('practice.bank_player.your_guess')} placeholderTextColor="rgba(255,255,255,0.48)" style={s.input} autoCapitalize="characters" />
    {revealed ? <>
      <Text style={s.word}>{word}</Text>
      <Text style={s.muted}>{t('practice.bank_player.guess_recorded')}</Text>
      <GoldButton onPress={onAdvance}><Text style={s.goldBtnText}>{t('practice.bank_player.next')}</Text></GoldButton>
    </> : <GoldButton onPress={() => setRevealed(true)}><Text style={s.goldBtnText}>{t('practice.bank_player.reveal')}</Text></GoldButton>}
  </View>;
}

function ListenActivity({ word, onAdvance }: { word: string; onAdvance: () => void }) {
  const { t } = useTranslation();
  const [speed, setSpeed] = useState(1);
  const speak = (rate = speed) => void playWordTTS(word, 'en', undefined, rate);
  return <View style={s.centerCard}>
    <Text style={s.word}>{word}</Text>
    <Pressable onPress={() => speak()} style={({ pressed }) => [s.actionRow, pressed && s.btnPressed]} accessibilityRole="button" accessibilityLabel={t('practice.bank_player.listen')}>
      <View style={s.actionIcon}><IconVolume size={21} color={GOLD_TEXT} /></View>
      <Text style={s.actionText}>{t('practice.bank_player.listen')}</Text>
    </Pressable>
    <View style={s.speedRow}>
      {[0.75, 1].map((value) => (
        <Pressable key={value} onPress={() => { setSpeed(value); speak(value); }} style={({ pressed }) => [s.speed, pressed && s.btnPressed, speed === value && s.speedSelected]}>
          <Text style={[s.speedText, speed === value && s.speedTextSelected]}>{value}×</Text>
        </Pressable>
      ))}
    </View>
    <GoldButton onPress={onAdvance}><Text style={s.goldBtnText}>{t('practice.bank_player.listened')}</Text></GoldButton>
  </View>;
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
      <Text style={[s.modelScore, { color: isClear ? MINT : GOLD_TEXT }]}>{score}%</Text>
      {result.feedback ? <Text style={s.muted}>{result.feedback}</Text> : null}
      {result.transcribed_text ? <Text style={s.muted}>{t('ai.recognized')}: {result.transcribed_text}</Text> : null}
      {attempts < 3 ? <GhostButton onPress={() => { setResult(null); check.reset(); setRecorderKey((key) => key + 1); }}><Text style={s.ghostText}>{t('ai.try_again')}</Text></GhostButton> : null}
    </View> : null}
    {attempts >= 3 && !result ? <Text style={s.tryAgain}>{t('ai.check_err')}</Text> : null}
    <GoldButton disabled={!result} onPress={() => onAdvance({ is_correct: isClear, score, pronunciation_score: result?.accuracy_score })}>
      <Text style={s.goldBtnText}>{t('practice.bank_player.next')}</Text>
    </GoldButton>
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
  return <View style={s.card}>
    <Text style={s.question}>{question}</Text>
    <Text style={s.muted}>{t('practice.bank_player.answer_then_model')}</Text>
    {(['positive', 'negative'] as const).map((kind) => (
      <Pressable key={kind} onPress={() => setAnswer(kind)} style={({ pressed }) => [s.option, pressed && s.btnPressed, answer === kind && s.selected]}>
        <Text style={s.optionText}>{kind === 'positive' ? t('practice.bank_player.answer_positive') : t('practice.bank_player.answer_negative')}</Text>
      </Pressable>
    ))}
    <TextInput value={typed} onChangeText={setTyped} placeholder={t('practice.bank_player.or_type_answer')} placeholderTextColor="rgba(255,255,255,0.48)" style={s.input} />
    <GoldButton disabled={!answer && !typed.trim()} onPress={() => setSubmitted(true)}>
      <Text style={s.goldBtnText}>{t('practice.bank_player.check_answer')}</Text>
    </GoldButton>
    {submitted ? <View style={s.model}>
      <Text style={s.modelLabel}>{t('practice.bank_player.model_label')}</Text>
      <Text style={s.modelText}>{asText(current.full) || asText(current.short)}</Text>
      <GoldButton onPress={onAdvance}>
        <Text style={s.goldBtnText}>{t('practice.bank_player.next')}</Text>
        <IconArrowRight size={15} color={ON_GOLD} />
      </GoldButton>
    </View> : null}
  </View>;
}

function ModelAnswerPractice({ question, modelAnswer, positive, onAdvance }: { question: string; modelAnswer: Record<string, unknown>; positive: boolean; onAdvance: () => void }) {
  const { t } = useTranslation();
  const text = asText(modelAnswer.full) || asText(modelAnswer.short);
  const [typed, setTyped] = useState('');
  const [submitted, setSubmitted] = useState(false);
  return <View style={s.centerCard}>
    <Text style={s.question}>{question}</Text>
    <Text style={s.muted}>{positive ? t('practice.bank_player.formulate_positive') : t('practice.bank_player.formulate_negative')}</Text>
    <TextInput value={typed} onChangeText={setTyped} placeholder={t('practice.bank_player.your_answer')} placeholderTextColor="rgba(255,255,255,0.48)" style={s.input} />
    <GoldButton disabled={!typed.trim()} onPress={() => setSubmitted(true)}>
      <Text style={s.goldBtnText}>{t('practice.bank_player.check_answer')}</Text>
    </GoldButton>
    {submitted ? <View style={s.model}>
      <Text style={s.modelLabel}>{t('practice.bank_player.model_label')}</Text>
      <Text style={s.modelText}>{text}</Text>
      <GoldButton onPress={onAdvance}>
        <Text style={s.goldBtnText}>{t('practice.bank_player.next')}</Text>
        <IconArrowRight size={15} color={ON_GOLD} />
      </GoldButton>
    </View> : null}
  </View>;
}

function SpeakAndReview({ word, onAdvance }: { word: string; onAdvance: () => void }) {
  const { t } = useTranslation();
  const [sentence, setSentence] = useState('');
  const [seconds, setSeconds] = useState(3);
  const [recordingNow, setRecordingNow] = useState(false);
  const speak = () => void playWordTTS(word, 'en', undefined, 0.8);
  useEffect(() => { if (seconds <= 0) return; const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(timer); }, [seconds]);
  return <View style={s.card}>
    <Text style={s.word}>{word}</Text>
    <Text style={s.countdown}>{seconds > 0 ? t('practice.bank_player.prepare', { seconds }) : t('practice.bank_player.now_speak')}</Text>
    <Text style={s.muted}>{t('practice.bank_player.use_in_sentence')}</Text>
    <Pressable onPress={speak} style={({ pressed }) => [s.actionRow, pressed && s.btnPressed]} accessibilityRole="button" accessibilityLabel={t('practice.bank_player.listen_word')}>
      <View style={s.actionIcon}><IconVolume size={21} color={GOLD_TEXT} /></View>
      <Text style={s.actionText}>{t('practice.bank_player.listen_word')}</Text>
    </Pressable>
    <Pressable onPress={() => setRecordingNow((value) => !value)} style={({ pressed }) => [s.actionRow, pressed && s.btnPressed, recordingNow && s.actionRowRecording]} accessibilityRole="button" accessibilityLabel={recordingNow ? t('practice.bank_player.stop_recording') : t('practice.bank_player.record_answer')}>
      <View style={[s.actionIcon, recordingNow && s.actionIconRecording]}>
        {recordingNow ? <IconX size={20} color={ROSE} /> : <IconMic size={21} color={GOLD_TEXT} />}
      </View>
      <Text style={[s.actionText, recordingNow && s.actionTextRecording]}>{recordingNow ? t('practice.bank_player.stop_recording') : t('practice.bank_player.record_answer')}</Text>
    </Pressable>
    <TextInput value={sentence} onChangeText={setSentence} multiline placeholder={t('practice.bank_player.sentence_placeholder')} placeholderTextColor="rgba(255,255,255,0.48)" style={[s.input, s.multiline]} accessibilityLabel={t('practice.bank_player.use_in_sentence')} />
    <GoldButton disabled={!sentence.trim() && !recordingNow} onPress={onAdvance}>
      <Text style={s.goldBtnText}>{t('practice.bank_player.finish_schedule_review')}</Text>
    </GoldButton>
  </View>;
}

const s = StyleSheet.create({
  // Buttons
  btnHit: { alignSelf: 'stretch', borderRadius: 16 },
  btnPressed: { opacity: 0.86 },
  goldBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: 20, borderRadius: 15, shadowColor: '#FFB338', shadowOpacity: 0.42, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  goldBtnText: { color: ON_GOLD, fontWeight: '900', fontSize: 15 },
  ghostBtn: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 15, alignSelf: 'stretch', backgroundColor: 'rgba(255,224,95,0.08)', borderWidth: 1, borderColor: 'rgba(255,224,95,0.36)' },
  ghostText: { color: GOLD_TEXT, fontWeight: '900', fontSize: 15 },
  disabled: { opacity: 0.45 },

  // Layout
  content: { flexGrow: 1, padding: 16, gap: 12 },
  finish: { flex: 1, padding: 20, justifyContent: 'center' },
  finishCard: { borderRadius: 26, padding: 24, gap: 14, alignItems: 'center', backgroundColor: 'rgba(65, 11, 71, 0.84)', borderWidth: 1, borderColor: 'rgba(255, 224, 104, 0.38)', shadowColor: '#22062F', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  finishMedal: { width: 88, height: 88, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#FFB338', shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  finishActions: { alignSelf: 'stretch', gap: 10, marginTop: 6 },
  title: { color: '#fff', fontSize: 27, fontWeight: '900', textAlign: 'center' },
  message: { color: '#fff', textAlign: 'center', marginTop: 52, fontWeight: '700' },

  // Progress header
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  progressText: { color: 'rgba(238,218,247,0.62)', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
  progressPct: { color: GOLD_TEXT, fontWeight: '900', fontSize: 12 },
  segments: { flexDirection: 'row', gap: 3 },
  segment: { flex: 1, height: 5, borderRadius: 4, backgroundColor: 'rgba(75, 31, 104, 0.72)' },
  segmentDone: { backgroundColor: '#FFE166' },
  segmentCurrent: { backgroundColor: '#FFB338', height: 7, marginTop: -1, shadowColor: '#FFB338', shadowOpacity: 1, shadowRadius: 6, elevation: 3 },
  instruction: { color: '#fff', fontSize: 19, fontWeight: '900', lineHeight: 25, marginTop: 2 },

  // Glass surfaces — the same plum glass + gold hairline as the bank hero
  card: { backgroundColor: 'rgba(65, 11, 71, 0.84)', borderColor: 'rgba(255, 224, 104, 0.38)', borderWidth: 1, borderRadius: 22, padding: 16, gap: 10, shadowColor: '#22062F', shadowOpacity: 0.28, shadowRadius: 8, elevation: 3 },
  centerCard: { backgroundColor: 'rgba(65, 11, 71, 0.84)', borderColor: 'rgba(255, 224, 104, 0.38)', borderWidth: 1, borderRadius: 22, padding: 18, gap: 12, alignItems: 'center', shadowColor: '#22062F', shadowOpacity: 0.28, shadowRadius: 8, elevation: 3 },
  word: { color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  translation: { color: GOLD_TEXT, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  muted: { color: 'rgba(238,218,247,0.78)', fontSize: 15, lineHeight: 21, textAlign: 'center' },
  countdown: { color: GOLD_TEXT, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  definition: { color: 'rgba(238,218,247,0.9)', fontSize: 16, textAlign: 'center', lineHeight: 23 },
  prompt: { color: '#fff', fontSize: 20, lineHeight: 28, fontWeight: '800' },
  question: { color: '#fff', fontSize: 22, lineHeight: 30, fontWeight: '900', textAlign: 'center' },
  tryAgain: { color: GOLD_TEXT, fontWeight: '800', textAlign: 'center' },

  // Options & inputs — deep inner glass on the plum card
  option: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(42,13,66,0.45)', padding: 13, borderRadius: 15 },
  optionText: { color: '#fff', fontWeight: '800', fontSize: 16, textAlign: 'center' },
  selected: { borderColor: '#FFE166', backgroundColor: 'rgba(255,216,74,0.14)' },
  correct: { borderColor: 'rgba(46,236,200,0.65)', backgroundColor: 'rgba(46,236,200,0.14)' },
  wrong: { borderColor: 'rgba(251,113,133,0.65)', backgroundColor: 'rgba(251,113,133,0.12)' },
  input: { color: '#fff', borderWidth: 1.5, borderColor: 'rgba(255,224,95,0.32)', backgroundColor: 'rgba(42,13,66,0.55)', borderRadius: 14, padding: 13, fontSize: 17, fontWeight: '800' },
  multiline: { minHeight: 88, textAlignVertical: 'top' },

  // Feedback
  feedback: { borderWidth: 1, borderRadius: 15, padding: 12, gap: 10, alignSelf: 'stretch' },
  feedbackCorrect: { borderColor: 'rgba(46,236,200,0.45)', backgroundColor: 'rgba(46,236,200,0.10)' },
  feedbackWrong: { borderColor: 'rgba(251,113,133,0.45)', backgroundColor: 'rgba(251,113,133,0.10)' },
  feedbackHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  feedbackIcon: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.10)' },
  feedbackText: { color: '#fff', fontWeight: '800', flexShrink: 1 },

  // Sentence builder
  sentenceBox: { minHeight: 62, borderRadius: 14, padding: 12, backgroundColor: 'rgba(42,13,66,0.55)', borderWidth: 1, borderColor: 'rgba(255,224,104,0.22)', justifyContent: 'center' },
  sentence: { color: '#fff', fontWeight: '900', fontSize: 19, lineHeight: 27 },
  sentenceEmpty: { color: 'rgba(238,218,247,0.55)', fontWeight: '800', fontSize: 17, lineHeight: 25 },
  tokenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  token: { borderWidth: 1, borderColor: 'rgba(255,224,95,0.42)', backgroundColor: 'rgba(255,216,74,0.13)', paddingVertical: 9, paddingHorizontal: 13, borderRadius: 12 },
  tokenText: { color: '#fff', fontWeight: '800' },

  // Gold glass action rows (listen / record)
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,224,95,0.10)', borderWidth: 1, borderColor: 'rgba(255,224,95,0.34)', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, alignSelf: 'stretch' },
  actionIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,224,95,0.14)', borderWidth: 1, borderColor: 'rgba(255,224,95,0.36)' },
  actionText: { color: GOLD_TEXT, fontWeight: '900', fontSize: 14, flex: 1 },
  actionRowRecording: { backgroundColor: 'rgba(251,113,133,0.10)', borderColor: 'rgba(251,113,133,0.5)' },
  actionIconRecording: { backgroundColor: 'rgba(251,113,133,0.14)', borderColor: 'rgba(251,113,133,0.5)' },
  actionTextRecording: { color: ROSE },

  // Discover scene
  scene: { minHeight: 110, alignSelf: 'stretch', borderRadius: 16, backgroundColor: 'rgba(42,13,66,0.55)', borderWidth: 1, borderColor: 'rgba(255,224,104,0.22)', alignItems: 'center', justifyContent: 'center', gap: 8 },
  sceneIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,224,95,0.14)', borderWidth: 1, borderColor: 'rgba(255,224,95,0.36)' },

  // Listen speeds
  speedRow: { flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
  speed: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(42,13,66,0.5)', borderRadius: 12, paddingVertical: 9, alignItems: 'center' },
  speedSelected: { borderColor: '#FFE166', backgroundColor: 'rgba(255,216,74,0.16)' },
  speedText: { color: 'rgba(255,255,255,0.85)', fontWeight: '800', fontSize: 15 },
  speedTextSelected: { color: '#FFE166' },

  // Model answer box
  model: { backgroundColor: 'rgba(42,13,66,0.55)', borderWidth: 1, borderColor: 'rgba(255,224,104,0.22)', borderRadius: 15, padding: 12, gap: 6, alignSelf: 'stretch', alignItems: 'flex-start' },
  modelLabel: { color: 'rgba(255,226,99,0.85)', fontSize: 11, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' },
  modelText: { color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 22 },
  modelScore: { fontSize: 32, fontWeight: '900' },

  // Finish extras
  xpChip: { backgroundColor: 'rgba(255,224,95,0.14)', borderWidth: 1, borderColor: 'rgba(255,224,95,0.4)', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 8 },
  xpChipText: { color: GOLD_TEXT, fontSize: 20, fontWeight: '900' },
  levelUp: { color: MINT, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  reveal: { alignSelf: 'stretch', alignItems: 'center', gap: 12, paddingVertical: 14 },
});
