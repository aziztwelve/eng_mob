import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { useVocabularyBankFeed, useVocabularyBankPages } from '@/hooks/use-vocabulary-bank';
import { getCurrentLang } from '@/lib/i18n';
import type { VocabularyBankWord } from '@/types/api';

const CTA = ["#A8243F", "#CC5A1F"] as const;
const GOLD = ["#FFDF5E", "#FFB338"] as const;

const glass = {
  backgroundColor: "rgba(255,255,255,0.14)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.22)",
} as const;

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
const TOTAL_STEPS = 15;

function SearchIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round">
      <Circle cx={11} cy={11} r={7} />
      <Line x1={21} y1={21} x2={16.5} y2={16.5} />
    </Svg>
  );
}

/** Word status chip: ✓ for completed, step counter for in-progress. */
function StatusChip({ word }: { word: VocabularyBankWord }) {
  if (word.status === 'completed') {
    return (
      <View style={vb.done}>
        <Text style={vb.doneText}>✓</Text>
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
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('A1');
  const locale = getCurrentLang();
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
    <View style={{ marginTop: 18, gap: 16 }}>
      {/* hero */}
      <View style={vb.hero}>
        <LinearGradient colors={GOLD as unknown as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={vb.heroIcon}>
          <Text style={{ fontSize: 24 }}>📚</Text>
        </LinearGradient>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={vb.heroTitle}>{t('practice.bank_title')}</Text>
          <Text style={vb.heroSub}>{t('practice.bank_sub')}</Text>
        </View>
      </View>

      {/* continue learning */}
      {inProgress.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Text style={vb.sectionTitle}>{t('practice.bank_continue')}</Text>
          {inProgress.map((entry) => (
            <Pressable
              key={`continue-${entry.word.external_id}`}
              onPress={() => router.push(`/practice/vocabulary/${entry.word.external_id}/learn` as never)}
              style={[vb.card, vb.rowCard]}
              accessibilityRole="button"
              accessibilityLabel={`${entry.word.word}, ${t('practice.bank_step', { step: entry.current_step, total: TOTAL_STEPS })}`}
            >
              <View style={{ flex: 1, gap: 7 }}>
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
                  <Text style={vb.pbarLabel}>{t('practice.bank_step', { step: entry.current_step, total: TOTAL_STEPS })}</Text>
                </View>
              </View>
              <LinearGradient colors={CTA as unknown as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={vb.playBtn}>
                <Text style={vb.playBtnText}>▶</Text>
              </LinearGradient>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* new words carousel */}
      {newWords.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Text style={vb.sectionTitle}>{t('practice.bank_new')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
            {newWords.map((entry) => (
              <Pressable
                key={`new-${entry.word.external_id}`}
                onPress={() => router.push(`/practice/vocabulary/${entry.word.external_id}` as never)}
                style={vb.newCard}
                accessibilityRole="button"
                accessibilityLabel={`${entry.word.word}, ${entry.word.translation}`}
              >
                <View style={vb.newBadge}><Text style={vb.newBadgeText}>NEW</Text></View>
                <Text style={vb.newWord} numberOfLines={1}>{entry.word.word}</Text>
                <Text style={vb.newTr} numberOfLines={1}>{entry.word.translation}</Text>
                <Text style={vb.newMeta}>{entry.word.cefr_level} · {entry.word.part_of_speech}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* search */}
      <View style={[vb.search, glass]}>
        <SearchIcon />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('practice.bank_search')}
          placeholderTextColor="rgba(255,255,255,0.55)"
          style={vb.searchInput}
          accessibilityLabel={t('practice.bank_search')}
        />
        {search.length > 0 ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityLabel={t('practice.bank_clear')}>
            <Text style={vb.clear}>✕</Text>
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
          <Text style={{ fontSize: 32 }}>📚</Text>
          <Text style={vb.emptyText}>{query ? t('practice.bank_empty_search') : t('practice.bank_empty_level')}</Text>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          <Text style={vb.listLabel}>{t('practice.bank_count', { count: total })}</Text>
          {groups.map(([letter, words]) => (
            <View key={letter} style={{ gap: 8 }}>
              <View style={vb.letterRow}>
                <Text style={vb.letter}>{letter}</Text>
                <View style={vb.letterLine} />
              </View>
              {words.map((word) => (
                <Pressable
                  key={word.external_id}
                  onPress={() => router.push(`/practice/vocabulary/${word.external_id}` as never)}
                  style={[vb.card, vb.rowCard]}
                  accessibilityRole="button"
                  accessibilityLabel={`${word.word}, ${word.translation}`}
                >
                  <View style={vb.avatar}><Text style={vb.avatarText}>{word.word.charAt(0).toUpperCase()}</Text></View>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={vb.word} numberOfLines={1}>{word.word}</Text>
                      {word.has_audio ? <Text style={{ fontSize: 12 }}>🔊</Text> : null}
                    </View>
                    <Text style={vb.tr} numberOfLines={1}>{word.translation}</Text>
                    <Text style={vb.meta}>{word.part_of_speech}</Text>
                  </View>
                  <StatusChip word={word} />
                  {word.status !== 'completed' ? <View style={vb.cefr}><Text style={vb.cefrText}>{word.cefr_level}</Text></View> : null}
                  <Text style={vb.chevron}>›</Text>
                </Pressable>
              ))}
            </View>
          ))}
          {bank.hasNextPage ? (
            <Pressable onPress={() => bank.fetchNextPage()} disabled={bank.isFetchingNextPage} style={[vb.card, vb.moreBtn]} accessibilityRole="button">
              {bank.isFetchingNextPage ? <ActivityIndicator color="#FFD84A" /> : <Text style={vb.moreText}>{t('practice.bank_load_more')}</Text>}
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
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "900" },
  heroSub: { color: "rgba(255,255,255,0.75)", fontSize: 12.5, fontWeight: "600", lineHeight: 17 },

  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "900" },

  card: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 18,
  },
  rowCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  word: { color: "#fff", fontSize: 16, fontWeight: "800" },
  tr: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },
  meta: { color: "rgba(255,255,255,0.55)", fontSize: 11.5, fontWeight: "700", textTransform: "capitalize" },

  done: {
    width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(46,236,200,0.18)", borderWidth: 1, borderColor: "#2EECC8",
  },
  doneText: { color: "#2EECC8", fontSize: 14, fontWeight: "900" },
  step: { backgroundColor: "rgba(255,216,74,0.16)", borderWidth: 1, borderColor: "rgba(255,216,74,0.4)", borderRadius: 9, paddingHorizontal: 7, paddingVertical: 3 },
  stepText: { color: "#FFD84A", fontSize: 11, fontWeight: "900" },

  pbarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pbar: { flex: 1, height: 6, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.18)", overflow: "hidden" },
  pbarFill: { height: "100%", borderRadius: 4 },
  pbarLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "800" },
  playBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  playBtnText: { color: "#fff", fontSize: 17, marginLeft: 2 },

  newCard: {
    width: 148, backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 18, padding: 14, gap: 4,
  },
  newBadge: { alignSelf: "flex-start", backgroundColor: "#FFD84A", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 6 },
  newBadgeText: { color: "#3D0A1A", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  newWord: { color: "#fff", fontSize: 17, fontWeight: "900" },
  newTr: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },
  newMeta: { color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "700", marginTop: 4 },

  search: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  searchInput: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "700", paddingVertical: 4 },
  clear: { color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: "800" },

  levelRow: { flexDirection: "row", gap: 8 },
  levelChipWrap: { flex: 1, borderRadius: 12, overflow: "hidden" },
  levelChip: { alignItems: "center", paddingVertical: 9, borderRadius: 12 },
  levelChipText: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "900" },
  levelChipTextActive: { color: "#3D0A1A" },

  listLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  letterRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 },
  letter: { color: "#FFD84A", fontSize: 15, fontWeight: "900", width: 14 },
  letterLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.14)" },
  avatar: {
    width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,216,74,0.16)", borderWidth: 1, borderColor: "rgba(255,216,74,0.35)",
  },
  avatarText: { color: "#FFD84A", fontSize: 17, fontWeight: "900" },
  cefr: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 9, paddingHorizontal: 8, paddingVertical: 3 },
  cefrText: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "900" },
  chevron: { color: "rgba(255,255,255,0.45)", fontSize: 22, fontWeight: "900", marginTop: -2 },
  moreBtn: { alignItems: "center", paddingVertical: 13, borderRadius: 14, borderStyle: "dashed" },
  moreText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  emptyText: { color: "rgba(255,255,255,0.8)", fontSize: 14, textAlign: "center", lineHeight: 20 },
  link: { color: "#FFD84A", fontWeight: "800", fontSize: 14 },
});
