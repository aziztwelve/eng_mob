import React, { useEffect } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, MessageCircleMore } from 'lucide-react-native';
import { useHomePath } from '@/hooks/use-home-path';
import { useStartFreeTalk } from '@/hooks/use-start-free-talk';
import { markStartup } from '@/lib/startup-timing';

const HERO = require('../../../assets/home-variants/robot-10.png');
const LOGO = require('../../../assets/home-variants/logo10.png');
const BACKGROUND = require('../../../assets/home-variants/bg10.png');
const BUBBLES = require('../../../assets/home-variants/icon10-bubbles.png');
const CHAT = require('../../../assets/home-variants/icon10-chat.png');
const LEVELS = require('../../../assets/home-variants/icon10-levels.png');
const LINK_IMAGES = [
  require('../../../assets/home-variants/icon10-tracks.png'),
  require('../../../assets/home-variants/icon10-words.png'),
  require('../../../assets/home-variants/icon10-bank.png'),
  require('../../../assets/home-variants/icon10-dict.png'),
];

const translations = {
  ru: {
    hi: 'Привет!',
    ready: 'Готовы попрактиковать язык в разговоре?',
    talk: 'Поговорить с AI',
    free: 'Свободный разговор',
    levels: 'Темы по уровням',
    tracks: 'Треки',
    words: 'Слова',
    bank: 'Банк слов',
    dict: 'Словари',
  },
  en: {
    hi: 'Hello!',
    ready: 'Ready to practise English through conversation?',
    talk: 'Talk to AI',
    free: 'Free Talk',
    levels: 'Topics by level',
    tracks: 'Tracks',
    words: 'Words',
    bank: 'Word Bank',
    dict: 'Dictionaries',
  },
  kk: {
    hi: 'Сәлем!',
    ready: 'Ағылшынша сөйлесуге дайынсыз ба?',
    talk: 'AI-мен сөйлесу',
    free: 'Еркін әңгіме',
    levels: 'Деңгей тақырыптары',
    tracks: 'Тректер',
    words: 'Сөздер',
    bank: 'Сөздер банкі',
    dict: 'Сөздіктер',
  },
} as const;

export default function AIHome() {
  useEffect(() => { markStartup('home mounted'); }, []);
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage?.slice(0, 2);
  const text = translations[language === 'en' || language === 'kk' ? language : 'ru'];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const path = useHomePath();
  const freeTalk = useStartFreeTalk();
  const scale = Math.min(width, 600) / 375;

  const talk = () => { void freeTalk.start(); };
  const topics = () => router.push('/(tabs)/ai');
  const practice = (tab: 'tracks' | 'words' | 'bank') => router.navigate({
    pathname: '/(tabs)/practice',
    params: { tab, selection: String(Date.now()) },
  });
  const dictionary = () => {
    const id = path.track?.code || path.track?.id;
    if (id) router.push({ pathname: '/(tabs)/tracks/[id]/dictionary', params: { id } });
    else router.push('/(tabs)/tracks');
  };
  const links = [
    { title: text.tracks, onPress: () => practice('tracks') },
    { title: text.words, onPress: () => practice('words') },
    { title: text.bank, onPress: () => practice('bank') },
    { title: text.dict, onPress: dictionary },
  ];

  return (
    <View className="flex-1 bg-[#D5F1FF]">
      <Image source={BACKGROUND} resizeMode="cover" className="absolute h-full w-full" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ marginTop: insets.top, marginBottom: insets.bottom + 82 * scale }}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
      >
        <View className="w-full max-w-[600px] self-center px-[14px]">
          <View className="items-center">
            <Image source={LOGO} resizeMode="contain" className="h-[66px] w-[230px]" accessibilityLabel="LingoIQ" />
          </View>
          <Text className="mt-3 px-4 font-nunito-black text-[36px] leading-[44px] text-[#102350]">{text.hi}</Text>
          <Text className="mt-1 max-w-[300px] px-4 font-nunito-semibold text-[19px] leading-6 text-[#42607A]">{text.ready}</Text>
          <View className="mt-1 h-[204px]">
            <View className="absolute inset-0 overflow-hidden">
              <Image source={HERO} resizeMode="contain" className="absolute -left-[22px] -top-4 h-[300px] w-[300px]" />
            </View>
            <Image source={BUBBLES} resizeMode="contain" className="absolute -right-[60px] -top-[50px] h-[220px] w-[270px]" />
          </View>

          <Pressable
            onPress={talk}
            disabled={freeTalk.isStarting}
            accessibilityRole="button"
            accessibilityState={{ busy: freeTalk.isStarting, disabled: freeTalk.isStarting }}
            className="min-h-[72px] flex-row items-center justify-center gap-2 rounded-full bg-[#FFDA30] px-5"
          >
            {freeTalk.isStarting ? <ActivityIndicator color="#102350" /> : <MessageCircleMore size={37} strokeWidth={2.5} color="#102350" />}
            <Text numberOfLines={1} adjustsFontSizeToFit className="flex-1 text-center font-nunito-black text-[23px] text-[#102350]">{freeTalk.isStarting ? t('freeTalk.starting') : text.talk}</Text>
            <ChevronRight size={29} strokeWidth={2.5} color="#102350" />
          </Pressable>

          <View className="mt-4 flex-row gap-3">
            <Pressable onPress={talk} disabled={freeTalk.isStarting} accessibilityRole="button" accessibilityState={{ disabled: freeTalk.isStarting }} className="min-h-[120px] flex-1 justify-center rounded-[20px] bg-white px-4 pb-3">
              <View className="h-[76px] items-center justify-center">
                <Image source={CHAT} resizeMode="contain" className="absolute h-[92px] w-[146px]" />
              </View>
              <View className="flex-row items-center">
                <Text className="flex-1 font-nunito-extrabold text-[17px] leading-5 text-[#102350]">{text.free}</Text>
                <ChevronRight size={21} color="#102350" />
              </View>
            </Pressable>
            <Pressable onPress={topics} accessibilityRole="button" className="min-h-[120px] flex-1 justify-center rounded-[20px] bg-white px-4 pb-3">
              <View className="h-[76px] items-center justify-center">
                <Image source={LEVELS} resizeMode="contain" className="absolute h-[92px] w-[146px]" />
              </View>
              <View className="flex-row items-center">
                <Text className="flex-1 font-nunito-extrabold text-[17px] leading-5 text-[#102350]">{text.levels}</Text>
                <ChevronRight size={21} color="#102350" />
              </View>
            </Pressable>
          </View>

          <View className="mt-4 flex-row flex-wrap gap-2">
            {links.map(({ title, onPress }, index) => (
              <Pressable
                key={title}
                onPress={onPress}
                accessibilityRole="button"
                className="min-h-[100px] items-center justify-center gap-1 rounded-[20px] bg-white px-1"
                style={{ width: (Math.min(width, 600) - 52) / 4 }}
              >
                <Image source={LINK_IMAGES[index]} resizeMode="contain" className={index === 0 ? 'h-[80px] w-[88px]' : 'h-[70px] w-[72px]'} />
                <Text numberOfLines={2} className="text-center font-nunito-extrabold text-[12px] text-[#102350]">{title}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
