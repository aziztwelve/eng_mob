import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Sparkles } from 'lucide-react-native';

import { useFlashcardSuggestions, useBulkCreateFlashcards } from '@/hooks/use-flashcards';
import type { FlashcardSuggestion } from '@/types/api';

/**
 * <SuggestionsWidget> — горизонтальная карусель AI-предложений.
 *
 * Показывает 5-10 слов от ai-service SuggestFlashcards. Каждое слово —
 * chip с word + translation + кнопкой добавления.
 */
export interface SuggestionsWidgetProps {
  level?: string;
  goal?: string;
  targetLanguage?: string;
}

export function SuggestionsWidget({ level, goal, targetLanguage }: SuggestionsWidgetProps) {
  const suggestions = useFlashcardSuggestions({
    level,
    goal,
    target_language: targetLanguage || 'en',
    count: 5,
  });
  const bulkCreate = useBulkCreateFlashcards();

  const handleAddAll = async () => {
    if (!suggestions.data?.items.length) return;

    const items = suggestions.data.items.map((s) => ({
      word: s.word,
      translation: s.translation,
      language: targetLanguage || 'en',
      target_language: 'ru',
      definition: s.definition,
      example_sentence: s.example_sentence,
      source: 'ai_suggestion' as const,
      vocabulary_id: s.vocabulary_id,
    }));

    try {
      await bulkCreate.mutateAsync({ items });
    } catch (error) {
      console.error('Failed to add suggestions:', error);
    }
  };

  if (suggestions.isLoading) {
    return (
      <View className="bg-card rounded-3xl border-4 border-border p-6 items-center">
        <ActivityIndicator color="#58cc02" />
      </View>
    );
  }

  if (!suggestions.data?.items.length) {
    return null;
  }

  return (
    <View className="gap-3">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Sparkles size={20} color="#58cc02" />
          <Text className="text-foreground font-bold text-lg">AI рекомендует</Text>
        </View>
        <Pressable
          onPress={handleAddAll}
          disabled={bulkCreate.isPending}
          className="bg-primary rounded-xl px-3 py-1.5 active:opacity-80"
        >
          {bulkCreate.isPending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-bold text-sm">Добавить все</Text>
          )}
        </Pressable>
      </View>

      {/* Horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 2 }}
      >
        {suggestions.data.items.map((suggestion, index) => (
          <SuggestionChip key={index} suggestion={suggestion} />
        ))}
      </ScrollView>
    </View>
  );
}

function SuggestionChip({ suggestion }: { suggestion: FlashcardSuggestion }) {
  return (
    <View className="bg-primary/10 border-2 border-primary rounded-2xl p-4 w-48 gap-2">
      <Text className="text-foreground font-bold text-lg">{suggestion.word}</Text>
      <Text className="text-muted-foreground font-medium">{suggestion.translation}</Text>
      {suggestion.definition && (
        <Text className="text-muted-foreground text-xs" numberOfLines={2}>
          {suggestion.definition}
        </Text>
      )}
      {suggestion.reason && (
        <View className="bg-primary/20 rounded-lg px-2 py-1 mt-1">
          <Text className="text-primary text-xs font-medium">{suggestion.reason}</Text>
        </View>
      )}
    </View>
  );
}
