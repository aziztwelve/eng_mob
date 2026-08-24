import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Check, Search } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { useAddTrackDictionaryWords, useTrackDictionary } from '@/hooks/use-tracks';

const CTA = ['#A8243F', '#CC5A1F'] as const;
const glass = {
  backgroundColor: 'rgba(255,255,255,0.14)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.22)',
} as const;

export default function TrackDictionaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const dictionary = useTrackDictionary(id, query);
  const addWords = useAddTrackDictionaryWords(id);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const entries = dictionary.data?.entries ?? [];
  const available = entries.filter((entry) => !entry.added);
  const selectedIDs = [...selected].filter((vocabularyID) => available.some((entry) => entry.vocabulary.id === vocabularyID));

  const toggle = (vocabularyID: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(vocabularyID)) next.delete(vocabularyID);
      else next.add(vocabularyID);
      return next;
    });
  };

  const add = async (ids: string[]) => {
    if (!ids.length) return;
    try {
      const result = await addWords.mutateAsync(ids);
      setSelected(new Set());
      Toast.show({
        type: 'success',
        text1: 'Слова добавлены',
        text2: `Новых: ${result.created.length}, уже были: ${result.skipped.length}`,
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Не удалось добавить слова' });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Словарь трека' }} />
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={s.title}>Слова из уроков</Text>
          <Text style={s.subtitle}>Добавляй нужные слова в личную библиотеку и повторяй по интервальному расписанию.</Text>
        </View>

        <View style={[s.search, glass]}>
          <Search size={19} color="rgba(255,255,255,0.65)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Найти слово или перевод"
            placeholderTextColor="rgba(255,255,255,0.48)"
            style={s.searchInput}
          />
        </View>

        {dictionary.isLoading ? (
          <ActivityIndicator color="#FFD84A" style={{ marginTop: 40 }} />
        ) : dictionary.error ? (
          <View style={[s.empty, glass]}>
            <Text style={s.emptyEmoji}>😕</Text>
            <Text style={s.emptyTitle}>Словарь не загрузился</Text>
            <Pressable onPress={() => dictionary.refetch()}><Text style={s.link}>Попробовать снова</Text></Pressable>
          </View>
        ) : entries.length === 0 ? (
          <View style={[s.empty, glass]}>
            <BookOpen size={38} color="#FFD84A" />
            <Text style={s.emptyTitle}>{query ? 'Ничего не найдено' : 'Словарь готовится'}</Text>
            <Text style={s.emptyText}>{query ? 'Попробуй изменить запрос.' : 'В этом треке пока нет слов с проверенным переводом.'}</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <View style={s.listHeader}>
              <Text style={s.count}>{dictionary.data?.total ?? entries.length} слов</Text>
              {available.length > 0 && (
                <Pressable onPress={() => setSelected(new Set(available.map((entry) => entry.vocabulary.id)))}>
                  <Text style={s.link}>Выбрать все</Text>
                </Pressable>
              )}
            </View>
            {entries.map((entry) => {
              const checked = entry.added || selected.has(entry.vocabulary.id);
              return (
                <Pressable
                  key={entry.vocabulary.id}
                  disabled={entry.added}
                  onPress={() => toggle(entry.vocabulary.id)}
                  style={[s.word, glass, checked && s.wordSelected]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.wordTitle}>{entry.vocabulary.word}</Text>
                    <Text style={s.translation}>{entry.vocabulary.translation}</Text>
                    {!!entry.vocabulary.transcription && <Text style={s.transcription}>{entry.vocabulary.transcription}</Text>}
                  </View>
                  <View style={[s.checkbox, checked && s.checkboxChecked]}>
                    {checked && <Check size={16} color={entry.added ? '#18351F' : '#3D0A1A'} strokeWidth={3} />}
                  </View>
                  {entry.added && <Text style={s.added}>В библиотеке</Text>}
                </Pressable>
              );
            })}
          </View>
        )}

        {entries.some((entry) => entry.added) && (
          <Pressable onPress={() => router.push('/flashcards' as never)} style={s.libraryLink}>
            <Text style={s.libraryLinkText}>Открыть мои флешкарты →</Text>
          </Pressable>
        )}
      </ScrollView>

      {selectedIDs.length > 0 && (
        <View style={s.footer}>
          <Pressable disabled={addWords.isPending} onPress={() => add(selectedIDs)} style={s.ctaWrap}>
            <LinearGradient colors={CTA} style={s.cta}>
              {addWords.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.ctaText}>Добавить {selectedIDs.length} во флешкарты</Text>}
            </LinearGradient>
          </Pressable>
        </View>
      )}
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
  wordSelected: { borderColor: 'rgba(255,216,74,0.7)', backgroundColor: 'rgba(255,216,74,0.12)' },
  wordTitle: { color: '#fff', fontSize: 17, fontWeight: '900' },
  translation: { color: 'rgba(255,255,255,0.78)', fontSize: 14, marginTop: 3 },
  transcription: { color: 'rgba(255,216,74,0.7)', fontSize: 12, marginTop: 3 },
  checkbox: { width: 26, height: 26, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#FFD84A', borderColor: '#FFD84A' },
  added: { color: '#9BE7AC', fontSize: 10, fontWeight: '900' },
  empty: { alignItems: 'center', gap: 9, borderRadius: 22, padding: 28, marginTop: 18 },
  emptyEmoji: { fontSize: 38 },
  emptyTitle: { color: '#fff', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  libraryLink: { alignItems: 'center', paddingVertical: 10 },
  libraryLinkText: { color: '#FFD84A', fontWeight: '900' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: 'rgba(35,8,28,0.94)' },
  ctaWrap: { borderRadius: 18, overflow: 'hidden' },
  cta: { minHeight: 56, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
