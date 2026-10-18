import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { useSetActiveTrack, useTrack, useTrackProgress } from '@/hooks/use-tracks';
import { useCompletedLessons } from '@/lib/lesson-progress';
import { LessonTileMap, type TileLesson } from '@/components/tracks/lesson-tile-map';
import { BankButton } from '@/components/vocabulary/player/WordBankChrome';

export default function TrackDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const query = useTrack(id, true);
  const setActiveTrack = useSetActiveTrack();
  const local = useCompletedLessons();
  const progress = useTrackProgress(id);
  const track = query.data;
  useEffect(() => {
    if (id && query.data) setActiveTrack.mutate(id);
  }, [id, query.data, setActiveTrack]);
  const lessons = [...(track?.lessons ?? [])].sort((a, b) => a.order_index - b.order_index);
  const completed = new Set([...(local.data ?? []), ...(progress.data ?? [])]);
  const isDone = (index: number) => completed.has(lessons[index].id);
  // Keep the existing progression: completed lessons replay; the previous lesson unlocks the next.
  const unlocked = (index: number) => index === 0 || isDone(index) || isDone(index - 1);
  const current = lessons.findIndex((_, index) => unlocked(index) && !isDone(index));
  const doneCount = lessons.filter(lesson => completed.has(lesson.id)).length;
  const allDone = lessons.length > 0 && doneCount === lessons.length;
  const loading = query.isPending || local.isPending || progress.isPending;
  const error = query.error || progress.error;
  const tiles: TileLesson[] = lessons.map((lesson, index) => ({ id: lesson.id, title: lesson.title, state: isDone(index) ? 'done' : index === current ? 'current' : 'locked' }));
  const openLesson = (index: number) => {
    if (index < 0 || index >= lessons.length) return;
    if (!unlocked(index)) { Toast.show({ type: 'info', text1: t('lesson.locked') }); return; }
    router.push(`/learn/${lessons[index].id}`);
  };
  return <View className="flex-1 bg-[#B6E8FF]">
    <Stack.Screen options={{ headerShown: false }} />
    <Image source={require('../../../../assets/figma/lesson-tiles/scenery.webp')} resizeMode="cover" className="absolute h-full w-full" accessible={false} />
    <ScrollView contentContainerClassName="grow px-4" contentContainerStyle={{ paddingBottom: 92 + insets.bottom }} showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center gap-3 pb-2 pt-1">
        <Pressable accessibilityRole="button" accessibilityLabel={t('practice.bank_back')} onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-2xl border-b-4 border-[#D4E6F1] bg-white"><ArrowLeft size={22} color="#526879" /></Pressable>
        {track?.level ? <Text className="rounded-xl border border-[#D4EEFF] bg-white px-3 py-1 font-nunito-extrabold text-sm text-[#247FA8]">{track.level.toUpperCase()}</Text> : null}
      </View>
      {loading ? <View className="flex-1 items-center justify-center py-20"><ActivityIndicator color="#1AB3FF" /></View> : error || !track ? <View className="flex-1 justify-center gap-4 py-16"><Text className="text-center font-nunito-bold text-lg text-[#152F60]">{t('tracks.load_error')}</Text><BankButton secondary label={t('home.path_retry')} onPress={() => { void query.refetch(); void progress.refetch(); }} /></View> : <>
        <Text accessibilityRole="header" className="text-center font-nunito-extrabold text-[24px] leading-[26px] text-[#152F60]">{track.title}</Text>
        {!!track.description && <Text numberOfLines={2} className="mt-1 text-center font-nunito-semibold text-[13px] leading-[17px] text-[#526879]">{track.description}</Text>}
        <View className="mb-1 mt-2 gap-1">
          <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: lessons.length, now: doneCount }} className="flex-row items-center self-center">
            {lessons.map((lesson, index) => <React.Fragment key={lesson.id}>{index > 0 ? <View className={`h-0.5 w-8 ${isDone(index - 1) ? 'bg-[#60C6EC]' : 'bg-[#C5DFEC]'}`} /> : null}<View className={`h-3 w-3 rounded-full ${isDone(index) ? 'bg-[#34C759]' : index === current ? 'bg-[#1AB3FF]' : 'bg-[#C5DFEC]'}`} /></React.Fragment>)}
          </View>
        </View>
        {lessons.length ? <LessonTileMap lessons={tiles} onOpen={openLesson} /> : <Text className="py-12 text-center font-nunito-bold text-base text-[#526879]">{t('tracks.lessons_soon')}</Text>}
        <View className="mt-auto gap-2 pb-3 pt-2">
          {allDone ? <View className="flex-row items-center justify-center gap-2"><Trophy size={22} color="#239A42" /><Text className="font-nunito-bold text-sm text-[#239A42]">{t('tracks.track_done')}</Text></View> : null}
          {current >= 0 ? <View className="rounded-[18px] bg-white p-1"><BankButton label={t('cloud_tracks.continue')} onPress={() => openLesson(current)} /></View> : allDone ? <Pressable accessibilityRole="button" onPress={() => openLesson(0)} className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-2xl border-b-4 border-[#3E8CB2] bg-[#59C8FF] px-4 py-3"><RotateCcw size={19} color="white" /><Text className="font-nunito-extrabold text-base text-white">{t('practice.bank_retry')}</Text></Pressable> : null}
        </View>
      </>}
    </ScrollView>
  </View>;
}
