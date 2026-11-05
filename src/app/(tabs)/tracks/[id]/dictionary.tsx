import { KeyboardLift } from '@/components/keyboard-lift';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { BookOpen, Search, TriangleAlert } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTrackDictionary } from '@/hooks/use-tracks';

export default function TrackDictionaryScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const dictionary = useTrackDictionary(id, query);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const entries = dictionary.data?.entries ?? [];
  return (
    <View className="flex-1">
      <Stack.Screen options={{ title: t('dict.stack_title') }} />
      <KeyboardLift>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }} keyboardShouldPersistTaps="handled">
      <View className="gap-4 p-[18px]">
        <View>
          <Text className="font-nunito-black text-[26px] text-[#172B43]">{t('dict.title')}</Text>
          <Text className="mt-2 font-nunito-semibold text-sm leading-5 text-[#536B7B]">{t('dict.subtitle')}</Text>
        </View>

        <View className="min-h-[54px] flex-row items-center gap-3 rounded-[18px] border border-[#C9EDFF] bg-white px-4">
          <Search size={21} color="#219EC6" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('dict.search_ph')}
            placeholderTextColor="#83919B"
            accessibilityLabel={t('dict.search_ph')}
            className="flex-1 py-3 font-nunito-semibold text-base text-[#172B43]"
          />
        </View>

        {dictionary.isLoading ? (
          <ActivityIndicator color="#219EC6" className="mt-10" />
        ) : dictionary.error ? (
          <View className="mt-4 items-center gap-3 rounded-[22px] border border-[#C9EDFF] bg-white p-7">
            <TriangleAlert size={36} color="#219EC6" />
            <Text className="text-center font-nunito-extrabold text-lg text-[#172B43]">{t('dict.load_failed')}</Text>
            <Pressable accessibilityRole="button" onPress={() => dictionary.refetch()} className="min-h-11 justify-center px-4"><Text className="font-nunito-extrabold text-sm text-[#1685B5]">{t('dict.retry')}</Text></Pressable>
          </View>
        ) : entries.length === 0 ? (
          <View className="mt-4 items-center gap-3 rounded-[22px] border border-[#C9EDFF] bg-white p-7">
            <BookOpen size={38} color="#219EC6" />
            <Text className="text-center font-nunito-extrabold text-lg text-[#172B43]">{query ? t('fc.nothing_found') : t('dict.preparing')}</Text>
            <Text className="text-center font-nunito-semibold text-sm leading-5 text-[#536B7B]">{query ? t('dict.change_query') : t('dict.empty')}</Text>
          </View>
        ) : (
          <View className="gap-3">
            <View className="px-1">
              <Text className="font-nunito-extrabold text-sm text-[#536B7B]">{t('dict.words_count', { count: dictionary.data?.total ?? entries.length })}</Text>
            </View>
            {entries.map((entry) => {
              return (
                <View
                  key={entry.vocabulary.id}
                  className="flex-row items-center gap-3 rounded-[20px] border border-b-[3px] border-[#C9EDFF] bg-white p-4"
                >
                  <View className="flex-1">
                    <Text className="font-nunito-extrabold text-lg text-[#172B43]">{entry.vocabulary.word}</Text>
                    <Text className="mt-1 font-nunito-semibold text-sm text-[#536B7B]">{entry.vocabulary.translation}</Text>
                    {!!entry.vocabulary.transcription && <Text className="mt-1 font-nunito-semibold text-xs text-[#1685B5]">{entry.vocabulary.transcription}</Text>}
                  </View>
                  {entry.added && <Text className="rounded-full bg-[#E4F8EF] px-2 py-1 font-nunito-extrabold text-[10px] text-[#287654]">{t('dict.in_library')}</Text>}
                </View>
              );
            })}
          </View>
        )}

        {entries.some((entry) => entry.added) && (
          <Pressable accessibilityRole="button" onPress={() => router.push('/flashcards' as never)} className="min-h-11 items-center justify-center py-3">
            <Text className="font-nunito-extrabold text-sm text-[#1685B5]">{t('dict.open_my')}</Text>
          </Pressable>
        )}
      </View>
      </ScrollView>
      </KeyboardLift>

    </View>
  );
}
