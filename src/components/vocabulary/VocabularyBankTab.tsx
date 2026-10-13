import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { useVocabularyBankFeed, useVocabularyBankPages, useVocabularyBankWord } from '@/hooks/use-vocabulary-bank';
import {
  IconBookOpen,
  IconCalendar,
  IconCheck,
  IconChevronRight,
  IconPlay,
  IconSearch,
  IconVolume,
  IconX,
} from '@/components/ui/icons';

const GOLD = ['#FFDF5E', '#FF9E37'] as const;
const TOTAL_STEPS = 15;
const CIRCLE_SIZE = 94;
const CIRCLE_STROKE = 8;
const CIRCLE_RADIUS = (CIRCLE_SIZE - CIRCLE_STROKE) / 2;
const CIRCLE_LENGTH = 2 * Math.PI * CIRCLE_RADIUS;

const glass = {
  backgroundColor: 'rgba(255,255,255,0.10)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.16)',
} as const;

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

// The compact feed has no definition or transcription. The current-word query
// supplies the real definition; these keep the canonical starter words complete.
const WORD_EXTRAS: Record<string, { meaning: string; transcription?: string }> = {
  ACTRESS: { meaning: 'a female actor', transcription: '[ˈæktrəs]' },
  AIR: { meaning: 'a mixture of gases' },
  ACTOR: { meaning: 'a theatrical performer' },
  ADULT: { meaning: 'a fully developed person' },
  AFTER: { meaning: 'the part of the day between…' },
};

function clampStep(step?: number) {
  return Math.max(0, Math.min(step ?? 0, TOTAL_STEPS));
}

function partOfSpeechLabel(partOfSpeech: string, locale: string) {
  const normalized = partOfSpeech.trim().toLowerCase();
  const labels: Record<string, Record<string, string>> = {
    noun: { ru: 'Существительное', en: 'Noun', kk: 'Зат есім' },
    verb: { ru: 'Глагол', en: 'Verb', kk: 'Етістік' },
    adjective: { ru: 'Прилагательное', en: 'Adjective', kk: 'Сын есім' },
    adverb: { ru: 'Наречие', en: 'Adverb', kk: 'Үстеу' },
    preposition: { ru: 'Предлог', en: 'Preposition', kk: 'Шылау' },
  };
  return labels[normalized]?.[locale] ?? partOfSpeech;
}

type ContinuationItem = {
  word: {
    external_id: string;
    word: string;
    translation: string;
    part_of_speech: string;
    cefr_level: string;
    status?: string;
    current_step?: number;
  };
  current_step: number;
};

function ProgressCircle({ step }: { step: number }) {
  const progress = clampStep(step) / TOTAL_STEPS;
  const offset = CIRCLE_LENGTH * (1 - progress);

  return (
    <View style={vb.circleWrap} accessibilityLabel={`${step}/${TOTAL_STEPS}`}>
      <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}>
        <Defs>
          <SvgLinearGradient id="current-word-progress" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFEC6A" />
            <Stop offset="1" stopColor="#FF9138" />
          </SvgLinearGradient>
        </Defs>
        <Circle cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={CIRCLE_RADIUS} stroke="rgba(51, 17, 74, 0.75)" strokeWidth={CIRCLE_STROKE} fill="rgba(25, 7, 43, 0.28)" />
        <Circle
          cx={CIRCLE_SIZE / 2}
          cy={CIRCLE_SIZE / 2}
          r={CIRCLE_RADIUS}
          stroke="url(#current-word-progress)"
          strokeWidth={CIRCLE_STROKE}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={`${CIRCLE_LENGTH} ${CIRCLE_LENGTH}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
        />
      </Svg>
      <View style={vb.circleLabel} pointerEvents="none">
        <Text style={vb.circleValue}>{step}</Text>
        <Text style={vb.circleTotal}>/ {TOTAL_STEPS}</Text>
      </View>
    </View>
  );
}

function StepDots({ step }: { step: number }) {
  return (
    <View style={vb.dots} accessibilityElementsHidden>
      {Array.from({ length: TOTAL_STEPS }, (_, index) => {
        const number = index + 1;
        return <View key={number} style={[vb.dot, number < step && vb.dotDone, number === step && step > 0 && vb.dotCurrent]} />;
      })}
    </View>
  );
}

export default function VocabularyBankTab() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('A1');
  const locale = (i18n.resolvedLanguage ?? 'ru').slice(0, 2).toLowerCase();
  const filters = useMemo(() => ({ cefr_level: level, locale, ...(query ? { search: query } : {}) }), [level, locale, query]);
  const bank = useVocabularyBankPages(filters);
  const feed = useVocabularyBankFeed({ cefr_level: level, locale, new_limit: 5, in_progress_limit: 5 });

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const entries = useMemo(() => (bank.data?.pages ?? []).flatMap((page) => page.entries ?? []), [bank.data]);
  const total = bank.data?.pages?.[0]?.total ?? 0;
  const inProgress = feed.data?.in_progress ?? [];
  const newWords = feed.data?.new_words ?? [];

  const continuation = useMemo<ContinuationItem[]>(() => {
    const candidates: ContinuationItem[] = [
      ...inProgress.map((entry) => ({ word: entry.word, current_step: entry.current_step })),
      ...newWords.map((entry) => ({ word: entry.word, current_step: entry.current_step })),
      ...entries.map((word) => ({ word, current_step: word.status === 'completed' ? TOTAL_STEPS : word.current_step ?? 0 })),
    ];
    const seen = new Set<string>();
    return candidates.filter((entry) => {
      if (seen.has(entry.word.external_id)) return false;
      seen.add(entry.word.external_id);
      return true;
    }).slice(0, 5);
  }, [entries, inProgress, newWords]);

  const current = continuation[0];
  const currentDetail = useVocabularyBankWord(current?.word.external_id ?? '', locale);
  const currentStep = clampStep(current?.current_step);
  const extras = current ? WORD_EXTRAS[current.word.word.toUpperCase()] : undefined;
  const meaning = currentDetail.data?.entry?.meaning || extras?.meaning || current?.word.part_of_speech || '';

  const speak = () => {
    if (current?.word.word) Speech.speak(current.word.word, { language: 'en-US', rate: 0.85 });
  };

  return (
    <View style={vb.root}>
      <View style={vb.headRow}>
        <IconBookOpen size={16} color="#FFD84A" />
        <Text style={vb.headTitle}>{t('practice.bank_title')}</Text>
        <View style={vb.headCount}><Text style={vb.headCountText}>{total}</Text></View>
      </View>

      <View style={[vb.search, glass]}>
        <IconSearch size={16} color="rgba(255,255,255,0.6)" />
        <TextInput value={search} onChangeText={setSearch} placeholder={t('practice.bank_search')} placeholderTextColor="rgba(255,255,255,0.45)" style={vb.searchInput} accessibilityLabel={t('practice.bank_search')} returnKeyType="search" />
        {search.length > 0 ? <Pressable onPress={() => setSearch('')} hitSlop={10} accessibilityLabel={t('practice.bank_clear')} style={vb.clearBtn}><IconX size={14} color="rgba(255,255,255,0.7)" /></Pressable> : null}
      </View>

      <View style={vb.levelRow}>
        {LEVELS.map((item) => {
          const active = level === item;
          return (
            <Pressable key={item} onPress={() => setLevel(item)} style={vb.levelChipWrap} accessibilityRole="button" accessibilityState={{ selected: active }}>
              {active ? <LinearGradient colors={GOLD as unknown as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={vb.levelChip}><Text style={[vb.levelChipText, vb.levelChipTextActive]}>{item}</Text></LinearGradient>
                : <View style={[vb.levelChip, glass]}><Text style={vb.levelChipText}>{item}</Text></View>}
            </Pressable>
          );
        })}
      </View>

      {feed.isLoading && continuation.length === 0 ? <ActivityIndicator color="#FFD84A" style={{ marginVertical: 28 }} /> : null}

      {current ? (
        <View style={vb.hero}>
          <View style={vb.heroTop}>
            <View style={vb.currentBadge}><Text style={vb.currentBadgeText}>{t('practice.bank_current_word')}</Text></View>
            <Text style={vb.wordMeta}>{current.word.cefr_level} · {partOfSpeechLabel(current.word.part_of_speech, locale)}</Text>
          </View>
          <View style={vb.heroMain}>
            <View style={vb.wordBlock}>
              <View style={vb.wordRow}>
                <Text style={vb.heroWord}>{current.word.word.toUpperCase()}</Text>
                <Pressable onPress={speak} style={vb.speak} accessibilityRole="button" accessibilityLabel={t('practice.bank_listen')}><IconVolume size={19} color="#FFE166" /></Pressable>
              </View>
              {extras?.transcription ? <Text style={vb.transcription}>{extras.transcription}</Text> : null}
              <Text style={vb.meaning} numberOfLines={2}>{meaning}</Text>
              <Text style={vb.translation}>{current.word.translation}</Text>
            </View>
            <ProgressCircle step={currentStep} />
          </View>
          <StepDots step={currentStep} />
          <View style={vb.heroFooter}>
            <View style={vb.reviewInfo}>
              <View style={vb.calendar}><IconCalendar size={17} color="#FFE166" /></View>
              <View><Text style={vb.reviewLabel}>{t('practice.bank_next_review')}</Text><Text style={vb.reviewToday}>{t('practice.bank_today')}</Text></View>
            </View>
            <Pressable onPress={() => router.push(`/practice/vocabulary/${current.word.external_id}/learn` as never)} accessibilityRole="button" accessibilityLabel={t('practice.bank_repeat_now')}>
              <LinearGradient colors={GOLD as unknown as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={vb.repeatButton}><IconPlay size={12} color="#451127" /><Text style={vb.repeatText}>{t('practice.bank_repeat_now')}</Text></LinearGradient>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={vb.continueSection}>
        <View style={vb.continueHead}>
          <Text style={vb.continueTitle}>{t('practice.bank_continue')}</Text>
          <Pressable onPress={() => router.push(`/practice/vocabulary/all?level=${level}` as never)} accessibilityRole="button" accessibilityLabel={t('practice.bank_all_words')}><Text style={vb.allWords}>{t('practice.bank_all_words')} ›</Text></Pressable>
        </View>
        <View style={vb.continueList}>
          {continuation.map((entry) => {
            const description = WORD_EXTRAS[entry.word.word.toUpperCase()]?.meaning || entry.word.part_of_speech;
            const step = clampStep(entry.current_step);
            const completed = step === TOTAL_STEPS || entry.word.status === 'completed';
            const progressWidth = `${Math.round((step / TOTAL_STEPS) * 100)}%` as `${number}%`;
            return (
              <Pressable
                key={entry.word.external_id}
                onPress={() => router.push(`/practice/vocabulary/${entry.word.external_id}/learn` as never)}
                style={({ pressed }) => [vb.continueCardHit, pressed && vb.continueCardPressed]}
                accessibilityRole="button"
                accessibilityLabel={`${entry.word.word}, ${entry.word.translation}`}
              >
                <View style={vb.continueCard}>
                  <View style={vb.listRow}>
                    <View style={vb.continueCopy}>
                      <View style={vb.continueTopLine}>
                        <Text style={vb.continueWord} numberOfLines={1}>{entry.word.word.toUpperCase()}</Text>
                        <Text style={vb.continueLevel}>{entry.word.cefr_level}</Text>
                      </View>
                      <Text style={vb.continueMeaning} numberOfLines={1}>{description}</Text>
                      <Text style={vb.continueTranslation} numberOfLines={1}>{entry.word.translation}</Text>
                    </View>
                    <View style={vb.continueProgress}>
                      <View style={vb.progressTrack}>
                        <LinearGradient colors={GOLD as unknown as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[vb.progressFill, { width: progressWidth }]} />
                      </View>
                      <Text style={[vb.progressValue, completed && vb.progressValueDone]}>{step}/{TOTAL_STEPS}</Text>
                    </View>
                    {completed ? <IconCheck size={17} color="#7FE0A4" /> : <IconChevronRight size={19} color="rgba(255,226,99,0.85)" />}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

    </View>
  );
}

const vb = StyleSheet.create({
  root: { marginTop: 16, gap: 14 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.2, flex: 1 },
  headCount: { backgroundColor: 'rgba(255,216,74,0.14)', borderWidth: 1, borderColor: 'rgba(255,216,74,0.35)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  headCountText: { color: '#FFD84A', fontSize: 12, fontWeight: '900' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 14 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600', paddingVertical: 10 },
  clearBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  levelRow: { flexDirection: 'row', gap: 7 }, levelChipWrap: { flex: 1, borderRadius: 11, overflow: 'hidden' }, levelChip: { alignItems: 'center', paddingVertical: 8, borderRadius: 11 }, levelChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 12.5, fontWeight: '900' }, levelChipTextActive: { color: '#42112C' },
  hero: { borderRadius: 24, padding: 17, gap: 13, backgroundColor: 'rgba(65, 11, 71, 0.84)', borderWidth: 1, borderColor: 'rgba(255, 224, 104, 0.38)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 9 }, currentBadge: { backgroundColor: 'rgba(255, 226, 99, 0.18)', borderWidth: 1, borderColor: 'rgba(255, 231, 117, 0.45)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }, currentBadgeText: { color: '#FFE166', fontSize: 10.5, fontWeight: '900', letterSpacing: 0.2 }, wordMeta: { color: 'rgba(255,255,255,0.78)', fontSize: 10.5, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
  heroMain: { flexDirection: 'row', alignItems: 'center', gap: 10 }, wordBlock: { flex: 1, minWidth: 0, gap: 2 }, wordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, heroWord: { color: '#fff', fontSize: 27, lineHeight: 33, fontWeight: '900', letterSpacing: 0.5, flexShrink: 1 }, speak: { width: 33, height: 33, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 224, 95, 0.14)', borderWidth: 1, borderColor: 'rgba(255, 224, 95, 0.36)' }, transcription: { color: 'rgba(255,255,255,0.58)', fontSize: 11.5, fontWeight: '700' }, meaning: { color: 'rgba(255,255,255,0.9)', fontSize: 12.5, fontWeight: '700', marginTop: 3 }, translation: { color: '#FFE166', fontSize: 14.5, fontWeight: '900', marginTop: 1 },
  circleWrap: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center', shadowColor: '#FFB338', shadowOpacity: 0.34, shadowRadius: 11, elevation: 4, transform: [{ scale: 88 / CIRCLE_SIZE }] }, circleLabel: { position: 'absolute', flexDirection: 'row', alignItems: 'baseline' }, circleValue: { color: '#fff', fontSize: 22, fontWeight: '900' }, circleTotal: { color: 'rgba(255,255,255,0.62)', fontSize: 11.5, fontWeight: '800' },
  dots: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 }, dot: { flex: 1, maxWidth: 12, height: 5, borderRadius: 4, backgroundColor: 'rgba(75, 31, 104, 0.72)' }, dotDone: { backgroundColor: '#FFE166' }, dotCurrent: { height: 7, marginTop: -1, backgroundColor: '#FFB338', shadowColor: '#FFB338', shadowOpacity: 1, shadowRadius: 7, elevation: 4 },
  heroFooter: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.18)', paddingTop: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 }, reviewInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }, calendar: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,224,95,0.12)' }, reviewLabel: { color: 'rgba(255,255,255,0.64)', fontSize: 10.5, fontWeight: '700' }, reviewToday: { color: '#fff', fontSize: 12.5, fontWeight: '900', marginTop: 1 }, repeatButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 11, shadowColor: '#FFB338', shadowOpacity: 0.44, shadowRadius: 10, elevation: 5 }, repeatText: { color: '#42112C', fontSize: 12, fontWeight: '900' },
  continueSection: { gap: 10 }, continueHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, continueTitle: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.1 }, allWords: { color: '#FFE166', fontSize: 11.5, fontWeight: '900' },
  continueList: { gap: 10 },
  continueCardHit: { borderRadius: 22 }, continueCard: { minHeight: 84, paddingHorizontal: 17, paddingVertical: 12, borderRadius: 22, backgroundColor: 'rgba(65, 11, 71, 0.84)', borderWidth: 1, borderColor: 'rgba(255, 224, 104, 0.38)', shadowColor: '#22062F', shadowOpacity: 0.28, shadowRadius: 8, elevation: 3 }, continueCardPressed: { opacity: 0.86 },
  listRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 11 }, continueCopy: { flex: 1, minWidth: 0, gap: 2 }, continueTopLine: { flexDirection: 'row', alignItems: 'center', gap: 8 }, continueWord: { color: '#fff', fontSize: 15.5, fontWeight: '900', letterSpacing: 0.2, flexShrink: 1 }, continueLevel: { color: '#FFE166', fontSize: 10, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: 'rgba(255,226,99,0.12)' }, continueMeaning: { color: 'rgba(238,218,247,0.76)', fontSize: 10.5, lineHeight: 13, fontWeight: '600' }, continueTranslation: { color: 'rgba(255,225,99,0.94)', fontSize: 11.5, lineHeight: 14, fontWeight: '800' }, continueProgress: { width: 65, gap: 5, alignItems: 'stretch', paddingLeft: 11, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: 'rgba(255,255,255,0.20)' }, progressTrack: { height: 5, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(42, 13, 66, 0.92)' }, progressFill: { height: '100%', minWidth: 0, borderRadius: 4 }, progressValue: { color: 'rgba(238,218,247,0.76)', fontSize: 9.5, fontWeight: '900', textAlign: 'center' }, progressValueDone: { color: '#7FE0A4' },
  listWord: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.15 }, listDescription: { flex: 1, minWidth: 0, color: 'rgba(238,218,247,0.78)', fontSize: 12, fontWeight: '600' }, listSeparator: { color: 'rgba(255,225,99,0.76)' },
  allSection: { gap: 10, marginTop: 4 }, allTitle: { color: '#fff', fontSize: 16, fontWeight: '900' }, allList: { gap: 8 }, allCard: { minHeight: 64, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', flexDirection: 'row', alignItems: 'center', gap: 10 }, card: { backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', borderRadius: 18 }, moreBtn: { alignItems: 'center', paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' }, moreText: { color: '#fff', fontWeight: '800', fontSize: 13.5 }, emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 13.5, textAlign: 'center', lineHeight: 19 }, link: { color: '#FFD84A', fontWeight: '800', fontSize: 14 },
});
