import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Search, Play } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useFlashcards, useFlashcardStats, useSeedStarter } from '@/hooks/use-flashcards';
import { AddFlashcardSheet } from '@/components/flashcards/AddFlashcardSheet';
import { SuggestionsWidget } from '@/components/flashcards/SuggestionsWidget';
import { GoalRing } from '@/components/flashcards/GoalRing';
import type { Flashcard } from '@/types/api';

const CTA = ['#A8243F', '#CC5A1F'] as const;
const GOLD = ['#FFDF5E', '#FFB338'] as const;
const glass = {
  backgroundColor: 'rgba(255,255,255,0.14)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.22)',
} as const;

function wordUnitKey(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'fc.word_1';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'fc.word_2';
  return 'fc.word_5';
}

/**
 * /flashcards — хаб «Флешкарты» (повторение слов). Дизайн Sunset Lava,
 * как на главной и в уроках (фон-градиент из layout + glass-карточки).
 */
export default function FlashcardsHubScreen() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const stats = useFlashcardStats();
  const flashcards = useFlashcards({ search: search || undefined, limit: 50 });
  const seedStarter = useSeedStarter();

  const todayDue = stats.data?.today_due ?? 0;
  const todayCompleted = stats.data?.today_completed ?? 0;
  const todayGoal = todayCompleted + todayDue;
  const learning = stats.data?.learning_count ?? 0;
  const mastered = stats.data?.mastered_count ?? 0;
  const total = stats.data?.total_count ?? 0;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: t('home.flashcards'),
          headerRight: () => (
            <Pressable onPress={() => setShowAddSheet(true)} style={{ padding: 8 }}>
              <Plus size={24} color="#FFD84A" />
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40, gap: 16 }}>
        {/* Title */}
        <View>
          <Text style={st.title}>{t('fc.review_title')}</Text>
          <LinearGradient colors={GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.underline} />
          <Text style={st.subtitle}>{t('fc.review_sub')}</Text>
        </View>

        {stats.isLoading ? (
          <View style={[st.card, { padding: 40, alignItems: 'center' }]}>
            <ActivityIndicator color="#FFD84A" />
          </View>
        ) : total === 0 ? (
          <EmptyState
            onSeed={() => seedStarter.mutate('en')}
            onAdd={() => setShowAddSheet(true)}
            loading={seedStarter.isPending}
          />
        ) : (
          <>
            {/* Stats: кольцо дневной цели + компактные счётчики */}
            <View style={[st.card, { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 18 }]}>
              <GoalRing completed={todayCompleted} total={todayGoal} />
              <View style={{ flex: 1, gap: 12 }}>
                <MiniStat label={t('fc.learning')} value={learning} color="#FF9E6E" />
                <MiniStat label={t('fc.mastered')} value={mastered} color="#2EECC8" />
                <MiniStat label={t('fc.total')} value={total} color="#fff" />
              </View>
            </View>

            {/* CTA */}
            {todayDue > 0 && (
              <Pressable onPress={() => router.push('/flashcards/session' as any)} style={st.ctaWrap}>
                <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.cta}>
                  <View style={{ flex: 1 }}>
                    <Text style={st.ctaTitle}>{t('fc.review_words')}</Text>
                    <Text style={st.ctaSub}>
                      {t('fc.due_today', { count: todayDue, unit: t(wordUnitKey(todayDue) as never) })}
                    </Text>
                  </View>
                  <Play size={30} color="white" fill="white" />
                </LinearGradient>
              </Pressable>
            )}

            <SuggestionsWidget targetLanguage="en" />

            {/* Search */}
            <View style={[st.card, st.searchRow]}>
              <Search size={20} color="rgba(255,255,255,0.7)" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t('fc.search_ph')}
                placeholderTextColor="rgba(255,255,255,0.5)"
                style={st.searchInput}
              />
            </View>

            {/* List */}
            {flashcards.isLoading ? (
              <ActivityIndicator color="#FFD84A" />
            ) : (
              <View style={{ gap: 10 }}>
                {flashcards.data?.items.map((card) => (
                  <FlashcardItem key={card.id} card={card} />
                ))}
                {flashcards.data?.items.length === 0 && (
                  <Text style={st.emptyHint}>{t('fc.nothing_found')}</Text>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <AddFlashcardSheet visible={showAddSheet} onDismiss={() => setShowAddSheet(false)} />
    </View>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={st.miniLabel}>{label.toUpperCase()}</Text>
      <Text style={[st.miniValue, { color }]}>{value}</Text>
    </View>
  );
}

function FlashcardItem({ card }: { card: Flashcard }) {
  const { t } = useTranslation();
  return (
    <View style={[st.card, { padding: 14 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={st.itemWord}>{card.word}</Text>
            {card.transcription ? <Text style={st.itemIpa}>{card.transcription}</Text> : null}
          </View>
          <Text style={st.itemTr}>{card.translation}</Text>
        </View>
        {card.pinned_today && (
          <View style={st.todayBadge}>
            <Text style={st.todayBadgeText}>{t('fc.today_badge')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function EmptyState({
  onSeed,
  onAdd,
  loading,
}: {
  onSeed: () => void;
  onAdd: () => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={[st.card, { padding: 24, alignItems: 'center', gap: 14 }]}>
      <Text style={{ fontSize: 54 }}>🎴</Text>
      <Text style={st.emptyTitle}>{t('practice.your_words')}</Text>
      <Text style={st.emptyText}>{t('fc.empty_text')}</Text>
      <Pressable onPress={onSeed} disabled={loading} style={[st.ctaWrap, { alignSelf: 'stretch' }]}>
        <LinearGradient colors={CTA} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[st.cta, { justifyContent: 'center' }]}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={st.ctaTitle}>{t('practice.load_starter')}</Text>
          )}
        </LinearGradient>
      </Pressable>
      <Pressable onPress={onAdd} style={[st.card, st.outlineBtn]}>
        <Text style={st.outlineBtnText}>{t('fc.add_own')}</Text>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  title: { color: '#fff', fontSize: 26, fontWeight: '900' },
  underline: { width: 44, height: 3, borderRadius: 2, marginTop: 6 },
  subtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 14, fontWeight: '600', marginTop: 10 },

  card: { ...glass, borderRadius: 20 },

  miniLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '800' },
  miniValue: { fontSize: 22, fontWeight: '900' },

  ctaWrap: { borderRadius: 18, overflow: 'hidden', shadowColor: '#A8243F', shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 18, paddingHorizontal: 20 },
  ctaTitle: { color: '#fff', fontWeight: '900', fontSize: 18 },
  ctaSub: { color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontSize: 13, marginTop: 2 },

  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '600' },

  itemWord: { color: '#fff', fontSize: 17, fontWeight: '800' },
  itemIpa: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  itemTr: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  todayBadge: { backgroundColor: '#FF9600', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  todayBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  emptyTitle: { color: '#fff', fontSize: 19, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyHint: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', paddingVertical: 24 },

  outlineBtn: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 14, borderRadius: 14 },
  outlineBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
