import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Check, ChevronRight, Headphones, Play, Volume2 } from 'lucide-react-native';
import { ActivityContent } from '@/types/api';
import { playWordTTS } from '@/lib/tts';
import { VoiceRecorder } from '@/components/ai/voice-recorder';
import { ChatInput } from '@/components/ai/chat-input';
import { useCheckPronunciation, useSendMessage, useStartConversation } from '@/hooks/use-ai';

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

function Card({ children }: { children: React.ReactNode }) {
  return <View className="rounded-3xl border border-white/15 bg-white/10 p-5">{children}</View>;
}

function Action({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} className={`items-center rounded-2xl px-4 py-3 ${disabled ? 'bg-white/10' : 'bg-[#ffb338]'}`}>
      <Text className={`font-black ${disabled ? 'text-white/40' : 'text-[#07162c]'}`}>{label}</Text>
    </Pressable>
  );
}

export function ActivityStep({ content, stepId }: ActivityStepProps) {
  const body = content.content ?? {};
  const [answer, setAnswer] = useState('');
  const [vocabIndex, setVocabIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [listeningIndex, setListeningIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [listeningChecked, setListeningChecked] = useState(false);
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
  const phrases = strings(body.required_phrases);
  const prompt = text(body, 'prompt') || text(body, 'story') || text(body, 'task') || text(body, 'script');
  const script = text(body, 'script');
  const currentWord = vocabulary[vocabIndex];
  const currentQuestion = questions[listeningIndex];
  const allAnswers = [...new Set(questions.map((item) => text(item, 'answer')).filter(Boolean))];
  const model = models[0] || phrases[0] || prompt;
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
    <Card>
      <Text className="text-xs font-bold uppercase tracking-wider text-[#ffdf5e]">Ваш ответ</Text>
      <Text className="mt-2 text-lg font-black text-white">{prompt}</Text>
      <TextInput
        value={answer}
        onChangeText={setAnswer}
        placeholder="Напишите слово или короткий ответ"
        placeholderTextColor="rgba(255,255,255,0.35)"
        className="mt-4 rounded-2xl border border-white/20 bg-[#07162c] px-4 py-3 text-base text-white"
      />
      <View className="mt-3"><Action label={answer.trim() ? 'Ответ готов' : 'Напишите ответ'} disabled={!answer.trim()} onPress={() => {}} /></View>
    </Card>
  );

  const renderVocabulary = () => {
    if (!currentWord) return null;
    const word = text(currentWord, 'word');
    const wordPrompt = text(currentWord, 'prompt');
    return (
      <Card>
        <Text className="text-xs font-bold uppercase tracking-wider text-[#ffdf5e]">{vocabIndex + 1} / {vocabulary.length}</Text>
        <Text className="mt-3 text-4xl font-black text-white">{word}</Text>
        <Text className="mt-2 text-base text-white/70">{wordPrompt}</Text>
        {revealed && <Text className="mt-5 text-base leading-6 text-white">Say it aloud, then tap next.</Text>}
        <View className="mt-5 flex-row gap-3">
          <Pressable onPress={() => void playWordTTS(word, 'en')} className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 py-3">
            <Volume2 size={18} color="#ffdf5e" /><Text className="font-bold text-white">Слушать</Text>
          </Pressable>
          <Pressable onPress={() => setRevealed(true)} className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-[#1b3056] py-3">
            <Play size={16} color="#fff" /><Text className="font-bold text-white">Повторить</Text>
          </Pressable>
        </View>
        <View className="mt-3"><Action label={vocabIndex === vocabulary.length - 1 ? 'Слова пройдены' : 'Следующее слово'} onPress={() => { setVocabIndex((index) => Math.min(index + 1, vocabulary.length - 1)); setRevealed(false); }} /></View>
      </Card>
    );
  };

  const renderListening = () => {
    if (!currentQuestion) return null;
    const correct = text(currentQuestion, 'answer');
    return (
      <View className="gap-4">
        <Card>
          <Text className="text-xs font-bold uppercase tracking-wider text-[#ffdf5e]">Сначала прослушайте</Text>
          <Text className="mt-2 text-base leading-6 text-white">{script}</Text>
          <Pressable onPress={() => void playWordTTS(script, 'en')} className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-[#1b3056] py-3">
            <Headphones size={18} color="#fff" /><Text className="font-bold text-white">Включить аудио</Text>
          </Pressable>
        </Card>
        <Card>
          <Text className="text-lg font-black text-white">{text(currentQuestion, 'question')}</Text>
          <View className="mt-4 gap-2">
            {allAnswers.map((option) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = listeningChecked && option === correct;
              const isWrong = listeningChecked && isSelected && option !== correct;
              return <Pressable key={option} disabled={listeningChecked} onPress={() => setSelectedAnswer(option)} className={`rounded-2xl border p-4 ${isCorrect ? 'border-[#58cc02] bg-[#58cc02]/15' : isWrong ? 'border-red-400 bg-red-400/15' : isSelected ? 'border-[#ffdf5e] bg-[#ffdf5e]/10' : 'border-white/15 bg-white/5'}`}><Text className="text-base font-semibold text-white">{option}</Text></Pressable>;
            })}
          </View>
          {!listeningChecked ? <View className="mt-4"><Action label="Проверить ответ" disabled={!selectedAnswer} onPress={() => setListeningChecked(true)} /></View> : <View className="mt-4"><Action label={listeningIndex === questions.length - 1 ? 'Аудирование пройдено' : 'Следующий вопрос'} onPress={() => { setListeningIndex((index) => Math.min(index + 1, questions.length - 1)); setSelectedAnswer(''); setListeningChecked(false); }} /></View>}
        </Card>
      </View>
    );
  };

  const renderVoicePractice = () => (
    <View className="gap-4">
      <Card>
        <Text className="text-xs font-bold uppercase tracking-wider text-[#ffdf5e]">Произнесите фразу</Text>
        <Text className="mt-2 text-2xl font-black leading-8 text-white">{model}</Text>
        <Pressable onPress={() => void playWordTTS(model, 'en')} className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-[#1b3056] py-3">
          <Volume2 size={18} color="#fff" /><Text className="font-bold text-white">Послушать пример</Text>
        </Pressable>
      </Card>
      <VoiceRecorder loading={pronunciation.isPending} onSubmit={(audio) => void checkPronunciation(audio)} />
      {pronunciation.data && <Card><Text className="text-xl font-black text-[#58cc02]">Точность: {Math.round(pronunciation.data.accuracy_score * 100)}%</Text><Text className="mt-2 text-base text-white/80">{pronunciation.data.feedback || pronunciation.data.transcribed_text}</Text></Card>}
    </View>
  );

  const renderDialogue = () => (
    <Card>
      <Text className="text-xs font-bold uppercase tracking-wider text-[#ffdf5e]">Диалог с подсказками</Text>
      <View className="mt-4 gap-3">
        {dialogue.slice(0, dialogueIndex + 1).map((line, index) => {
          const speaker = text(line, 'speaker');
          const lineText = text(line, 'text');
          return <Pressable key={`${speaker}-${index}`} onPress={() => void playWordTTS(lineText, 'en')} className={`rounded-2xl p-4 ${speaker === 'A' ? 'bg-[#1b3056]' : 'bg-white/10'}`}><Text className="text-xs font-bold text-[#ffdf5e]">{speaker}</Text><Text className="mt-1 text-base text-white">{lineText}</Text></Pressable>;
        })}
      </View>
      <View className="mt-4"><Action label={dialogueIndex === dialogue.length - 1 ? 'Диалог пройден' : 'Следующая реплика'} onPress={() => setDialogueIndex((index) => Math.min(index + 1, dialogue.length - 1))} /></View>
    </Card>
  );

  const renderRoleplay = () => (
    <View className="gap-4">
      <Card>
        <Text className="text-xs font-bold uppercase tracking-wider text-[#ffdf5e]">Разговор с AI</Text>
        <Text className="mt-2 text-lg font-black text-white">{text(body, 'scenario') || prompt}</Text>
        {phrases.length > 0 && <Text className="mt-3 text-sm leading-5 text-white/70">Попробуйте использовать: {phrases.join(' ')}</Text>}
        {!conversationId && <View className="mt-4"><Action label={startConversation.isPending ? 'Запускаем AI...' : 'Начать разговор'} disabled={startConversation.isPending} onPress={() => void beginRoleplay()} /></View>}
      </Card>
      {conversationId && <Card><View className="gap-3">{chatLines.map((line, index) => <View key={`${line.role}-${index}`} className={`self-${line.role === 'user' ? 'end' : 'start'} max-w-[90%] rounded-2xl p-3 ${line.role === 'user' ? 'bg-[#ffb338]' : 'bg-[#1b3056]'}`}><Text className={line.role === 'user' ? 'text-[#07162c]' : 'text-white'}>{line.content}</Text></View>)}</View><View className="mt-4"><ChatInput loading={sendMessage.isPending} language="en" placeholder="Reply in English..." onSend={(message) => sendRoleplayMessage(message)} /></View></Card>}
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
    <ScrollView className="flex-1 px-5 py-4" contentContainerClassName="gap-4 pb-8">
      <View className="rounded-3xl border border-white/15 bg-white/10 p-5">
        <Text className="text-xs font-bold uppercase tracking-wider text-[#ffdf5e]">{content.activity_type.replaceAll('_', ' ')}</Text>
        <Text className="mt-2 text-lg font-black text-white">{content.instructions}</Text>
        {content.estimated_seconds > 0 && <Text className="mt-3 text-sm text-white/60">About {content.estimated_seconds} seconds</Text>}
      </View>
      {interaction}
      {content.success_criteria.length > 0 && <Card><Text className="text-base font-black text-white">Ваша цель</Text>{content.success_criteria.map((criterion) => <View key={criterion} className="mt-3 flex-row gap-2"><Check size={16} color="#58cc02" /><Text className="flex-1 text-sm leading-5 text-white/75">{criterion}</Text></View>)}</Card>}
      <View className="flex-row items-center gap-2"><ChevronRight size={18} color="#ffdf5e" /><Text className="flex-1 text-sm text-white/60">Когда закончите, нажмите «Продолжить» внизу, чтобы сохранить прогресс.</Text></View>
    </ScrollView>
  );
}
