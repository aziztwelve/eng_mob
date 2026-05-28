import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Drama } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { ScenarioCard } from '@/components/ai/scenario-card';
import { QuotaWidget, hasQuotaLeft } from '@/components/ai/quota-widget';
import {
  useAIQuota,
  useAIScenarios,
  useStartConversation,
} from '@/hooks/use-ai';

const LANG_OPTIONS: { value: string; label: string; disabled?: boolean }[] = [
  { value: '', label: 'Все' },
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES', disabled: true },
  { value: 'de', label: 'DE', disabled: true },
  { value: 'fr', label: 'FR', disabled: true },
];

const LEVEL_OPTIONS = [
  { value: '', label: 'Все' },
  { value: 'A1', label: 'A1' },
  { value: 'A2', label: 'A2' },
  { value: 'B1', label: 'B1' },
  { value: 'B2', label: 'B2' },
  { value: 'C1', label: 'C1' },
];

/**
 * /ai/roleplay — каталог roleplay-сценариев. Клик по карточке стартует
 * conversation со scenario=`roleplay_<id>` и редиректит в /ai/chat/[id].
 */
export default function RoleplayScreen() {
  const [language, setLanguage] = useState('');
  const [level, setLevel] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const list = useAIScenarios({
    language: language || undefined,
    user_level: level || undefined,
  });
  const quota = useAIQuota();
  const startMut = useStartConversation();

  const scenarios = list.data?.scenarios ?? [];
  const canChat = hasQuotaLeft(quota.data, 'chat');

  const handleStart = async (scenarioId: string) => {
    if (!canChat) return;
    setPendingId(scenarioId);
    try {
      const sc = scenarios.find((s) => s.id === scenarioId);
      const resp = await startMut.mutateAsync({
        scenario: scenarioId.startsWith('roleplay_')
          ? scenarioId
          : `roleplay_${scenarioId}`,
        target_language: sc?.language || language || undefined,
        user_level: sc?.user_level || level || undefined,
        title: sc?.title,
      });
      router.push(`/ai/chat/${resp.conversation.id}`);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Не удалось запустить',
        text2: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Roleplay' }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 self-start active:opacity-60"
        >
          <ArrowLeft size={16} color="#9ca3af" />
          <Text className="text-muted-foreground font-bold">К AI hub</Text>
        </Pressable>

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Drama size={28} color="#f43f5e" />
            <Text className="text-foreground font-black text-3xl">
              Roleplay
            </Text>
          </View>
          <Text className="text-muted-foreground font-medium">
            Симуляция реальных ситуаций с AI. Каждый сценарий — своя роль,
            контекст и фокус-вокабуляр.
          </Text>
        </View>

        <QuotaWidget compact />

        {!canChat && (
          <View
            className="rounded-2xl px-3 py-2"
            style={{
              borderWidth: 2,
              borderColor: 'rgba(245,158,11,0.3)',
              backgroundColor: 'rgba(245,158,11,0.05)',
            }}
          >
            <Text className="text-amber-500 font-medium text-sm">
              Лимит чатов на сегодня исчерпан. Попробуйте завтра.
            </Text>
          </View>
        )}

        {/* Filters */}
        <View className="bg-card rounded-3xl border-4 border-border p-4 gap-3">
          <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
            Фильтры
          </Text>
          <View className="gap-2">
            <Text className="text-foreground font-bold text-sm">Язык</Text>
            <View className="flex-row flex-wrap gap-2">
              {LANG_OPTIONS.map((o) => (
                <FilterPill
                  key={o.value || 'all-lang'}
                  active={language === o.value}
                  label={o.label}
                  disabled={o.disabled}
                  onPress={() => setLanguage(o.value)}
                />
              ))}
            </View>
          </View>
          <View className="gap-2">
            <Text className="text-foreground font-bold text-sm">Уровень</Text>
            <View className="flex-row flex-wrap gap-2">
              {LEVEL_OPTIONS.map((o) => (
                <FilterPill
                  key={o.value || 'all-level'}
                  active={level === o.value}
                  label={o.label}
                  onPress={() => setLevel(o.value)}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Scenarios */}
        {list.isLoading ? (
          <View className="bg-card rounded-3xl border-4 border-border p-12 items-center">
            <ActivityIndicator color="#58cc02" />
          </View>
        ) : scenarios.length === 0 ? (
          <View className="bg-card rounded-3xl border-4 border-border p-8 items-center gap-2">
            <Drama size={42} color="#9ca3af" />
            <Text className="text-foreground font-black text-xl">
              Сценарии не найдены
            </Text>
            <Text className="text-muted-foreground font-medium text-center">
              Попробуйте другие фильтры или сбросьте их.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {scenarios.map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                loading={pendingId === s.id && startMut.isPending}
                onStart={handleStart}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function FilterPill({
  active,
  label,
  onPress,
  disabled,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={() => !disabled && onPress()}
      disabled={disabled}
      className={`rounded-xl px-3 py-1.5 border-2 flex-row items-center gap-1.5 ${
        disabled
          ? 'bg-muted border-border opacity-50'
          : active
            ? 'bg-primary border-primary'
            : 'bg-card border-border'
      } ${disabled ? '' : 'active:opacity-80'}`}
    >
      <Text
        className={`font-bold text-sm ${
          active && !disabled ? 'text-primary-foreground' : 'text-foreground'
        }`}
      >
        {label}
      </Text>
      {disabled && (
        <Text className="text-muted-foreground font-bold text-[10px] uppercase">
          Скоро
        </Text>
      )}
    </Pressable>
  );
}
