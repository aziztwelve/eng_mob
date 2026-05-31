import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import { BookOpen, Plus, Search, Play } from 'lucide-react-native';

import { useFlashcards, useFlashcardStats } from '@/hooks/use-flashcards';
import { AddFlashcardSheet } from '@/components/flashcards/AddFlashcardSheet';
import { SuggestionsWidget } from '@/components/flashcards/SuggestionsWidget';

/**
 * /practice/library — библиотека flashcards пользователя.
 *
 * Показывает stats (на сегодня / учу / выучено), список карточек с поиском,
 * кнопку добавления и CTA «Повторить N слов».
 */
export default function LibraryScreen() {
  const [search, setSearch] = useState('');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const stats = useFlashcardStats();
  const flashcards = useFlashcards({ search: search || undefined, limit: 50 });

  const todayDue = stats.data?.today_due ?? 0;
  const learning = stats.data?.learning_count ?? 0;
  const mastered = stats.data?.mastered_count ?? 0;
  const total = stats.data?.total_count ?? 0;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: 'Мои слова',
          headerRight: () => (
            <Pressable
              onPress={() => setShowAddSheet(true)}
              className="p-2"
            >
              <Plus size={24} color="#58cc02" />
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Header */}
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <BookOpen size={28} color="#58cc02" />
            <Text className="text-foreground font-black text-3xl">Библиотека</Text>
          </View>
          <Text className="text-muted-foreground font-medium">
            Ваши слова для повторения
          </Text>
        </View>

        {/* Stats tiles */}
        {stats.isLoading ? (
          <View className="bg-card rounded-3xl border-4 border-border p-12 items-center">
            <ActivityIndicator color="#58cc02" />
          </View>
        ) : total === 0 ? (
          <EmptyState onAdd={() => setShowAddSheet(true)} />
        ) : (
          <>
            <View className="bg-card rounded-3xl border-4 border-border p-4 gap-4">
              <View className="flex-row flex-wrap">
                <StatTile label="На сегодня" value={todayDue} accent="primary" />
                <StatTile label="Учу" value={learning} accent="warning" />
                <StatTile label="Выучено" value={mastered} accent="success" />
                <StatTile label="Всего" value={total} />
              </View>
            </View>

            {/* Practice CTA */}
            {todayDue > 0 && (
              <Pressable
                onPress={() => router.push('/practice/flashcards' as any)}
                className="bg-primary rounded-3xl border-4 border-primary-dark p-6 flex-row items-center justify-between active:opacity-80"
              >
                <View className="gap-1">
                  <Text className="text-white font-black text-xl">Повторить слова</Text>
                  <Text className="text-white/80 font-medium">
                    {todayDue} {todayDue === 1 ? 'слово' : 'слов'} на сегодня
                  </Text>
                </View>
                <Play size={32} color="white" fill="white" />
              </Pressable>
            )}

            {/* AI Suggestions */}
            <SuggestionsWidget targetLanguage="en" />

            {/* Search */}
            <View className="bg-card rounded-2xl border-2 border-border p-3 flex-row items-center gap-2">
              <Search size={20} color="#999" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Поиск слов..."
                placeholderTextColor="#999"
                className="flex-1 text-foreground font-medium"
              />
            </View>

            {/* Flashcards list */}
            {flashcards.isLoading ? (
              <ActivityIndicator color="#58cc02" />
            ) : (
              <View className="gap-2">
                {flashcards.data?.items.map((card) => (
                  <FlashcardItem key={card.id} card={card} />
                ))}
                {flashcards.data?.items.length === 0 && (
                  <Text className="text-muted-foreground text-center py-8">
                    Ничего не найдено
                  </Text>
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

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: 'primary' | 'success' | 'warning';
}) {
  const color = accent === 'primary' ? '#58cc02' : accent === 'success' ? '#00cd9c' : accent === 'warning' ? '#ff9600' : '#777';
  return (
    <View className="flex-1 min-w-[45%] gap-1 p-2">
      <Text className="text-muted-foreground text-xs font-bold uppercase">{label}</Text>
      <Text className="font-black text-2xl" style={{ color }}>
        {value}
      </Text>
    </View>
  );
}

function FlashcardItem({ card }: { card: any }) {
  return (
    <Pressable
      onPress={() => {
        // TODO: открыть DictionaryModal или edit
      }}
      className="bg-card rounded-2xl border-2 border-border p-4 active:opacity-70"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 gap-1">
          <Text className="text-foreground font-bold text-lg">{card.word}</Text>
          <Text className="text-muted-foreground font-medium">{card.translation}</Text>
          {card.definition && (
            <Text className="text-muted-foreground text-sm" numberOfLines={1}>
              {card.definition}
            </Text>
          )}
        </View>
        {card.pinned_today && (
          <View className="bg-orange-500 rounded-full px-3 py-1">
            <Text className="text-white text-xs font-bold">Сегодня</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View className="bg-card rounded-3xl border-4 border-border p-8 items-center gap-4">
      <BookOpen size={64} color="#ccc" />
      <Text className="text-foreground font-bold text-xl text-center">
        Пока нет слов
      </Text>
      <Text className="text-muted-foreground text-center">
        Добавьте первое слово вручную или пройдите урок — слова добавятся автоматически
      </Text>
      <Pressable
        onPress={onAdd}
        className="bg-primary rounded-2xl px-6 py-3 active:opacity-80"
      >
        <Text className="text-white font-bold">Добавить слово</Text>
      </Pressable>
    </View>
  );
}
