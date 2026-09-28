import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useVocabularyBankFeed, useVocabularyBankPages } from '@/hooks/use-vocabulary-bank';
import type { VocabularyBankWord } from '@/types/api';
import {
  IconArrowRight,
  IconBookOpen,
  IconCheck,
  IconChevronRight,
  IconSearch,
  IconSparkles,
  IconVolume,
  IconX,
  IconPlay,
} from '@/components/ui/icons';

const CTA = ["#A8243F", "#CC5A1F"] as const;
const GOLD = ["#FFDF5E", "#FFB338"] as const;
const MINT = '#2EECC8';

const glass = {
  backgroundColor: "rgba(255,255,255,0.10)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.16)",
} as const;

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
const TOTAL_STEPS = 15;

/** Word status: mint check for completed, gold pill for in-progress. */
function StatusChip({ word }: { word: VocabularyBankWord }) {
  if (word.status === 'completed') {
    return (
      <View style={vb.done}>
        <IconCheck size={13} color={MINT} />
      </View>
    );
  }
  if (word.status === 'in_progress') {
    return (
      <View style={vb.step}>
        <Text style={vb.stepText}>{word.current_step ?? 1}/{TOTAL_STEPS}</Text>
      </View>
    );
  }
  return null;
}

export default function VocabularyBankTab() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('A1');
  // Reactive locale: when the app language changes after mount, the query
  // key changes too and the bank refetches in the right language (instead of
  // rendering EN UI with RU translations captured at mount time).
  const locale = (i18n.resolvedLanguage ?? 'ru').slice(0, 2).toLowerCase();
  const filters = useMemo(
    () => ({ cefr_level: level, locale, ...(query ? { search: query } : {}) }),
    [level, locale, query],
  );
  const bank = useVocabularyBankPages(filters);
  const feed = useVocabularyBankFeed({ cefr_level: level, locale, new_limit: 5, in_progress_limit: 5 });

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const entries = useMemo(
    () => (bank.data?.pages ?? []).flatMap((page) => page.entries ?? []),
    [bank.data],
  );
  const total = bank.data?.pages?.[0]?.total ?? 0;

  // Bank answers alphabetically; group the loaded part by first letter.
  const groups = useMemo(() => {
    const map = new Map<string, VocabularyBankWord[]>();
    entries.forEach((word) => {
      const letter = word.word.charAt(0).toUpperCase();
      const bucket = map.get(letter);
      if (bucket) bucket.push(word);
      else map.set(letter, [word]);
    });
    return Array.from(map.entries());
  }, [entries]);

  const inProgress = feed.data?.in_progress ?? [];
  const newWords = feed.data?.new_words ?? [];

  return (
    <View style={{ marginTop: 20, gap: 18 }}>
      {/* hero */}
      <View style={vb.hero}>
        <LinearGradient colors={GOLD as unknown as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={vb.heroIcon}>
          <IconBookOpen size={24} color="#3D0A1A" strokeWidth={2} />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={vb.heroTitle}>{t('practice.bank_title')}</Text>
          <Text style={vb.heroSub}>{t('practice.bank_sub')}</Text>
        </View>
        <View style={[vb.countTile, glass]}>
          <Text style={vb.countNum}>{total}</Text>
          <Text style={vb.countLabel}>{t('practice.bank_count_short')}</Text>
        </View>
      </View>

      {/* continue learning */}
      {inProgress.length > 0 ? (
        <View style={{ gap: 10 }}>
          <View style={vb.sectionRow}>
            <IconPlay size={12} color="#FFD84A" />
            <Text style={vb.sectionTitle}>{t('practice.bank_continue')}</Text>
          </View>
          {inProgress.map((entry) => (
            <Pressable
              key={`continue-${entry.word.external_id}`}
              onPress={() => router.push(`/practice/vocabulary/${entry.word.external_id}/learn` as never)}
              style={[vb.card, vb.rowCard]}
              accessibilityRole="button"
              accessibilityLabel={`${entry.word.word}, ${t('practice.bank_step', { step: entry.current_step, total: TOTAL_STEPS })}`}
            >
              <View style={{ flex: 1, gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Text style={vb.word}>{entry.word.word}</Text>
                  <Text style={vb.tr} numberOfLines={1}>{entry.word.translation}</Text>
                </View>
                <View style={vb.pbarRow}>
                  <View style={vb.pbar}>
                    <LinearGradient
                      colors={GOLD as unknown as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[vb.pbarFill, { width: `${Math.min(100, Math.round((entry.current_step / TOTAL_STEPS) * 100))}%` }]}
                    />
                  </View>
                  <Text style={vb.pbarLabel}>{entry.current_step}/{TOTAL_STEPS}</Text>
                </View>
              </View>
              <LinearGradient colors={CTA as unknown as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={vb.playBtn}>
                <IconPlay size={16} color="#fff" />
              </LinearGradient>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* new words carousel */}
      {newWords.length > 0 ? (
        <View style={{ gap: 10 }}>
          <View style={vb.sectionRow}>
            <IconSparkles size={13} color="#FFD84A" />
            <Text style={vb.sectionTitle}>{t('practice.bank_new')}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={{ gap: 10, paddingRight: 8 }}
          >
            {newWords.map((entry) => (
              <Pressable
                key={`new-${entry.word.external_id}`}
                onPress={() => router.push(`/practice/vocabulary/${entry.word.external_id}` as never)}
                style={vb.newCard}
                accessibilityRole="button"
                accessibilityLabel={`${entry.word.word}, ${entry.word.translation}`}
              >
                <IconSparkles size={14} color="#FFD84A" />
                <Text style={vb.newWord} numberOfLines={1}>{entry.word.word}</Text>
                <Text style={vb.newTr} numberOfLines={2}>{entry.word.translation}</Text>
                <View style={vb.newFoot}>
                  <Text style={vb.newMeta}>{entry.word.cefr_level}</Text>
                  <IconChevronRight size={13} color="rgba(255,255,255,0.5)" />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* search */}
      <View style={[vb.search, glass]}>
        <IconSearch size={16} color="rgba(255,255,255,0.6)" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('practice.bank_search')}
          placeholderTextColor="rgba(255,255,255,0.45)"
          style={vb.searchInput}
          accessibilityLabel={t('practice.bank_search')}
          returnKeyType="search"
        />
        {search.length > 0 ? (
          <Pressable onPress={() => setSearch('')} hitSlop={10} accessibilityLabel={t('practice.bank_clear')} style={vb.clearBtn}>
            <IconX size={14} color="rgba(255,255,255,0.7)" />
          </Pressable>
        ) : null}
      </View>

      {/* level chips */}
      <View style={vb.levelRow}>
        {LEVELS.map((item) => {
          const active = level === item;
          return (
            <Pressable
              key={item}
              onPress={() => setLevel(item)}
              style={vb.levelChipWrap}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              {active ? (
                <LinearGradient colors={GOLD as unknown as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={vb.levelChip}>
                  <Text style={[vb.levelChipText, vb.levelChipTextActive]}>{item}</Text>
                </LinearGradient>
              ) : (
                <View style={[vb.levelChip, glass]}>
                  <Text style={vb.levelChipText}>{item}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* word list */}
      {bank.isLoading ? (
        <ActivityIndicator color="#FFD84A" style={{ marginVertical: 30 }} />
      ) : bank.isError ? (
        <View style={[vb.card, { padding: 20, alignItems: 'center', gap: 8 }]}>
          <Text style={vb.emptyText}>{t('practice.bank_error')}</Text>
          <Pressable onPress={() => bank.refetch()}><Text style={vb.link}>{t('practice.bank_retry')}</Text></Pressable>
        </View>
      ) : entries.length === 0 ? (
        <View style={[vb.card, { padding: 22, alignItems: 'center', gap: 8 }]}>
          <IconBookOpen size={28} color="rgba(255,255,255,0.4)" />
          <Text style={vb.emptyText}>{query ? t('practice.bank_empty_search') : t('practice.bank_empty_level')}</Text>
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          {groups.map(([letter, words]) => (
            <View key={letter} style={{ gap: 6 }}>
              <View style={vb.letterRow}>
                <View style={vb.letterBadge}><Text style={vb.letter}>{letter}</Text></View>
                <View style={vb.letterLine} />
              </View>
              {words.map((word) => (
                <Pressable
                  key={word.external_id}
                  onPress={() => router.push(`/practice/vocabulary/${word.external_id}` as never)}
                  style={({ pressed }) => [vb.card, vb.rowCard, pressed && { backgroundColor: 'rgba(255,255,255,0.16)' }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${word.word}, ${word.translation}`}
                >
                  <View style={[vb.avatar, word.status === 'completed' && vb.avatarDone]}><Text style={[vb.avatarText, word.status === 'completed' && vb.avatarTextDone]}>{word.word.charAt(0).toUpperCase()}</Text></View>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[vb.word, word.status === 'completed' && { color: 'rgba(255,255,255,0.55)' }]} numberOfLines={1}>{word.word}</Text>
                      {word.has_audio ? <IconVolume size={12} color="rgba(255,255,255,0.5)" /> : null}
                    </View>
                    <Text style={vb.tr} numberOfLines={1}>{word.translation}</Text>
                  </View>
                  <StatusChip word={word} />
                  {word.status !== 'completed' ? <View style={vb.cefr}><Text style={vb.cefrText}>{word.cefr_level}</Text></View> : null}
                  <IconChevronRight size={16} color="rgba(255,255,255,0.35)" />
                </Pressable>
              ))}
            </View>
          ))}
          {bank.hasNextPage ? (
            <Pressable onPress={() => bank.fetchNextPage()} disabled={bank.isFetchingNextPage} style={[vb.card, vb.moreBtn]} accessibilityRole="button">
              {bank.isFetchingNextPage ? <ActivityIndicator color="#FFD84A" /> : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={vb.moreText}>{t('practice.bank_load_more')}</Text>
                  <IconArrowRight size={14} color="#fff" />
                </View>
              )}
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const vb = StyleSheet.create({
  hero: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroIcon: {
    width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center",
    shadowColor: "#FFB338", shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  heroTitle: { color: "#fff", fontSize: 21, fontWeight: "900", letterSpacing: 0.2 },
  heroSub: { color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: "600", lineHeight: 16, marginTop: 2 },
  countTile: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, alignItems: "center" },
  countNum: { color: "#FFD84A", fontSize: 18, fontWeight: "900" },
  countLabel: { color: "rgba(255,255,255,0.55)", fontSize: 9, fontWeight: "800", letterSpacing: 0.8, marginTop: 1 },

  sectionRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "900", letterSpacing: 0.4, textTransform: "uppercase" },

  card: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 16,
  },
  rowCard: { flexDirection: "row", alignItems: "center", gap: 11, padding: 11 },
  word: { color: "#fff", fontSize: 15.5, fontWeight: "800" },
  tr: { color: "rgba(255,255,255,0.62)", fontSize: 12.5, fontWeight: "600" },

  done: {
    width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(46,236,200,0.14)", borderWidth: 1, borderColor: "rgba(46,236,200,0.45)",
  },
  step: { backgroundColor: "rgba(255,216,74,0.13)", borderWidth: 1, borderColor: "rgba(255,216,74,0.4)", borderRadius: 9, paddingHorizontal: 7, paddingVertical: 3 },
  stepText: { color: "#FFD84A", fontSize: 10.5, fontWeight: "900" },

  pbarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pbar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.14)", overflow: "hidden" },
  pbarFill: { height: "100%", borderRadius: 3 },
  pbarLabel: { color: "rgba(255,255,255,0.55)", fontSize: 10.5, fontWeight: "800" },
  playBtn: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },

  newCard: {
    width: 150, backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 16, padding: 13, gap: 3,
  },
  newWord: { color: "#fff", fontSize: 16, fontWeight: "900", marginTop: 4 },
  newTr: { color: "rgba(255,255,255,0.62)", fontSize: 12, fontWeight: "600", minHeight: 32, lineHeight: 16 },
  newFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  newMeta: { color: "rgba(255,255,255,0.45)", fontSize: 10.5, fontWeight: "800", letterSpacing: 0.3 },

  search: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.10)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" },
  searchInput: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "600", paddingVertical: 10 },
  clearBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },

  levelRow: { flexDirection: "row", gap: 7 },
  levelChipWrap: { flex: 1, borderRadius: 11, overflow: "hidden" },
  levelChip: { alignItems: "center", paddingVertical: 8, borderRadius: 11 },
  levelChipText: { color: "rgba(255,255,255,0.7)", fontSize: 12.5, fontWeight: "900" },
  levelChipTextActive: { color: "#3D0A1A" },

  letterRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  letterBadge: { width: 22, height: 22, borderRadius: 8, backgroundColor: "rgba(255,216,74,0.13)", borderWidth: 1, borderColor: "rgba(255,216,74,0.3)", alignItems: "center", justifyContent: "center" },
  letter: { color: "#FFD84A", fontSize: 11.5, fontWeight: "900" },
  letterLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.10)" },
  avatar: {
    width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,216,74,0.10)", borderWidth: 1, borderColor: "rgba(255,216,74,0.25)",
  },
  avatarText: { color: "#FFD84A", fontSize: 16, fontWeight: "900" },
  avatarDone: { backgroundColor: "rgba(46,236,200,0.08)", borderColor: "rgba(46,236,200,0.25)" },
  avatarTextDone: { color: MINT },
  cefr: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  cefrText: { color: "rgba(255,255,255,0.6)", fontSize: 10.5, fontWeight: "900" },
  moreBtn: { alignItems: "center", paddingVertical: 13, borderRadius: 14, borderStyle: "dashed" },
  moreText: { color: "#fff", fontWeight: "800", fontSize: 13.5 },
  emptyText: { color: "rgba(255,255,255,0.7)", fontSize: 13.5, textAlign: "center", lineHeight: 19 },
  link: { color: "#FFD84A", fontWeight: "800", fontSize: 14 },
});
