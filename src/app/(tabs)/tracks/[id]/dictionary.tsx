import { KeyboardLift } from '@/components/keyboard-lift';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { BookOpen, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useTrackDictionary } from '@/hooks/use-tracks';

const glass = {
  backgroundColor: 'rgba(255,255,255,0.14)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.22)',
} as const;

export default function TrackDictionaryScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const dictionary = useTrackDictionary(id, query);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const entries = dictionary.data?.entries ?? [];
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: t('dict.stack_title') }} />
      <KeyboardLift>
<ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={s.title}>{t('dict.title')}</Text>
          <Text style={s.subtitle}>{t('dict.subtitle')}</Text>
        </View>

        <View style={[s.search, glass]}>
          <Search size={19} color="rgba(255,255,255,0.65)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('dict.search_ph')}
            placeholderTextColor="rgba(255,255,255,0.48)"
            style={s.searchInput}
          />
        </View>

        {dictionary.isLoading ? (
          <ActivityIndicator color="#FFD84A" style={{ marginTop: 40 }} />
        ) : dictionary.error ? (
          <View style={[s.empty, glass]}>
            <Text style={s.emptyEmoji}>😕</Text>
            <Text style={s.emptyTitle}>{t('dict.load_failed')}</Text>
            <Pressable onPress={() => dictionary.refetch()}><Text style={s.link}>{t('dict.retry')}</Text></Pressable>
          </View>
        ) : entries.length === 0 ? (
          <View style={[s.empty, glass]}>
            <BookOpen size={38} color="#FFD84A" />
            <Text style={s.emptyTitle}>{query ? t('fc.nothing_found') : t('dict.preparing')}</Text>
            <Text style={s.emptyText}>{query ? t('dict.change_query') : t('dict.empty')}</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <View style={s.listHeader}>
              <Text style={s.count}>{t('dict.words_count', { count: dictionary.data?.total ?? entries.length })}</Text>
            </View>
            {entries.map((entry) => {
              return (
                <View
                  key={entry.vocabulary.id}
                  style={[s.word, glass]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.wordTitle}>{entry.vocabulary.word}</Text>
                    <Text style={s.translation}>{entry.vocabulary.translation}</Text>
                    {!!entry.vocabulary.transcription && <Text style={s.transcription}>{entry.vocabulary.transcription}</Text>}
                  </View>
                  {entry.added && <Text style={s.added}>{t('dict.in_library')}</Text>}
                </View>
              );
            })}
          </View>
        )}

        {entries.some((entry) => entry.added) && (
          <Pressable onPress={() => router.push('/flashcards' as never)} style={s.libraryLink}>
            <Text style={s.libraryLinkText}>{t('dict.open_my')}</Text>
          </Pressable>
        )}
      </ScrollView>
</KeyboardLift>

    </View>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingBottom: 120, gap: 16 },
  title: { color: '#fff', fontSize: 26, fontWeight: '900' },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 19, marginTop: 7 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 17, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2 },
  count: { color: 'rgba(255,255,255,0.68)', fontSize: 13, fontWeight: '800' },
  link: { color: '#FFD84A', fontSize: 13, fontWeight: '900' },
  word: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 19, padding: 14 },
  wordTitle: { color: '#fff', fontSize: 17, fontWeight: '900' },
  translation: { color: 'rgba(255,255,255,0.78)', fontSize: 14, marginTop: 3 },
  transcription: { color: 'rgba(255,216,74,0.7)', fontSize: 12, marginTop: 3 },
  added: { color: '#9BE7AC', fontSize: 10, fontWeight: '900' },
  empty: { alignItems: 'center', gap: 9, borderRadius: 22, padding: 28, marginTop: 18 },
  emptyEmoji: { fontSize: 38 },
  emptyTitle: { color: '#fff', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  libraryLink: { alignItems: 'center', paddingVertical: 10 },
  libraryLinkText: { color: '#FFD84A', fontWeight: '900' },
});
