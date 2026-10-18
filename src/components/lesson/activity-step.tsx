import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Check, ChevronRight, Headphones, Play, Volume2 } from 'lucide-react-native';
import { ActivityContent } from '@/types/api';
import { playWordTTS } from '@/lib/tts';
import { VoiceRecorder } from '@/components/ai/voice-recorder';
import { ChatInput } from '@/components/ai/chat-input';
import { useCheckPronunciation, useSendMessage, useStartConversation } from '@/hooks/use-ai';
import { useTranslation } from 'react-i18next';
import { SKY } from './sky-lesson-header';
import { SkyCard, SkyInput, SkyLabel, skyFont } from './sky-ui';

interface ActivityStepProps {
  content: ActivityContent;
  stepId: string;
}

type ChatLine = { role: 'assistant' | 'user'; content: string };

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    : [];
}

function text(record: Record<string, unknown>, key: string): string {
  return typeof record[key] === 'string' ? record[key] : '';
}

const ink = { fontFamily: skyFont.strong, color: SKY.ink } as const;

function Action({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={{
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        backgroundColor: disabled ? '#E3E8EC' : SKY.blue,
        borderBottomWidth: 4,
        borderBottomColor: disabled ? '#CDD4D9' : SKY.blueDark,
      }}
    >
      <Text style={{ fontFamily: skyFont.strong, fontSize: 15, color: disabled ? '#8A949B' : '#FFFFFF' }}>{label}</Text>
    </Pressable>
  );
}

/** White secondary button with an icon (listen / repeat / play). */
function Ghost({ label, icon, onPress, filled = false }: { label: string; icon: React.ReactNode; onPress: () => void; filled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 48,
        borderRadius: 16,
        backgroundColor: filled ? SKY.blue : '#FFFFFF',
        borderWidth: 1.5,
        borderBottomWidth: 4,
        borderColor: filled ? SKY.blue : '#DDE3E8',
        borderBottomColor: filled ? SKY.blueDark : '#D3DAE0',
      }}
    >
      {icon}
      <Text style={{ fontFamily: skyFont.strong, fontSize: 14, color: filled ? '#FFFFFF' : SKY.ink }}>{label}</Text>
    </Pressable>
  );
}

export function ActivityStep({ content, stepId }: ActivityStepProps) {
  const { t } = useTranslation();
  const body = content.content ?? {};
  const [answer, setAnswer] = useState('');
  const [vocabIndex, setVocabIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [listeningIndex, setListeningIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [listeningChecked, setListeningChecked] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [conversationId, setConversationId] = useState<string>();
  const [chatLines, setChatLines] = useState<ChatLine[]>([]);
  const pronunciation = useCheckPronunciation();
  const startConversation = useStartConversation();
  const sendMessage = useSendMessage(conversationId ?? '');

  const vocabulary = records(body.items);
  const questions = records(body.questions);
  const models = strings(body.models).concat(strings(body.frames));
  const dialogue = records(body.dialogue);
  const phrases = [...new Set(strings(body.required_phrases).concat(strings(body.target_phrases)))];
  const prompt = text(body, 'prompt') || text(body, 'story') || text(body, 'task') || text(body, 'script');
  const script = text(body, 'script');
  const currentWord = vocabulary[vocabIndex];
  const currentQuestion = questions[listeningIndex];
  const allAnswers = [...new Set(questions.map((item) => text(item, 'answer')).filter(Boolean))];
  const model = models[phraseIndex] || phrases[phraseIndex] || prompt;
  const isPronunciation = content.activity_type === 'repeat_after_me' || content.activity_type === 'pronunciation_drill';
  const isMission = content.activity_type === 'real_world_mission';

  const checkPronunciation = async (audio: Parameters<typeof pronunciation.mutateAsync>[0]['audio']) => {
    if (!model) return;
    await pronunciation.mutateAsync({ audio, target_text: model, language: 'en', step_id: stepId });
  };

  const beginRoleplay = async () => {
    const scenario = text(body, 'scenario') || content.instructions;
    const response = await startConversation.mutateAsync({
      scenario: 'free_chat',
      target_language: 'en',
      user_level: 'A1',
      title: scenario,
    });
    setConversationId(response.conversation.id);
    if (response.initial_message) {
      setChatLines([{ role: 'assistant', content: response.initial_message.content }]);
    }
  };

  const sendRoleplayMessage = async (message: string) => {
    if (!conversationId) return;
    const response = await sendMessage.mutateAsync({ content: message, want_audio: false });
    setChatLines((lines) => [
      ...lines,
      { role: 'user', content: response.user_message.content },
      { role: 'assistant', content: response.assistant_message.content },
    ]);
  };

  const renderWarmUp = () => (
    <SkyCard style={{ marginBottom: 0 }}>
      <SkyLabel>{t('lesson_act.answer')}</SkyLabel>
      <Text style={[ink, { fontSize: 18, lineHeight: 25 }]}>{prompt}</Text>
      <View style={{ marginTop: 14 }}>
        <SkyInput value={answer} onChangeText={setAnswer} placeholder={t('lesson.answer_ph')} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Action label={answer.trim() ? t('lesson_act.answer_ready') : t('lesson_act.write_answer')} disabled={!answer.trim()} onPress={() => {}} />
      </View>
    </SkyCard>
  );

  const renderVocabulary = () => {
    if (!currentWord) return null;
    const word = text(currentWord, 'word');
    const wordPrompt = text(currentWord, 'prompt');
    return (
      <SkyCard style={{ marginBottom: 0 }}>
        <SkyLabel>{vocabIndex + 1} / {vocabulary.length}</SkyLabel>
        <Text style={{ fontFamily: skyFont.title, fontSize: 36, color: SKY.ink, marginTop: 6 }}>{word}</Text>
        <Text style={{ fontFamily: skyFont.medium, fontSize: 15, color: SKY.muted, marginTop: 6 }}>{wordPrompt}</Text>
        {revealed && <Text style={{ fontFamily: skyFont.medium, fontSize: 15, lineHeight: 22, color: SKY.ink, marginTop: 14 }}>{t('lesson.say_aloud')}</Text>}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <Ghost label={t('lesson_act.listen')} icon={<Volume2 size={18} color={SKY.blueDark} />} onPress={() => void playWordTTS(word, 'en')} />
          <Ghost filled label={t('lesson_act.repeat')} icon={<Play size={16} color="#FFFFFF" />} onPress={() => setRevealed(true)} />
        </View>
        <View style={{ marginTop: 12 }}>
          <Action label={vocabIndex === vocabulary.length - 1 ? t('lesson_act.words_done') : t('lesson_act.next_word')} onPress={() => { setVocabIndex((index) => Math.min(index + 1, vocabulary.length - 1)); setRevealed(false); }} />
        </View>
      </SkyCard>
    );
  };

  const renderListening = () => {
    if (!currentQuestion) return null;
    const correct = text(currentQuestion, 'answer');
    return (
      <View>
        <SkyCard>
          <SkyLabel>{t('lesson_act.listen_first')}</SkyLabel>
          <Text style={{ fontFamily: skyFont.medium, fontSize: 15, lineHeight: 22, color: SKY.ink }}>{t('lesson_act.listen_first_desc')}</Text>
          <View style={{ flexDirection: 'row', marginTop: 14 }}>
            <Ghost filled label={t('lesson_act.play_audio')} icon={<Headphones size={18} color="#FFFFFF" />} onPress={() => void playWordTTS(script, 'en')} />
          </View>
          {listeningChecked && (
            <Pressable onPress={() => setShowTranscript((value) => !value)} style={{ marginTop: 12 }}>
              <Text style={{ textAlign: 'center', fontFamily: skyFont.strong, color: SKY.blueDark }}>{showTranscript ? t('lesson_act.hide_text') : t('lesson_act.show_text')}</Text>
            </Pressable>
          )}
          {showTranscript && <Text style={{ fontFamily: skyFont.medium, fontSize: 15, lineHeight: 22, color: SKY.muted, marginTop: 12 }}>{script}</Text>}
        </SkyCard>
        <SkyCard style={{ marginBottom: 0 }}>
          <Text style={[ink, { fontSize: 18, lineHeight: 25 }]}>{text(currentQuestion, 'question')}</Text>
          <View style={{ marginTop: 14, gap: 10 }}>
            {allAnswers.map((option) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = listeningChecked && option === correct;
              const isWrong = listeningChecked && isSelected && option !== correct;
              const bg = isCorrect ? '#E9FBEF' : isWrong ? '#FFECEC' : isSelected ? '#EAF8FF' : '#FFFFFF';
              const bd = isCorrect ? SKY.green : isWrong ? SKY.red : isSelected ? SKY.blue : '#DDE3E8';
              return (
                <Pressable
                  key={option}
                  disabled={listeningChecked}
                  onPress={() => setSelectedAnswer(option)}
                  style={{ padding: 14, borderRadius: 16, backgroundColor: bg, borderWidth: 1.5, borderBottomWidth: 4, borderColor: bd }}
                >
                  <Text style={[ink, { fontSize: 16 }]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ marginTop: 14 }}>
            {!listeningChecked ? (
              <Action label={t('lesson_act.check')} disabled={!selectedAnswer} onPress={() => setListeningChecked(true)} />
            ) : (
              <Action label={listeningIndex === questions.length - 1 ? t('lesson_act.listening_done') : t('lesson_act.next_q')} onPress={() => { setListeningIndex((index) => Math.min(index + 1, questions.length - 1)); setSelectedAnswer(''); setListeningChecked(false); }} />
            )}
          </View>
        </SkyCard>
      </View>
    );
  };

  const renderVoicePractice = () => (
    <View>
      <SkyCard>
        <SkyLabel>{t('lesson_act.say_phrase')}</SkyLabel>
        <Text style={{ fontFamily: skyFont.title, fontSize: 24, lineHeight: 32, color: SKY.ink }}>{model}</Text>
        <View style={{ flexDirection: 'row', marginTop: 14 }}>
          <Ghost filled label={t('lesson_act.hear_sample')} icon={<Volume2 size={18} color="#FFFFFF" />} onPress={() => void playWordTTS(model, 'en')} />
        </View>
      </SkyCard>
      <VoiceRecorder light key={model} loading={pronunciation.isPending} minDurationSec={isMission ? Number(body.minimum_seconds ?? 0) : 0} onSubmit={(audio) => void checkPronunciation(audio)} />
      {pronunciation.isError && (
        <View style={{ marginTop: 16, padding: 14, borderRadius: 18, backgroundColor: '#FFECEC', borderWidth: 1.5, borderColor: '#FFC9CC' }}>
          <Text style={{ fontFamily: skyFont.bold, fontSize: 14, lineHeight: 20, color: '#B4232A' }}>{t('lesson.check_failed')}</Text>
        </View>
      )}
      {pronunciation.data && (
        <SkyCard style={{ marginTop: 16, marginBottom: 0 }}>
          <Text style={{ fontFamily: skyFont.title, fontSize: 20, color: SKY.green }}>{t('lesson.accuracy', { v: Math.round(pronunciation.data.accuracy_score * 100) })}</Text>
          <Text style={{ fontFamily: skyFont.medium, fontSize: 15, color: SKY.muted, marginTop: 6 }}>{pronunciation.data.feedback || pronunciation.data.transcribed_text}</Text>
        </SkyCard>
      )}
      {content.activity_type === 'repeat_after_me' && models.length > 1 && (
        <View style={{ marginTop: 16 }}>
          <Action label={phraseIndex === models.length - 1 ? t('lesson_act.phrases_done') : t('lesson_act.next_phrase')} onPress={() => { setPhraseIndex((index) => Math.min(index + 1, models.length - 1)); pronunciation.reset(); }} />
        </View>
      )}
    </View>
  );

  const renderDialogue = () => (
    <SkyCard style={{ marginBottom: 0 }}>
      <SkyLabel>{t('lesson_act.guided_dialogue')}</SkyLabel>
      <View style={{ marginTop: 8, gap: 10 }}>
        {dialogue.slice(0, dialogueIndex + 1).map((line, index) => {
          const speaker = text(line, 'speaker');
          const lineText = text(line, 'text');
          const mine = speaker === 'A';
          return (
            <Pressable
              key={`${speaker}-${index}`}
              onPress={() => void playWordTTS(lineText, 'en')}
              style={{ padding: 14, borderRadius: 16, backgroundColor: mine ? '#EAF8FF' : '#FFFFFF', borderWidth: 1.5, borderBottomWidth: 4, borderColor: mine ? SKY.blue : '#DDE3E8' }}
            >
              <Text style={{ fontFamily: skyFont.strong, fontSize: 12, color: SKY.blueDark }}>{speaker}</Text>
              <Text style={[ink, { fontSize: 16, marginTop: 2 }]}>{lineText}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ marginTop: 14 }}>
        <Action label={dialogueIndex === dialogue.length - 1 ? t('lesson_act.dialogue_done') : t('lesson_act.next_line')} onPress={() => setDialogueIndex((index) => Math.min(index + 1, dialogue.length - 1))} />
      </View>
    </SkyCard>
  );

  const renderRoleplay = () => (
    <View>
      <SkyCard>
        <SkyLabel>{t('lesson_act.ai_talk')}</SkyLabel>
        <Text style={[ink, { fontSize: 18, lineHeight: 25 }]}>{text(body, 'scenario') || prompt}</Text>
        {phrases.length > 0 && (
          <Text style={{ fontFamily: skyFont.medium, fontSize: 14, lineHeight: 20, color: SKY.muted, marginTop: 10 }}>
            {t('lesson_act.try_use')}{' '}{phrases.join(' ')}
          </Text>
        )}
        {!conversationId && (
          <View style={{ marginTop: 14 }}>
            <Action label={startConversation.isPending ? t('lesson_act.starting_ai') : t('lesson_act.start_talk')} disabled={startConversation.isPending} onPress={() => void beginRoleplay()} />
          </View>
        )}
      </SkyCard>
      {conversationId && (
        <SkyCard style={{ marginBottom: 0 }}>
          <View style={{ gap: 10 }}>
            {chatLines.map((line, index) => {
              const user = line.role === 'user';
              return (
                <View
                  key={`${line.role}-${index}`}
                  style={{
                    alignSelf: user ? 'flex-end' : 'flex-start',
                    maxWidth: '90%',
                    padding: 12,
                    borderRadius: 16,
                    backgroundColor: user ? SKY.blue : '#EAF8FF',
                  }}
                >
                  <Text style={{ fontFamily: skyFont.bold, fontSize: 15, color: user ? '#FFFFFF' : SKY.ink }}>{line.content}</Text>
                </View>
              );
            })}
          </View>
          <View style={{ marginTop: 14 }}>
            <ChatInput light loading={sendMessage.isPending} language="en" placeholder={t('lesson.reply_ph')} onSend={(message) => sendRoleplayMessage(message)} />
          </View>
        </SkyCard>
      )}
    </View>
  );

  let interaction: React.ReactNode = null;
  if (content.activity_type === 'warm_up' || content.activity_type === 'controlled_speaking' || content.activity_type === 'context_story') interaction = renderWarmUp();
  if (content.activity_type === 'vocabulary_input') interaction = renderVocabulary();
  if (content.activity_type === 'listening') interaction = renderListening();
  if (isPronunciation || isMission) interaction = renderVoicePractice();
  if (content.activity_type === 'guided_dialogue') interaction = renderDialogue();
  if (content.activity_type === 'ai_roleplay') interaction = renderRoleplay();

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <SkyCard>
        <SkyLabel>{content.activity_type.replaceAll('_', ' ')}</SkyLabel>
        <Text style={[ink, { fontSize: 18, lineHeight: 25 }]}>{content.instructions}</Text>
        {content.estimated_seconds > 0 && (
          <Text style={{ fontFamily: skyFont.medium, fontSize: 13, color: SKY.muted, marginTop: 10 }}>
            {t('lesson.about_seconds', { n: content.estimated_seconds })}
          </Text>
        )}
      </SkyCard>
      {interaction}
      {content.success_criteria.length > 0 && (
        <SkyCard style={{ marginTop: 16, marginBottom: 0 }}>
          <Text style={[ink, { fontFamily: skyFont.title, fontSize: 16 }]}>{t('lesson_act.your_goal')}</Text>
          {content.success_criteria.map((criterion) => (
            <View key={criterion} style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <Check size={16} color={SKY.green} />
              <Text style={{ flex: 1, fontFamily: skyFont.medium, fontSize: 14, lineHeight: 20, color: SKY.muted }}>{criterion}</Text>
            </View>
          ))}
        </SkyCard>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}>
        <ChevronRight size={18} color={SKY.blueDark} />
        <Text style={{ flex: 1, fontFamily: skyFont.medium, fontSize: 14, color: SKY.muted }}>{t('lesson_act.finish_hint')}</Text>
      </View>
    </ScrollView>
  );
}
