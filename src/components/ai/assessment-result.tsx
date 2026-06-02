import React from 'react';
import { Text, View } from 'react-native';

import type {
  AIWritingFeedback,
  AssessWritingResponse,
} from '@/types/api';

/**
 * AssessmentResult — карточка с overall + 4 score-bars + corrected_text +
 * structured feedback по категориям. Mirror eng_next2.
 */
export function AssessmentResult({
  data,
}: {
  data: AssessWritingResponse;
}) {
  return (
    <View className="gap-4">
      <View className="bg-card rounded-3xl border-4 border-border p-5 gap-4">
        <View className="flex-row items-end justify-between flex-wrap gap-3">
          <View>
            <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
              Общая оценка
            </Text>
            <Text
              className={`font-black text-5xl tabular-nums ${scoreColor(
                data.overall_score,
              )}`}
            >
              {data.overall_score}
              <Text className="text-2xl text-muted-foreground"> /100</Text>
            </Text>
          </View>
          <View
            className={`rounded-xl px-3 py-1.5 ${scoreBadgeBg(
              data.overall_score,
            )}`}
            style={{
              borderWidth: 1,
              borderColor: scoreBorder(data.overall_score),
            }}
          >
            <Text
              className={`font-bold ${scoreColor(data.overall_score)}`}
            >
              {scoreLabel(data.overall_score)}
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-3">
          <ScoreBar label="Грамматика" value={data.grammar_score} />
          <ScoreBar label="Лексика" value={data.vocabulary_score} />
          <ScoreBar label="Связность" value={data.coherence_score} />
          <ScoreBar label="Стиль" value={data.style_score} />
        </View>
      </View>

      {data.corrected_text ? (
        <View className="bg-card rounded-3xl border-4 border-border p-5 gap-2">
          <Text className="text-foreground font-black text-lg">
            Исправленный текст
          </Text>
          <View
            className="rounded-2xl p-3"
            style={{
              borderWidth: 2,
              borderColor: 'rgba(16,185,129,0.2)',
              backgroundColor: 'rgba(16,185,129,0.05)',
            }}
          >
            <Text className="text-foreground font-medium leading-6">
              {data.corrected_text}
            </Text>
          </View>
        </View>
      ) : null}

      {data.feedback && data.feedback.length > 0 ? (
        <View className="bg-card rounded-3xl border-4 border-border p-5 gap-3">
          <Text className="text-foreground font-black text-lg">
            Подробный фидбэк
          </Text>
          <View className="gap-2">
            {data.feedback.map((f, i) => (
              <FeedbackRow key={i} item={f} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View className="gap-1" style={{ width: '47%' }}>
      <View className="flex-row items-end justify-between">
        <Text className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
          {label}
        </Text>
        <Text
          className={`font-black text-base tabular-nums ${scoreColor(value)}`}
        >
          {value}
        </Text>
      </View>
      <View
        className="rounded-full overflow-hidden bg-muted"
        style={{ height: 6 }}
      >
        <View
          style={{
            width: `${pct}%`,
            height: 6,
            backgroundColor: scoreBarColor(value),
          }}
        />
      </View>
    </View>
  );
}

function FeedbackRow({ item }: { item: AIWritingFeedback }) {
  return (
    <View className="rounded-2xl border-2 border-border p-3 gap-1">
      <View
        className={`self-start rounded-lg px-2 py-0.5 ${categoryBg(
          item.category,
        )}`}
      >
        <Text
          className={`font-bold text-[10px] uppercase tracking-wider ${categoryColor(
            item.category,
          )}`}
        >
          {categoryLabel(item.category)}
        </Text>
      </View>
      <Text className="text-foreground font-bold text-sm">{item.issue}</Text>
      <Text className="text-muted-foreground font-medium text-sm">
        💡 {item.suggestion}
      </Text>
    </View>
  );
}

// === helpers ===

function scoreColor(v: number): string {
  if (v >= 80) return 'text-emerald-500';
  if (v >= 60) return 'text-amber-500';
  return 'text-destructive';
}

function scoreBarColor(v: number): string {
  if (v >= 80) return '#10b981';
  if (v >= 60) return '#f59e0b';
  return '#FF4B7E';
}

function scoreBadgeBg(v: number): string {
  if (v >= 80) return 'bg-emerald-500/15';
  if (v >= 60) return 'bg-amber-500/15';
  return 'bg-destructive/15';
}

function scoreBorder(v: number): string {
  if (v >= 80) return 'rgba(16,185,129,0.3)';
  if (v >= 60) return 'rgba(245,158,11,0.3)';
  return 'rgba(255,75,75,0.3)';
}

function scoreLabel(v: number): string {
  if (v >= 90) return 'Отлично';
  if (v >= 75) return 'Хорошо';
  if (v >= 60) return 'Норм';
  if (v >= 40) return 'Слабо';
  return 'Плохо';
}

function categoryLabel(c: string): string {
  switch (c) {
    case 'grammar':
      return 'Грамматика';
    case 'vocabulary':
      return 'Лексика';
    case 'coherence':
      return 'Связность';
    case 'style':
      return 'Стиль';
    default:
      return c;
  }
}

function categoryBg(c: string): string {
  switch (c) {
    case 'grammar':
      return 'bg-rose-500/15';
    case 'vocabulary':
      return 'bg-blue-500/15';
    case 'coherence':
      return 'bg-violet-500/15';
    case 'style':
      return 'bg-amber-500/15';
    default:
      return 'bg-muted';
  }
}

function categoryColor(c: string): string {
  switch (c) {
    case 'grammar':
      return 'text-rose-500';
    case 'vocabulary':
      return 'text-blue-500';
    case 'coherence':
      return 'text-violet-500';
    case 'style':
      return 'text-amber-500';
    default:
      return 'text-foreground';
  }
}
