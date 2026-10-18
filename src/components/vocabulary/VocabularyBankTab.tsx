import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { MagnifyingGlass, SpeakerHigh, X } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

import { useVocabularyBankPages } from '@/hooks/use-vocabulary-bank';
import { SKY } from '@/components/lesson/sky-lesson-header';
import { skyFont } from '@/components/lesson/sky-ui';
import { SkyPanel } from '@/components/practice/practice-ui';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

function partOfSpeechLabel(partOfSpeech: string, locale: string) {
  const normalized = partOfSpeech.trim().toLowerCase();
  const labels: Record<string, Record<string, string>> = {
    noun: { ru: 'сущ.', en: 'noun', kk: 'зат есім' },
    verb: { ru: 'глагол', en: 'verb', kk: 'етістік' },
    adjective: { ru: 'прил.', en: 'adj.', kk: 'сын есім' },
    adverb: { ru: 'нареч.', en: 'adv.', kk: 'үстеу' },
    preposition: { ru: 'предлог', en: 'prep.', kk: 'шылау' },
  };
  return labels[normalized]?.[locale] ?? partOfSpeech;
}

/** Vocabulary bank: search and CEFR levels; adding happens after the word lesson. */
export default function VocabularyBankTab() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<string>('A1');
  const locale = (i18n.resolvedLanguage ?? 'ru').slice(0, 2).toLowerCase();

  const filters = useMemo(() => ({ cefr_level: level, locale, ...(query ? { search: query } : {}) }), [level, locale, query]);
  const bank = useVocabularyBankPages(filters);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const entries = useMemo(() => (bank.data?.pages ?? []).flatMap((page) => page.entries ?? []), [bank.data]);
  const speak = (word: string) => Speech.speak(word, { language: 'en-US', rate: 0.85 });

  return (
    <View style={st.root}>
      <SkyPanel style={st.search}>
        <MagnifyingGlass size={20} weight="bold" color={SKY.blueDark} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('practice.bank_search')}
          placeholderTextColor="#8A949B"
          style={st.searchInput}
          accessibilityLabel={t('practice.bank_search')}
          returnKeyType="search"
        />
        {search.length > 0 ? (
          <Pressable onPress={() => setSearch('')} hitSlop={10} accessibilityLabel={t('practice.bank_clear')} style={st.clear}>
            <X size={14} weight="bold" color={SKY.muted} />
          </Pressable>
        ) : null}
      </SkyPanel>

      <View style={st.levels}>
        {LEVELS.map((item) => {
          const on = item === level;
          return (
            <Pressable key={item} onPress={() => setLevel(item)} style={[st.chip, on && st.chipOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
              <Text style={[st.chipText, on && st.chipTextOn]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      {bank.isLoading ? <ActivityIndicator color={SKY.blue} style={{ marginVertical: 28 }} /> : null}
      {bank.isError ? <Text style={st.note}>{t('practice.bank_error')}</Text> : null}
      {!bank.isLoading && !bank.isError && entries.length === 0 ? (
        <Text style={st.note}>{query ? t('practice.bank_empty_search') : t('practice.bank_empty_level')}</Text>
      ) : null}

      <View style={{ gap: 10 }}>
        {entries.map((entry) => (
            <SkyPanel key={entry.external_id} style={st.row}>
              <Pressable
                onPress={() => router.push(`/practice/vocabulary/${entry.external_id}/learn` as never)}
                style={{ flex: 1 }}
                accessibilityRole="button"
                accessibilityLabel={`${entry.word}, ${entry.translation}`}
              >
                <Text style={st.word} numberOfLines={1}>{entry.word}</Text>
                <Text style={st.sub} numberOfLines={1}>{partOfSpeechLabel(entry.part_of_speech, locale)} · {entry.translation}</Text>
              </Pressable>
              <Pressable onPress={() => speak(entry.word)} style={st.speak} accessibilityRole="button" accessibilityLabel={t('practice.bank_listen')}>
                <SpeakerHigh size={18} weight="bold" color={SKY.blueDark} />
              </Pressable>
            </SkyPanel>
          ))}
      </View>

      {bank.hasNextPage ? (
        <Pressable onPress={() => void bank.fetchNextPage()} disabled={bank.isFetchingNextPage} style={st.more} accessibilityRole="button">
          {bank.isFetchingNextPage ? <ActivityIndicator color={SKY.blueDark} /> : <Text style={st.moreText}>{t('practice.bank_load_more')}</Text>}
        </Pressable>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  root: { marginTop: 16, gap: 12 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 52, borderRadius: 16 },
  searchInput: { flex: 1, fontFamily: skyFont.bold, fontSize: 15, color: SKY.ink, paddingVertical: 0 },
  clear: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EEF2F5', alignItems: 'center', justifyContent: 'center' },
  levels: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#DDE3E8' },
  chipOn: { backgroundColor: '#EAF8FF', borderColor: SKY.blue },
  chipText: { fontFamily: skyFont.strong, fontSize: 13, color: SKY.muted },
  chipTextOn: { color: SKY.ink },
  note: { fontFamily: skyFont.bold, fontSize: 14, color: SKY.muted, textAlign: 'center', marginVertical: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  word: { fontFamily: skyFont.title, fontSize: 17, color: SKY.ink },
  sub: { fontFamily: skyFont.medium, fontSize: 13, color: SKY.muted, marginTop: 2 },
  speak: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF8FF' },
  add: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: SKY.green, borderBottomWidth: 3, borderBottomColor: SKY.greenDark },
  added: { backgroundColor: '#EEF2F5', borderBottomColor: '#D3DAE0' },
  more: { height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: SKY.line },
  moreText: { fontFamily: skyFont.strong, fontSize: 14, color: SKY.blueDark },
});
