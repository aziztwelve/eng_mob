import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useVocabularyBankPages } from '@/hooks/use-vocabulary-bank';
import {
  IconArrowRight,
  IconBookOpen,
  IconSearch,
  IconVolume,
  IconX,
} from '@/components/ui/icons';

const GOLD = ["#FFDF5E", "#FFB338"] as const;
const MINT = '#2EECC8';

const glass = {
  backgroundColor: "rgba(255,255,255,0.10)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.16)",
} as const;

const LEVELS = ["A1", "A2", "B1", "B2", "C1"] as const;
const TOTAL_STEPS = 15;

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

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const entries = useMemo(
    () => (bank.data?.pages ?? []).flatMap((page) => page.entries ?? []),
    [bank.data],
  );
  const total = bank.data?.pages?.[0]?.total ?? 0;

  return (
    <View style={{ marginTop: 16, gap: 14 }}>
      {/* compact header: count inline, no big hero tile */}
      <View style={vb.headRow}>
        <IconBookOpen size={16} color="#FFD84A" />
        <Text style={vb.headTitle}>{t('practice.bank_title')}</Text>
        <View style={vb.headCount}><Text style={vb.headCountText}>{total}</Text></View>
      </View>

      {/* search + levels: primary tools right at the top */}
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

      {/* word list: one clean dictionary sheet — no per-row boxes */}
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
        <View style={vb.sheet}>
          <Text style={vb.sheetLabel}>{t('practice.bank_count', { count: total })}</Text>
          {entries.map((word, i) => (
            <Pressable
              key={word.external_id}
              onPress={() => router.push(`/practice/vocabulary/${word.external_id}` as never)}
              style={({ pressed }) => [vb.sheetRow, i < entries.length - 1 && vb.sheetRowDiv, pressed && vb.rowPressed, word.status === 'completed' && vb.rowDone]}
              accessibilityRole="button"
              accessibilityLabel={`${word.word}, ${word.translation}`}
            >
              <View style={[vb.dot, word.status === 'completed' ? vb.dotDone : word.status === 'in_progress' ? vb.dotProg : vb.dotNew]} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Text style={vb.word} numberOfLines={1}>{word.word}</Text>
                  <Text style={vb.trInline} numberOfLines={1}>{word.translation}</Text>
                </View>
                {word.status === 'in_progress' ? (
                  <Text style={vb.progNote}>{word.current_step ?? 1}/{TOTAL_STEPS}</Text>
                ) : null}
              </View>
              {word.has_audio ? <IconVolume size={13} color="rgba(255,255,255,0.3)" /> : null}
            </Pressable>
          ))}
          {bank.hasNextPage ? (
            <Pressable onPress={() => bank.fetchNextPage()} disabled={bank.isFetchingNextPage} style={vb.moreBtn} accessibilityRole="button">
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
  headRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  headTitle: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 0.2, flex: 1 },
  headCount: { backgroundColor: "rgba(255,216,74,0.14)", borderWidth: 1, borderColor: "rgba(255,216,74,0.35)", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  headCountText: { color: "#FFD84A", fontSize: 12, fontWeight: "900" },

  sectionRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "900", letterSpacing: 0.4, textTransform: "uppercase" },

  card: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 16,
  },
  rowCard: { flexDirection: "row", alignItems: "center", gap: 11, padding: 11 },

  search: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.10)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" },
  searchInput: { flex: 1, color: "#fff", fontSize: 14, fontWeight: "600", paddingVertical: 10 },
  clearBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },

  levelRow: { flexDirection: "row", gap: 7 },
  levelChipWrap: { flex: 1, borderRadius: 11, overflow: "hidden" },
  levelChip: { alignItems: "center", paddingVertical: 8, borderRadius: 11 },
  levelChipText: { color: "rgba(255,255,255,0.7)", fontSize: 12.5, fontWeight: "900" },
  levelChipTextActive: { color: "#3D0A1A" },

  /* dictionary sheet: one clean surface, airy rows, word is the hero */
  sheet: {
    backgroundColor: "rgba(20,6,34,0.35)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 18, paddingHorizontal: 16, paddingVertical: 6,
  },
  sheetLabel: { color: "rgba(255,255,255,0.45)", fontSize: 10.5, fontWeight: "900", letterSpacing: 1.2, marginHorizontal: 2, marginBottom: 2 },
  sheetRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 16, borderRadius: 10,
  },
  sheetRowDiv: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  rowPressed: { backgroundColor: "rgba(255,255,255,0.08)", marginHorizontal: -8, paddingHorizontal: 8 },
  rowDone: { opacity: 0.55 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotDone: { backgroundColor: MINT },
  dotProg: { backgroundColor: "#FFD84A" },
  dotNew: { backgroundColor: "rgba(255,255,255,0.22)" },
  word: { color: "#fff", fontSize: 16.5, fontWeight: "900", letterSpacing: 0.2 },
  trInline: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "600", flexShrink: 1 },
  progNote: { color: "#FFD84A", fontSize: 11, fontWeight: "800", marginTop: 2 },
  moreBtn: { alignItems: "center", paddingVertical: 12, marginTop: 2 },
  moreText: { color: "#fff", fontWeight: "800", fontSize: 13.5 },
  emptyText: { color: "rgba(255,255,255,0.7)", fontSize: 13.5, textAlign: "center", lineHeight: 19 },
  link: { color: "#FFD84A", fontWeight: "800", fontSize: 14 },
});
