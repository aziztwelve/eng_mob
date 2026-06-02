import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { Crown, Sparkles } from 'lucide-react-native';

import { useAIQuota } from '@/hooks/use-ai';
import type { AIQuotaStatus } from '@/types/api';

/**
 * QuotaWidget — карточка / pill-набор с текущим потреблением AI-лимитов.
 * Mirror eng_next2/components/ai/quota-widget.
 *
 * `compact=true` — короткая полоса для in-page (chat / writing / pron),
 * иначе — full-card на /ai hub.
 *
 * limit = -1 → unlimited (premium юзеры).
 */
export function QuotaWidget({ compact = false }: { compact?: boolean }) {
  const { data, isLoading } = useAIQuota();

  if (isLoading) {
    return (
      <View
        className={`bg-card rounded-3xl border-4 border-border ${compact ? 'p-3' : 'p-6'} items-center justify-center`}
      >
        <ActivityIndicator color="#9ca3af" />
      </View>
    );
  }

  if (!data) return null;

  const isPremium = data.plan === 'premium';

  if (compact) {
    return (
      <View className="flex-row flex-wrap items-center gap-2">
        <View
          className={`flex-row items-center gap-1 rounded-xl px-2 py-1 ${
            isPremium ? 'bg-amber-500/15' : 'bg-primary/15'
          }`}
        >
          {isPremium ? (
            <Crown size={12} color="#f59e0b" />
          ) : (
            <Sparkles size={12} color="#00FFA3" />
          )}
          <Text
            className={`font-bold text-xs ${
              isPremium ? 'text-amber-500' : 'text-primary'
            }`}
          >
            {isPremium ? 'Premium' : 'Free'}
          </Text>
        </View>
        {!isPremium && (
          <>
            <Pill label="Чаты" used={data.chat_used} limit={data.chat_limit} />
            <Pill
              label="Письмо"
              used={data.writing_used}
              limit={data.writing_limit}
            />
            <Pill
              label="Голос"
              used={Math.round(data.voice_minutes_used * 10) / 10}
              limit={data.voice_minutes_limit}
              suffix="мин"
            />
          </>
        )}
      </View>
    );
  }

  return (
    <View className="bg-card rounded-3xl border-4 border-border p-5 gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Sparkles size={18} color="#00FFA3" />
          <Text className="text-foreground font-black text-lg">
            AI-лимиты сегодня
          </Text>
        </View>
        <View
          className={`flex-row items-center gap-1 rounded-xl px-2 py-1 ${
            isPremium ? 'bg-amber-500/15' : 'bg-muted'
          }`}
        >
          {isPremium ? <Crown size={12} color="#f59e0b" /> : null}
          <Text
            className={`font-bold text-xs ${
              isPremium ? 'text-amber-500' : 'text-muted-foreground'
            }`}
          >
            {isPremium ? 'Premium' : 'Free'}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <Counter
          label="Чаты"
          used={data.chat_used}
          limit={data.chat_limit}
        />
        <Counter
          label="Голос (мин)"
          used={Math.round(data.voice_minutes_used * 10) / 10}
          limit={data.voice_minutes_limit}
        />
        <Counter
          label="Письмо"
          used={data.writing_used}
          limit={data.writing_limit}
        />
      </View>

      {data.resets_at && !isPremium && (
        <Text className="text-muted-foreground font-medium text-xs">
          Сбросится: {fmtResetsAt(data.resets_at)}
        </Text>
      )}
    </View>
  );
}

function Counter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const unlimited = limit < 0;
  const exceeded = !unlimited && used >= limit;
  const colorClass = exceeded
    ? 'text-destructive'
    : unlimited
      ? 'text-amber-500'
      : 'text-foreground';
  return (
    <View className="flex-1">
      <Text className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
        {label}
      </Text>
      <Text className={`font-black text-2xl tabular-nums ${colorClass}`}>
        {used}
        {!unlimited && (
          <Text className="text-base text-muted-foreground"> / {limit}</Text>
        )}
        {unlimited && (
          <Text className="text-base text-muted-foreground"> ∞</Text>
        )}
      </Text>
    </View>
  );
}

function Pill({
  label,
  used,
  limit,
  suffix,
}: {
  label: string;
  used: number;
  limit: number;
  suffix?: string;
}) {
  if (limit < 0) {
    return (
      <View className="rounded-xl bg-amber-500/15 px-2 py-1">
        <Text className="text-amber-500 font-bold text-xs">{label}: ∞</Text>
      </View>
    );
  }
  const exceeded = used >= limit;
  return (
    <View
      className={`rounded-xl px-2 py-1 ${
        exceeded ? 'bg-destructive/15' : 'bg-muted'
      }`}
    >
      <Text
        className={`font-bold text-xs ${
          exceeded ? 'text-destructive' : 'text-foreground'
        }`}
      >
        {label}: {used}/{limit}
        {suffix ? ` ${suffix}` : ''}
      </Text>
    </View>
  );
}

function fmtResetsAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('ru-RU');
  } catch {
    return iso;
  }
}

/** Маленький helper — есть ли свободные слоты в любой single-shot странице. */
export function hasQuotaLeft(
  q: AIQuotaStatus | undefined,
  kind: 'chat' | 'voice' | 'writing',
): boolean {
  if (!q) return true;
  if (q.plan === 'premium') return true;
  if (kind === 'chat') return q.chat_limit < 0 || q.chat_used < q.chat_limit;
  if (kind === 'voice')
    return (
      q.voice_minutes_limit < 0 || q.voice_minutes_used < q.voice_minutes_limit
    );
  return q.writing_limit < 0 || q.writing_used < q.writing_limit;
}
