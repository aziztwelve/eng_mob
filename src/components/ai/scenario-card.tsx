import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Play, Sparkles } from 'lucide-react-native';

import type { AIScenario } from '@/types/api';

/**
 * ScenarioCard — карточка одного roleplay-сценария.
 *
 * onStart вызывается при клике «Начать» — родитель решает, как поднять
 * conversation (StartConversation + редирект на /ai/chat/[id]).
 */
export function ScenarioCard({
  scenario,
  loading = false,
  onStart,
}: {
  scenario: AIScenario;
  loading?: boolean;
  onStart: (scenarioId: string) => void;
}) {
  return (
    <View className="bg-card rounded-3xl border-4 border-border p-4 gap-3">
      <View className="flex-row items-start gap-2">
        <View className="flex-1 gap-1 min-w-0">
          <View className="flex-row items-center gap-1.5">
            <Sparkles size={16} color="#58cc02" />
            <Text
              className="text-foreground font-black text-base flex-shrink"
              numberOfLines={2}
            >
              {scenario.title}
            </Text>
          </View>
          <Text className="text-muted-foreground font-medium text-sm">
            {scenario.description}
          </Text>
        </View>
        <View className="bg-primary/15 rounded-xl px-2 py-1">
          <Text className="text-primary font-bold text-xs uppercase tracking-wider">
            {scenario.user_level || '—'}
          </Text>
        </View>
      </View>

      {scenario.ai_role ? (
        <Text className="text-xs">
          <Text className="text-muted-foreground font-bold uppercase tracking-wider">
            Роль AI:{' '}
          </Text>
          <Text className="text-foreground font-medium">
            {scenario.ai_role}
          </Text>
        </Text>
      ) : null}

      {scenario.vocabulary_focus && scenario.vocabulary_focus.length > 0 && (
        <View className="flex-row flex-wrap gap-1">
          {scenario.vocabulary_focus.slice(0, 6).map((w) => (
            <View key={w} className="bg-muted rounded-lg px-2 py-0.5">
              <Text className="text-foreground font-medium text-xs">
                {w}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Pressable
        onPress={() => onStart(scenario.id)}
        disabled={loading}
        className={`rounded-2xl px-4 py-3 flex-row items-center justify-center gap-2 ${
          loading ? 'bg-muted opacity-60' : 'bg-primary active:opacity-80'
        }`}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#1a1a1a" />
        ) : (
          <Play size={16} color="#1a1a1a" />
        )}
        <Text className="text-primary-foreground font-black">Начать</Text>
      </Pressable>
    </View>
  );
}
