import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, Text, View } from 'react-native';
import { ArrowLeft, BriefcaseBusiness, CalendarDays, Check, Cloud, Flag, MessageCircle, Mountain, Play, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FigmaSvg } from '@/components/figma/FigmaSvg';
import type { Track } from '@/types/api';

const platform = require('../../../assets/figma/cloud-tracks/cloud-platform.png');
const bear = require('../../../assets/figma/cloud-tracks/bear-career.png');
const clouds = [require('../../../assets/figma/home-map/cloud-1.svg'), require('../../../assets/figma/home-map/cloud-2.svg')];
const icons = [BriefcaseBusiness, CalendarDays, MessageCircle];
const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
export type CloudTrackItem = { track: Track; lessons: { id: string; completed: boolean }[]; loading: boolean; error: boolean };

type Props = {
  title: string; level: string; items: CloudTrackItem[]; loading: boolean; error: boolean;
  onBack: () => void; onLevel: (level: string) => void; onRetry: () => void;
  onOpenTrack: (track: Track) => void; onContinue: (lessonId: string) => void;
};

/** Each cloud represents a track. Future tracks stay browsable; lesson rules live in the track screen. */
export function CloudTrackPath({ title, level, items, loading, error, onBack, onLevel, onRetry, onOpenTrack, onContinue }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [selectingLevel, setSelectingLevel] = useState(false);
  // Both presentations share the same tracks and progress. Clouds open by default.
  const [variant, setVariant] = useState<'clouds' | 'mountain'>('clouds');
  const mountain = variant === 'mountain';
  const ready = !loading && items.every(item => !item.loading && !item.error);
  const currentIndex = ready ? items.findIndex(item => item.lessons.some(lesson => !lesson.completed)) : -1;
  return <View className="flex-1 bg-[#B9E8FF]">
    {mountain ? <Image source={require('../../../assets/figma/cloud-tracks/mountain-trail.webp')} resizeMode="cover" className="absolute h-full w-full" accessible={false} /> : null}
    {!mountain ? <><View pointerEvents="none" className="absolute -left-16 top-6 opacity-80"><FigmaSvg source={clouds[0]} width={240} height={116} /></View>
    <View pointerEvents="none" className="absolute -right-16 top-64 opacity-80"><FigmaSvg source={clouds[1]} width={260} height={92} /></View></> : null}
    <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
      <Pressable accessibilityRole="button" accessibilityLabel={t('practice.bank_back')} onPress={onBack} className="h-11 w-11 items-center justify-center rounded-2xl border-b-4 border-[#D7E8F2] bg-white"><ArrowLeft size={22} color="#526879" /></Pressable>
      <Text accessibilityRole="header" className="flex-1 font-nunito-extrabold text-[19px] leading-6 text-[#152F60]">{title}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={t('cloud_tracks.choose_level', { level })} onPress={() => setSelectingLevel(true)} className="min-h-11 min-w-11 items-center justify-center rounded-2xl border-2 border-b-4 border-[#92DAFF] bg-white px-2"><Text className="font-nunito-extrabold text-base text-[#247FA8]">{level}</Text></Pressable>
    </View>
    <View className="mx-auto mb-1 flex-row rounded-full bg-white/90 p-1">{(['clouds', 'mountain'] as const).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: variant === value }} onPress={() => setVariant(value)} className={`min-h-9 flex-row items-center gap-2 rounded-full px-4 py-2 ${variant === value ? 'bg-[#DEF4FF]' : ''}`}>
      {value === 'clouds' ? <Cloud size={16} color="#247FA8" /> : <Mountain size={16} color="#247FA8" />}<Text className="font-nunito-bold text-xs text-[#247FA8]">{t(`cloud_tracks.${value}`)}</Text>
    </Pressable>)}</View>
    <FlatList
      key={level} data={items} keyExtractor={item => item.track.id} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
      ListHeaderComponent={<View className="h-7 items-end justify-center pr-10"><Flag size={28} color="#F38144" fill="#FFAB64" /></View>}
      ListEmptyComponent={<View className="items-center gap-4 px-8 py-16">{loading ? <ActivityIndicator color="#159FE5" /> : <><Text className="text-center font-nunito-bold text-base text-[#526879]">{t(error ? 'tracks.load_error' : 'cloud_tracks.empty')}</Text>{error ? <Pressable accessibilityRole="button" onPress={onRetry} className="rounded-2xl bg-white px-6 py-3"><Text className="font-nunito-bold text-[#247FA8]">{t('home.path_retry')}</Text></Pressable> : null}</>}</View>}
      renderItem={({ item, index }) => {
        const current = index === currentIndex;
        const done = !item.loading && !item.error && item.lessons.length > 0 && item.lessons.every(lesson => lesson.completed);
        const Icon = done ? Check : current ? Play : icons[index % icons.length];
        const next = item.lessons.find(lesson => !lesson.completed);
        return <View className={`mx-auto w-full max-w-[440px] justify-center px-4 ${current ? 'min-h-[154px]' : 'min-h-[126px]' }`}>
          {!mountain ? <View pointerEvents="none" className={`absolute -top-9 ${index % 2 === 0 ? '-left-24' : '-right-24'} opacity-60`}><FigmaSvg source={clouds[index % 2]} width={250} height={100} /></View> : null}
          <View className={`w-[85%] ${!current && index % 2 === 0 ? 'self-start' : 'self-end'}`}>
            {!mountain ? <Image source={platform} resizeMode="stretch" className="absolute -bottom-4 -left-4 h-[88px] w-[115%]" accessible={false} /> : null}
            {current ? <Image source={bear} resizeMode="contain" className="absolute -left-12 -top-5 h-[100px] w-[75px]" accessible={false} /> : null}
            <Pressable accessibilityRole="button" accessibilityLabel={`${item.track.title}. ${item.loading ? t('cloud_tracks.loading') : t('cloud_tracks.progress', { done: item.lessons.filter(lesson => lesson.completed).length, total: item.lessons.length })}`} onPress={() => onOpenTrack(item.track)} className="flex-row items-center gap-3 py-2">
              <View style={{ width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", borderWidth: 3, borderBottomWidth: 5, borderColor: "#FFFFFF", backgroundColor: done ? "#34C759" : current ? "#59C8FF" : "#E6ECF0", borderBottomColor: done ? "#239A42" : current ? "#2FA8E6" : "#BCC7CF", shadowColor: "#2E5A74", shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
                {item.loading ? <ActivityIndicator color="#247FA8" /> : <Icon size={25} strokeWidth={3} color={done || current ? '#FFFFFF' : '#8B9BAA'} fill={current ? '#FFFFFF' : 'none'} />}
              </View>
              <View className="min-w-0 flex-1 gap-1.5 rounded-[18px] border-[1.5px] border-b-4 border-[#D6EFFC] bg-white px-3 py-2">
                <Text className="font-nunito-extrabold text-[14px] leading-[18px] text-[#171A1C]">{item.track.title}</Text>
                {item.error ? <Text className="font-nunito-semibold text-xs text-[#7B8790]">{t('cloud_tracks.progress_error')}</Text> : item.loading ? <Text className="font-nunito-semibold text-xs text-[#7B8790]">{t('cloud_tracks.loading')}</Text> : !item.lessons.length ? <Text className="font-nunito-semibold text-xs text-[#7B8790]">{t('tracks.lessons_soon')}</Text> : <View className="flex-row flex-wrap items-center gap-2">{item.lessons.length <= 6 ? item.lessons.map(lesson => <View key={lesson.id} style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: "#FFFFFF", backgroundColor: lesson.completed ? "#34C759" : current && lesson.id === next?.id ? "#59C8FF" : "#C9D3DC", shadowColor: "#2E5A74", shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }} />) : <Text className="font-nunito-semibold text-xs text-[#526879]">{t('cloud_tracks.progress', { done: item.lessons.filter(lesson => lesson.completed).length, total: item.lessons.length })}</Text>}</View>}
              </View>
            </Pressable>
            {current && next ? <Pressable accessibilityRole="button" accessibilityLabel={`${t('cloud_tracks.continue')} · ${item.track.title}`} onPress={() => onContinue(next.id)} className="ml-[72px] min-h-11 items-center justify-center rounded-2xl border-b-4 border-[#1798CC] bg-[#1AB3FF] px-3 py-2"><Text className="font-nunito-extrabold text-[15px] text-white">{t('cloud_tracks.continue')}</Text></Pressable> : null}
          </View>
        </View>;
      }}
    />
    <Modal visible={selectingLevel} transparent animationType="fade" onRequestClose={() => setSelectingLevel(false)}>
      <View className="flex-1 justify-center bg-black/30 px-8"><View accessibilityViewIsModal className="gap-3 rounded-3xl bg-white p-5"><View className="flex-row items-center justify-between"><Text className="font-nunito-extrabold text-xl text-[#152F60]">{t('cloud_tracks.level')}</Text><Pressable accessibilityRole="button" accessibilityLabel={t('cloud_tracks.close')} onPress={() => setSelectingLevel(false)} className="h-11 w-11 items-center justify-center"><X size={23} color="#526879" /></Pressable></View>{levels.map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: value === level }} onPress={() => { setSelectingLevel(false); onLevel(value); }} className={`min-h-12 flex-row items-center justify-between rounded-xl px-4 py-3 ${value === level ? 'bg-[#E1F5FF]' : 'bg-[#F7FAFD]'}`}><Text className="font-nunito-bold text-base text-[#152F60]">{value} · {t(`tracks.level_titles.${value}`)}</Text>{value === level ? <Check size={20} color="#1AB3FF" /> : null}</Pressable>)}</View></View>
    </Modal>
  </View>;
}
