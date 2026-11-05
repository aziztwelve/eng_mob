import React, { useCallback, useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, BriefcaseBusiness, CalendarDays, CheckCircle, ChevronRight, ClipboardList, Coffee, Compass, Earth, FileText, Flag, Hand, Heart, HelpCircle, History, Home, Laptop, Lightbulb, MapPin, MessageCircle, Plane, Scale, Search, ShoppingBag, Sparkles, Star, Target, UserRound, Users, Utensils, X } from 'lucide-react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { FREE_TALK_AVATARS } from '@/components/ai/avatar-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFreeTalkAvatar } from '@/hooks/use-free-talk-avatar';
import { useStartConversation } from '@/hooks/use-ai';
import { useStartFreeTalk } from '@/hooks/use-start-free-talk';
import { AI_LEVELS, AI_TOPICS, type AILevel, type AITopic } from '@/lib/ai-topics';
import { AIApi } from '@/lib/ai-api';
import { getAILessonCard } from '@/lib/ai-lesson-cards';
import { useFocusEffect } from '@react-navigation/native';
import { useCurrentUser } from '@/hooks/use-auth';
import { lessonKey, levelProgress, loadLessonProgress } from '@/lib/ai-lesson-progress';

const COLORS = [
  { light: '#FFF0ED', strong: '#E9584D' },
  { light: '#E6F8FF', strong: '#16A8D9' },
  { light: '#EAF9E6', strong: '#42B842' },
  { light: '#F4EBFF', strong: '#A066E1' },
  { light: '#FFF4E0', strong: '#ED9B20' },
];
// Each five-lesson group has icons chosen for its subjects and activities.
const TOPIC_ICONS: Record<string, readonly typeof Hand[]> = {
  greetings: [Hand, UserRound, Heart, Hand, Users],
  'about-me': [UserRound, MapPin, CalendarDays, MessageCircle, Users],
  family: [Users, UserRound, Heart, CalendarDays, Home],
  food: [Utensils, Coffee, Coffee, Utensils, Heart],
  routine: [Home, CalendarDays, CalendarDays, Star, CalendarDays],
  weekend: [Star, CalendarDays, Users, CheckCircle, Coffee],
  travel: [Compass, MapPin, FileText, Search, Plane],
  shopping: [ShoppingBag, FileText, Search, CheckCircle, ShoppingBag],
  past: [CalendarDays, Star, Plane, Heart, HelpCircle],
  health: [Heart, Target, Heart, CalendarDays, MessageCircle],
  work: [BriefcaseBusiness, ClipboardList, MessageCircle, Laptop, Users],
  experiences: [Star, Flag, Compass, MessageCircle, HelpCircle],
  opinions: [MessageCircle, CheckCircle, Scale, Lightbulb, Users],
  problems: [HelpCircle, MessageCircle, Lightbulb, Scale, CheckCircle],
  future: [CalendarDays, Sparkles, Target, CalendarDays, Compass],
  career: [Target, Star, BriefcaseBusiness, MessageCircle, Compass],
  society: [Users, Scale, Lightbulb, Target, MessageCircle],
  technology: [CalendarDays, Scale, FileText, Sparkles, Lightbulb],
  media: [FileText, Star, Earth, MessageCircle, Heart],
  negotiation: [Target, Lightbulb, MessageCircle, Scale, Users],
  leadership: [Users, MessageCircle, Scale, Star, Target],
  ethics: [Scale, Compass, Heart, MessageCircle, Users],
  innovation: [Lightbulb, HelpCircle, Scale, Target, MessageCircle],
  culture: [Earth, CalendarDays, Users, Search, MessageCircle],
  environment: [Earth, Scale, CalendarDays, Search, Target],
  argument: [MessageCircle, Search, Scale, FileText, Users],
  language: [MessageCircle, Search, Sparkles, HelpCircle, Users],
  policy: [Scale, Users, Compass, FileText, MessageCircle],
  research: [Lightbulb, Search, HelpCircle, FileText, MessageCircle],
  persuasion: [Users, FileText, MessageCircle, Scale, Target],
};

export default function AIHubScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const avatar = useFreeTalkAvatar();
  const start = useStartConversation();
  const freeTalk = useStartFreeTalk();
  const user = useCurrentUser();
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [progressError, setProgressError] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    setProgress({});
    setProgressError(false);
    if (user.data?.id) loadLessonProgress(user.data.id).then(value => { if (active) setProgress(value); }).catch(() => { if (active) setProgressError(true); });
    return () => { active = false; };
  }, [user.data?.id]));
  const [level, setLevel] = useState<AILevel>('A1');
  const [selected, setSelected] = useState<{ topic: AITopic; index: number } | null>(null);
  const [startingLesson, setStartingLesson] = useState<number | null>(null);
  const [resumeChoice, setResumeChoice] = useState<{ id: string; index: number } | null>(null);
  const params = useLocalSearchParams<{ level?: string; topic?: string; selection?: string }>();
  useEffect(() => {
    if (!params.level || !AI_LEVELS.includes(params.level as AILevel)) return;
    const targetLevel = params.level as AILevel;
    const target = AI_TOPICS[targetLevel].find(item => item.id === params.topic);
    if (target) { setLevel(targetLevel); setResumeChoice(null); setSelected({ topic: target, index: 0 }); }
  }, [params.level, params.topic, params.selection]);
  const topics = AI_TOPICS[level];
  const stats = levelProgress(level, progress);
  const lang = i18n.resolvedLanguage?.slice(0, 2);
  const labels = lang === 'ru' ? { last: 'Последний', next: 'Следующий', done: 'Пройдено', error: 'Не удалось загрузить прогресс' } : lang === 'kk' ? { last: 'Соңғы', next: 'Келесі', done: 'Аяқталды', error: 'Прогресті жүктеу мүмкін болмады' } : { last: 'Last completed', next: 'Next', done: 'Completed', error: 'Could not load progress' };
  const selectedCard = selected ? getAILessonCard(level, selected.topic.id, selected.index) : null;

  const navigateLesson = (id: string, topic: AITopic, index: number) => {
    setResumeChoice(null);
    setSelected(null);
    router.push({ pathname: '/free-talk/[id]', params: { id, aiLevel: level, aiTopic: topic.id, aiLesson: String(index) } });
  };
  const createLesson = async (topic: AITopic, index: number) => {
    setStartingLesson(index);
    try {
      const title = `${level} · ${topic.title} · ${topic.lessons[index]}`;
      const response = await start.mutateAsync({ scenario: 'free_chat', target_language: 'en', user_level: level, title });
      navigateLesson(response.conversation.id, topic, index);
    } catch (error) {
      Toast.show({ type: 'error', text1: t('ai.start_failed'), text2: error instanceof Error ? error.message : undefined });
    } finally { setStartingLesson(null); }
  };
  const openLesson = async (index: number) => {
    if (!selected || startingLesson !== null) return;
    const topic = selected.topic;
    const title = `${level} · ${topic.title} · ${topic.lessons[index]}`;
    setStartingLesson(index);
    try {
      let offset = 0;
      let existing: string | undefined;
      do {
        const page = await AIApi.listConversations({ limit: 100, offset });
        existing = page.conversations.find(item => item.scenario === 'free_chat' && item.title === title)?.id;
        offset += page.conversations.length;
        if (existing || !page.conversations.length || offset >= page.total) break;
      } while (true);
      if (!existing) { await createLesson(topic, index); return; }
      setResumeChoice({ id: existing, index });
    } catch (error) {
      Toast.show({ type: 'error', text1: t('common.load_failed'), text2: error instanceof Error ? error.message : undefined });
    } finally { setStartingLesson(null); }
  };

  return <View className="flex-1"><LinearGradient pointerEvents="none" colors={['#D5EEFF', '#E5F5FF', '#E4F4FF']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} /><Stack.Screen options={{ headerShown: false }} /><StatusBar style="dark" />
    <ScrollView className="flex-1" contentContainerClassName="px-4 pt-3" contentContainerStyle={{ paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center gap-2"><Text className="font-nunito-extrabold text-xl text-[#173C5C]">LingoIQ</Text><View className="rounded-full bg-[#169DE8] px-2 py-1"><Text className="font-nunito-extrabold text-[11px] text-white">English AI</Text></View></View>
      <View className="mt-3 h-24 flex-row rounded-[20px] border-b-4 border-[#1588D7] bg-[#43ABEF]">
        <View className="flex-1 justify-center gap-1 pl-4">
          <Text className="font-nunito-extrabold text-sm text-white">{t(`tracks.level_titles.${level}` as never)} · {level}</Text>
          <Pressable onPress={() => void freeTalk.start()} disabled={freeTalk.isStarting} accessibilityRole="button" accessibilityState={{ disabled: freeTalk.isStarting, busy: freeTalk.isStarting }} className="min-h-9 flex-row items-center justify-center gap-2 self-start rounded-full border-2 border-white bg-[#078BEA] px-3">
            <MessageCircle size={15} color="#FFFFFF" /><Text className="font-nunito-extrabold text-sm text-white">{freeTalk.isStarting ? t('freeTalk.starting') : 'Free Talk'}</Text>
          </Pressable>
        </View>
        <Image source={FREE_TALK_AVATARS[avatar.avatarId - 1]} resizeMode="contain" className="absolute bottom-0 right-3 h-[112px] w-28" accessible={false} />
      </View>
      <Pressable onPress={() => router.push('/ai/chat')} accessibilityRole="button" className="mt-3 min-h-12 flex-row items-center gap-3 rounded-[20px] border border-[#CDEBFA] bg-white px-4">
        <History size={22} color="#173C5C" />
        <Text className="flex-1 font-nunito-extrabold text-base text-[#173C5C]">{t('ai.history_title')}</Text>
        <ChevronRight size={21} color="#173C5C" />
      </Pressable>
      <View className="mt-2 flex-row gap-1.5">
        {AI_LEVELS.map(item => <Pressable key={item} onPress={() => setLevel(item)} accessibilityRole="button" accessibilityState={{ selected: level === item }} className={`min-h-9 flex-1 items-center justify-center rounded-full border ${level === item ? 'border-[#2FA8E6] bg-[#2FA8E6]' : 'border-[#CDEBFA] bg-white'}`}><Text className={`font-nunito-extrabold text-sm ${level === item ? 'text-white' : 'text-[#41637A]'}`}>{item}</Text></Pressable>)}
      </View>
      <View className="mt-3 flex-row items-center justify-between"><Text className="font-nunito-extrabold text-lg text-[#173C5C]">{t('aiTopics.levels_title')} · {level}</Text></View>
      <View className="mt-2 gap-1 rounded-2xl border border-[#CDEBFA] bg-white px-4 py-3">
        {progressError ? <Text className="font-nunito-bold text-sm text-red-600">{labels.error}</Text> : <>
          <Text className="font-nunito-extrabold text-sm text-[#168CC5]">{labels.done}: {stats.count} / {stats.total}</Text>
          {stats.last && <Text className="font-nunito-semibold text-sm text-[#41637A]">{labels.last}: {stats.last.name}</Text>}
          {stats.next && <Text className="font-nunito-semibold text-sm text-[#41637A]">{labels.next}: {stats.next.name}</Text>}
        </>}
      </View>
      <View className="mt-2 gap-3">
        {topics.map((topic, topicIndex) => <View key={topic.id}>
          {topicIndex > 0 && <View className="mb-2 mt-2 flex-row items-center gap-3">
              <View className="h-px flex-1 bg-[#A9D9F0]" />
              <Text className="text-center font-nunito-extrabold text-sm text-[#668697]">{topic.title}</Text>
              <View className="h-px flex-1 bg-[#A9D9F0]" />
            </View>}
          <View className="relative gap-3 py-2">
            <Svg pointerEvents="none" viewBox="0 0 300 500" preserveAspectRatio="none" style={{ position: 'absolute', width: '100%', height: '100%' }}>
              <Path d="M120 40 C-15 40 -15 120 180 135 C315 145 315 225 120 235 C-15 245 -15 325 180 335 C315 345 315 425 120 450" fill="none" stroke="#AADFF7" strokeWidth="6" strokeLinecap="round" /><Circle cx="17" cy="84" r="3" fill="#FFFFFF" stroke="#4EADE0" strokeWidth="2" /><Circle cx="282" cy="184" r="3" fill="#FFFFFF" stroke="#4EADE0" strokeWidth="2" /><Circle cx="17" cy="284" r="3" fill="#FFFFFF" stroke="#4EADE0" strokeWidth="2" /><Circle cx="282" cy="384" r="3" fill="#FFFFFF" stroke="#4EADE0" strokeWidth="2" />
            </Svg>
            {topic.lessons.map((lesson, index) => {
              const item = COLORS[index % COLORS.length];
              const Icon = TOPIC_ICONS[topic.id]?.[index] ?? MessageCircle;
              const completed = !!progress[lessonKey(level, topic.id, index)];
              const offsets = ['10%', '23%', '8%', '25%', '4%'] as const;
              return <View key={lesson} style={{ marginLeft: offsets[index % offsets.length], width: '76%' }} className="h-[72px] justify-center">
                <Pressable onPress={() => { setResumeChoice(null); setSelected({ topic, index }); }} accessibilityRole="button" accessibilityLabel={lesson}
                  style={{ shadowColor: '#79B5D4', shadowOpacity: 0.22, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } }}
                  className="h-[60px] flex-row items-center rounded-full border border-[#E3F4FC] bg-white pl-16 pr-3">
                  <View style={{ backgroundColor: item.light }} className="absolute -left-3 h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-white"><Icon size={27} color={item.strong} strokeWidth={2.2} /></View>
                  <View className="flex-1"><Text numberOfLines={2} className="font-nunito-extrabold text-base leading-5 text-[#173C5C]">{lesson}</Text><Text className="mt-0.5 font-nunito-bold text-xs text-[#668697]">{completed ? `✓ ${labels.done}` : `${t('aiTopics.lecture')} · ${t('aiTopics.practice')}`}</Text></View>
                </Pressable>
              </View>;
            })}
          </View>
        </View>)}
      </View>
      {AI_LEVELS.indexOf(level) < AI_LEVELS.length - 1 && <Pressable onPress={() => setLevel(AI_LEVELS[AI_LEVELS.indexOf(level) + 1])} accessibilityRole="button" className="mt-5 min-h-12 flex-row items-center justify-center gap-2 self-center rounded-full bg-[#D6F1FF] px-8"><Text className="font-nunito-extrabold text-[#117DB9]">{t('common.next')} · {AI_LEVELS[AI_LEVELS.indexOf(level) + 1]}</Text><ArrowRight size={18} color="#117DB9" /></Pressable>}
    </ScrollView>
    <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => { if (resumeChoice) setResumeChoice(null); else setSelected(null); }}>
      <View className="flex-1 justify-end bg-black/40"><View className="max-h-[80%] rounded-t-[32px] bg-white px-5 pt-5" style={{ paddingBottom: insets.bottom + 20 }}>
        {resumeChoice && selected ? <View className="gap-4 pb-2">
          <View className="flex-row items-center justify-between gap-2"><Text className="flex-1 font-nunito-extrabold text-2xl text-[#173C5C]">{t('aiTopics.resume_title')}</Text><Pressable onPress={() => setResumeChoice(null)} accessibilityRole="button" accessibilityLabel={t('common.close')} className="h-11 w-11 items-center justify-center rounded-full bg-[#EEF8FD]"><X size={22} color="#173C5C" /></Pressable></View>
          <Text className="font-nunito-semibold text-base leading-6 text-[#526879]">{t('aiTopics.resume_hint')}</Text>
          <Pressable onPress={() => navigateLesson(resumeChoice.id, selected.topic, resumeChoice.index)} accessibilityRole="button" className="min-h-12 items-center justify-center rounded-2xl bg-[#2FA8E6] px-4"><Text className="font-nunito-extrabold text-base text-white">{t('aiTopics.resume')}</Text></Pressable>
          <Pressable onPress={() => void createLesson(selected.topic, resumeChoice.index)} disabled={startingLesson !== null} accessibilityRole="button" className="min-h-12 items-center justify-center rounded-2xl border border-[#CDEBFA] bg-[#F5FBFF] px-4"><Text className="font-nunito-extrabold text-base text-[#168CC5]">{startingLesson !== null ? '…' : t('aiTopics.start_again')}</Text></Pressable>
        </View> : <>
        <View className="flex-row items-center justify-between gap-2"><View className="flex-1"><Text className="font-nunito-bold text-sm text-[#168CC5]">{level} · {selected?.topic.title}</Text><Text className="font-nunito-extrabold text-2xl text-[#173C5C]">{selected && selected.topic.lessons[selected.index]}</Text></View><Pressable onPress={() => setSelected(null)} accessibilityRole="button" accessibilityLabel={t('common.close')} className="h-11 w-11 items-center justify-center rounded-full bg-[#EEF8FD]"><X size={22} color="#173C5C" /></Pressable></View>
        <Text className="mb-3 mt-2 font-nunito-semibold text-sm text-[#526879]">{t('aiTopics.lecture')} · {t('aiTopics.practice')} · {t('aiTopics.five_minutes')}</Text>
        <ScrollView className="mb-4" showsVerticalScrollIndicator={false}>
          {selectedCard ? <View className="gap-3">
            <View className="rounded-2xl bg-[#F1F9FD] p-4"><Text className="font-nunito-extrabold text-sm text-[#168CC5]">{t('aiTopics.objective')}</Text><Text className="mt-1 font-nunito-semibold text-sm text-[#173C5C]">{selectedCard.objective}</Text></View>
            <View className="rounded-2xl bg-[#F1F9FD] p-4"><Text className="font-nunito-extrabold text-sm text-[#168CC5]">{t('aiTopics.vocabulary')}</Text><Text className="mt-1 font-nunito-semibold text-sm text-[#173C5C]">{selectedCard.vocabulary.join(' · ')}</Text></View>
            <View className="rounded-2xl bg-[#F1F9FD] p-4"><Text className="font-nunito-extrabold text-sm text-[#168CC5]">{t('aiTopics.grammar')}</Text><Text className="mt-1 font-nunito-semibold text-sm text-[#173C5C]">{selectedCard.grammar}</Text></View>
          </View> : <Text className="font-nunito-semibold text-sm leading-5 text-[#526879]">{t('aiTopics.generated_hint')}</Text>}
        </ScrollView>
        <Pressable onPress={() => selected && void openLesson(selected.index)} disabled={startingLesson !== null} accessibilityRole="button" className="min-h-12 items-center justify-center rounded-2xl bg-[#2FA8E6] px-4"><Text className="font-nunito-extrabold text-base text-white">{startingLesson !== null ? '…' : t('aiTopics.start_lesson')}</Text></Pressable>
        </>}
      </View></View>
    </Modal>
  </View>;
}
