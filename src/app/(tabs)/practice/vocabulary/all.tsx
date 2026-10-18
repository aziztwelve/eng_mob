import { KeyboardLift } from '@/components/keyboard-lift';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useVocabularyBankPages } from '@/hooks/use-vocabulary-bank';
import { IconBookOpen, IconCheck, IconChevronRight, IconSearch, IconX } from '@/components/ui/icons';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
const STATUS_FILTERS = ['all', 'new', 'in_progress', 'completed'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
const GOLD = ['#FFDF5E', '#FF9E37'] as const;
const TOTAL_STEPS = 15;
const SUNSET = ['#2E0A4A', '#6A1252', '#A8243F', '#C9521F'] as const;
const SUNSET_LOC = [0, 0.38, 0.7, 0.96] as const;

function initialLevel(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  return LEVELS.includes(candidate as (typeof LEVELS)[number]) ? (candidate as string) : 'A1';
}

function clampStep(step?: number) {
  return Math.max(0, Math.min(step ?? 0, TOTAL_STEPS));
}

export default function VocabularyBankAllWordsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ level?: string }>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [level, setLevel] = useState<string>(() => initialLevel(params.level));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const locale = (i18n.resolvedLanguage ?? 'ru').slice(0, 2).toLowerCase();

  useEffect(() => {
    setLevel(initialLevel(params.level));
  }, [params.level]);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filters = useMemo(() => ({ cefr_level: level, locale, ...(query ? { search: query } : {}) }), [level, locale, query]);
  const bank = useVocabularyBankPages(filters);
  const words = useMemo(() => (bank.data?.pages ?? []).flatMap((page) => page.entries ?? []), [bank.data]);
  const visible = useMemo(
    () => (statusFilter === 'all' ? words : words.filter((word) => word.status === statusFilter)),
    [words, statusFilter],
  );
  const total = bank.data?.pages?.[0]?.total ?? 0;

  return (
    <LinearGradient colors={SUNSET} locations={SUNSET_LOC} style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      <KeyboardLift>
<ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: tabBarHeight + insets.bottom + 28 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.titleRow}>
          <Pressable onPress={() => router.back()} style={s.backButton} accessibilityRole="button" accessibilityLabel={t('practice.bank_back')}>
            <View style={s.backIcon}><IconChevronRight size={20} color="#FFE166" /></View>
          </Pressable>
          <View style={s.titleCopy}>
            <Text style={s.title}>{t('practice.bank_all_words')}</Text>
            <Text style={s.subtitle}>{level} · {t('practice.bank_count', { count: total })}</Text>
          </View>
          <View style={s.titleBadge}><IconBookOpen size={16} color="#FFE166" /></View>
        </View>

        <View style={s.levelRow} accessibilityRole="tablist">
          {LEVELS.map((item) => {
            const active = level === item;
            return (
              <Pressable key={item} onPress={() => setLevel(item)} style={s.levelWrap} accessibilityRole="tab" accessibilityState={{ selected: active }}>
                {active ? <LinearGradient colors={GOLD as unknown as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.levelChip}><Text style={[s.levelText, s.levelTextActive]}>{item}</Text></LinearGradient>
                  : <View style={s.levelChip}><Text style={s.levelText}>{item}</Text></View>}
              </Pressable>
            );
          })}
        </View>

        <View style={s.search}>
          <IconSearch size={17} color="rgba(255,255,255,0.60)" />
          <TextInput value={search} onChangeText={setSearch} placeholder={t('practice.bank_search')} placeholderTextColor="rgba(255,255,255,0.45)" style={s.searchInput} accessibilityLabel={t('practice.bank_search')} returnKeyType="search" />
          {search ? <Pressable onPress={() => setSearch('')} hitSlop={10} style={s.clear} accessibilityLabel={t('practice.bank_clear')}><IconX size={14} color="rgba(255,255,255,0.75)" /></Pressable> : null}
        </View>

        <View style={s.statusRow} accessibilityRole="tablist">
          {STATUS_FILTERS.map((item) => {
            const active = statusFilter === item;
            const label = item === 'all' ? t('practice.bank_filter_all')
              : item === 'new' ? t('practice.bank_filter_new')
                : item === 'in_progress' ? t('practice.bank_filter_learning')
                  : t('practice.bank_filter_known');
            return (
              <Pressable key={item} onPress={() => setStatusFilter(item)} style={s.statusWrap} accessibilityRole="tab" accessibilityState={{ selected: active }}>
                {active ? <LinearGradient colors={GOLD as unknown as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.statusChip}><Text style={[s.statusText, s.statusTextActive]}>{label}</Text></LinearGradient>
                  : <View style={s.statusChip}><Text style={s.statusText}>{label}</Text></View>}
              </Pressable>
            );
          })}
        </View>

        <View style={s.listHead}>
          <Text style={s.listTitle}>{t('practice.bank_all_words')}</Text>
          <Text style={s.listCount}>{statusFilter === 'all' ? total : visible.length}</Text>
        </View>

        {bank.isLoading ? <ActivityIndicator color="#FFD84A" style={s.loader} /> : bank.isError ? (
          <View style={s.messageCard}><Text style={s.message}>{t('practice.bank_error')}</Text><Pressable onPress={() => bank.refetch()}><Text style={s.retry}>{t('practice.bank_retry')}</Text></Pressable></View>
        ) : visible.length === 0 ? (
          <View style={s.messageCard}><IconBookOpen size={28} color="rgba(255,255,255,0.42)" /><Text style={s.message}>{query ? t('practice.bank_empty_search') : t('practice.bank_empty_level')}</Text></View>
        ) : (
          <View style={s.list}>
            {visible.map((word) => {
              const step = word.status === 'completed' ? TOTAL_STEPS : clampStep(word.current_step);
              const completed = word.status === 'completed' || step === TOTAL_STEPS;
              const width = `${Math.round((step / TOTAL_STEPS) * 100)}%` as `${number}%`;
              return (
                <Pressable key={word.external_id} onPress={() => router.push(`/practice/vocabulary/${word.external_id}` as never)} style={({ pressed }) => [s.wordHit, pressed && s.wordHitPressed]} accessibilityRole="button" accessibilityLabel={`${word.word}, ${word.translation}`}>
                  <View style={s.wordCard}>
                    <View style={s.wordRow}>
                      <View style={s.wordCopy}>
                        <View style={s.wordTop}><Text style={s.word} numberOfLines={1}>{word.word.toUpperCase()}</Text><Text style={s.wordLevel}>{word.cefr_level}</Text></View>
                        <Text style={s.partOfSpeech} numberOfLines={1}>{word.part_of_speech}</Text>
                        <Text style={s.translation} numberOfLines={1}>{word.translation}</Text>
                      </View>
                      <View style={s.progress}>
                        <View style={s.progressTrack}><LinearGradient colors={GOLD as unknown as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.progressFill, { width }]} /></View>
                        <Text style={[s.progressValue, completed && s.progressDone]}>{step}/{TOTAL_STEPS}</Text>
                      </View>
                      {completed ? <IconCheck size={17} color="#7FE0A4" /> : <IconChevronRight size={19} color="rgba(255,226,99,0.90)" />}
                    </View>
                  </View>
                </Pressable>
              );
            })}
            {bank.hasNextPage ? <Pressable onPress={() => bank.fetchNextPage()} disabled={bank.isFetchingNextPage} style={s.more} accessibilityRole="button">{bank.isFetchingNextPage ? <ActivityIndicator color="#FFD84A" /> : <Text style={s.moreText}>{t('practice.bank_load_more')}</Text>}</Pressable> : null}
          </View>
        )}
      </ScrollView>
</KeyboardLift>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(65, 11, 71, 0.84)', borderWidth: 1, borderColor: 'rgba(255, 224, 104, 0.38)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { transform: [{ rotate: '180deg' }] },
  titleCopy: { flex: 1, minWidth: 0 },
  title: { color: '#fff', fontSize: 23, lineHeight: 28, fontWeight: '900' },
  subtitle: { color: 'rgba(238,218,247,0.72)', fontSize: 11, fontWeight: '800', marginTop: 1 },
  titleBadge: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255, 226, 99, 0.13)', borderWidth: 1, borderColor: 'rgba(255, 224, 104, 0.30)', alignItems: 'center', justifyContent: 'center' },
  levelRow: { flexDirection: 'row', gap: 7 },
  levelWrap: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  levelChip: { height: 43, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)' },
  levelText: { color: 'rgba(255,255,255,0.76)', fontSize: 12.5, fontWeight: '900' },
  levelTextActive: { color: '#42112C' },
  search: { height: 48, paddingHorizontal: 14, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', flexDirection: 'row', alignItems: 'center', gap: 9 },
  searchInput: { color: '#fff', flex: 1, fontSize: 14, fontWeight: '700', paddingVertical: 0 },
  clear: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' },
  statusRow: { flexDirection: 'row', gap: 6 },
  statusWrap: { flex: 1, borderRadius: 11, overflow: 'hidden' },
  statusChip: { height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  statusText: { color: 'rgba(255,255,255,0.72)', fontSize: 11.5, fontWeight: '900' },
  statusTextActive: { color: '#42112C' },
  listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  listTitle: { color: '#fff', fontSize: 17, fontWeight: '900' },
  listCount: { color: '#FFE166', fontSize: 12, fontWeight: '900', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9, backgroundColor: 'rgba(255,226,99,0.13)' },
  list: { gap: 10 },
  wordHit: { borderRadius: 22 },
  wordHitPressed: { opacity: 0.86 },
  wordCard: { minHeight: 84, paddingHorizontal: 17, paddingVertical: 12, borderRadius: 22, backgroundColor: 'rgba(65, 11, 71, 0.84)', borderWidth: 1, borderColor: 'rgba(255, 224, 104, 0.38)', shadowColor: '#22062F', shadowOpacity: 0.28, shadowRadius: 8, elevation: 3 },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  wordCopy: { flex: 1, minWidth: 0, gap: 2 },
  wordTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  word: { color: '#fff', fontSize: 15.5, fontWeight: '900', letterSpacing: 0.2, flexShrink: 1 },
  wordLevel: { color: '#FFE166', fontSize: 10, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255,226,99,0.12)' },
  partOfSpeech: { color: 'rgba(238,218,247,0.76)', fontSize: 10.5, lineHeight: 13, fontWeight: '600' },
  translation: { color: 'rgba(255,225,99,0.94)', fontSize: 11.5, lineHeight: 14, fontWeight: '800' },
  progress: { width: 65, gap: 5, alignItems: 'stretch', paddingLeft: 11, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: 'rgba(255,255,255,0.20)' },
  progressTrack: { height: 5, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(42, 13, 66, 0.92)' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressValue: { color: 'rgba(238,218,247,0.76)', fontSize: 9.5, fontWeight: '900', textAlign: 'center' },
  progressDone: { color: '#7FE0A4' },
  loader: { marginVertical: 44 },
  messageCard: { minHeight: 120, padding: 20, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: 'rgba(65, 11, 71, 0.84)', borderWidth: 1, borderColor: 'rgba(255, 224, 104, 0.38)' },
  message: { color: 'rgba(255,255,255,0.78)', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  retry: { color: '#FFE166', fontSize: 14, fontWeight: '900' },
  more: { minHeight: 48, borderRadius: 16, backgroundColor: 'rgba(65, 11, 71, 0.84)', borderWidth: 1, borderColor: 'rgba(255, 224, 104, 0.38)', alignItems: 'center', justifyContent: 'center' },
  moreText: { color: '#FFE166', fontSize: 13, fontWeight: '900' },
});
