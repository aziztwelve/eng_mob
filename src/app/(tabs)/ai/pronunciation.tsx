import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle2,
  Mic,
  RotateCcw,
  XCircle,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { LangPills } from '@/components/ai/lang-pills';
import { VoiceRecorder } from '@/components/ai/voice-recorder';
import { QuotaWidget, hasQuotaLeft } from '@/components/ai/quota-widget';
import { useAIQuota, useCheckPronunciation } from '@/hooks/use-ai';
import type { AIWordScore, CheckPronunciationResponse } from '@/types/api';
import type { PronunciationAudioInput } from '@/lib/ai-api';
import { AI_TARGET_LANGS, DEFAULT_TARGET_LANG } from '@/lib/ai-languages';

/**
 * /ai/pronunciation — записываем аудио, отправляем + target_text +
 * language → бэк возвращает word-level scores. Mirror eng_next2.
 */
export default function PronunciationScreen() {
  const [target, setTarget] = useState('');
  const [language, setLanguage] = useState(DEFAULT_TARGET_LANG);
  const [resetSignal, setResetSignal] = useState(0);

  const quota = useAIQuota();
  const mut = useCheckPronunciation();
  const canVoice = hasQuotaLeft(quota.data, 'voice');

  const handleSubmit = async (audio: PronunciationAudioInput) => {
    if (!target.trim() || !canVoice) return;
    try {
      await mut.mutateAsync({
        audio,
        target_text: target.trim(),
        language,
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Ошибка проверки',
        text2: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleReset = () => {
    mut.reset();
    setResetSignal((n) => n + 1);
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Произношение' }} />
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
            <Mic size={28} color="#10b981" />
            <Text className="text-foreground font-black text-3xl">
              Произношение
            </Text>
          </View>
          <Text className="text-muted-foreground font-medium">
            Введите фразу, запишите её — AI оценит точность по словам.
          </Text>
        </View>

        <QuotaWidget compact />

        {/* Target + lang */}
        <View className="bg-card rounded-3xl border-4 border-border p-5 gap-4">
          <View className="gap-1">
            <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
              Фраза для произношения
            </Text>
            <TextInput
              value={target}
              onChangeText={setTarget}
              placeholder='Например: "I would like a coffee, please."'
              placeholderTextColor="#6b7280"
              className="text-foreground font-medium"
              style={{
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.15)',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: '#fff',
              }}
            />
          </View>
          <View className="gap-1">
            <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
              Язык
            </Text>
            <LangPills
              options={AI_TARGET_LANGS}
              value={language}
              onChange={setLanguage}
            />
          </View>

          {!canVoice && (
            <Text className="text-destructive font-medium text-sm">
              Лимит голосовых минут исчерпан. Сбрасывается завтра.
            </Text>
          )}
        </View>

        {target.trim() ? (
          <VoiceRecorder
            key={resetSignal}
            loading={mut.isPending}
            onSubmit={(audio) => handleSubmit(audio)}
          />
        ) : (
          <View className="bg-card rounded-3xl border-4 border-border p-8 items-center">
            <Text className="text-muted-foreground font-medium text-center">
              Введите фразу выше, чтобы появилась кнопка записи.
            </Text>
          </View>
        )}

        {mut.isError && (
          <View
            className="rounded-2xl px-3 py-2"
            style={{
              borderWidth: 2,
              borderColor: 'rgba(255,75,75,0.3)',
              backgroundColor: 'rgba(255,75,75,0.05)',
            }}
          >
            <Text className="text-destructive font-medium text-sm">
              Ошибка проверки. Попробуйте ещё раз.
            </Text>
          </View>
        )}

        {mut.data && (
          <Result targetText={target} data={mut.data} onReset={handleReset} />
        )}
      </ScrollView>
    </View>
  );
}

// ----------------------------------------------------------------------------
// Result
// ----------------------------------------------------------------------------

function Result({
  targetText,
  data,
  onReset,
}: {
  targetText: string;
  data: CheckPronunciationResponse;
  onReset: () => void;
}) {
  const overall = Number.isFinite(data.accuracy_score)
    ? Math.round(data.accuracy_score * 100)
    : 0;
  const isGood = overall >= 75;

  return (
    <View className="gap-4">
      <View className="bg-card rounded-3xl border-4 border-border p-5 gap-3">
        <View className="flex-row items-end justify-between flex-wrap gap-3">
          <View>
            <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
              Точность
            </Text>
            <Text
              className={`font-black text-5xl tabular-nums ${
                isGood ? 'text-emerald-500' : 'text-amber-500'
              }`}
            >
              {overall}
              <Text className="text-2xl text-muted-foreground"> /100</Text>
            </Text>
          </View>
          <View
            className={`flex-row items-center gap-1 rounded-xl px-3 py-1.5 ${
              isGood ? 'bg-emerald-500/15' : 'bg-amber-500/15'
            }`}
            style={{
              borderWidth: 1,
              borderColor: isGood
                ? 'rgba(16,185,129,0.3)'
                : 'rgba(245,158,11,0.3)',
            }}
          >
            {isGood ? (
              <CheckCircle2 size={16} color="#10b981" />
            ) : (
              <XCircle size={16} color="#f59e0b" />
            )}
            <Text
              className={`font-bold text-sm ${
                isGood ? 'text-emerald-500' : 'text-amber-500'
              }`}
            >
              {isGood ? 'Хорошо' : 'Ещё попрактикуйтесь'}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View className="rounded-full overflow-hidden bg-muted" style={{ height: 8 }}>
          <View
            style={{
              width: `${overall}%`,
              height: 8,
              backgroundColor: isGood ? '#10b981' : '#f59e0b',
            }}
          />
        </View>

        {data.feedback ? (
          <Text className="text-muted-foreground font-medium text-sm">
            {data.feedback}
          </Text>
        ) : null}
      </View>

      <View className="bg-card rounded-3xl border-4 border-border p-5 gap-3">
        <Text className="text-foreground font-black text-lg">
          Целевая фраза
        </Text>
        <View className="rounded-2xl bg-muted/30 border-2 border-border p-3">
          <Text className="text-foreground font-bold">{targetText}</Text>
        </View>

        <Text className="text-foreground font-black text-lg">Распознано</Text>
        <View className="rounded-2xl bg-muted/30 border-2 border-border p-3">
          <Text
            className="text-foreground font-medium"
            style={{ fontStyle: 'italic' }}
          >
            {data.transcribed_text}
          </Text>
        </View>

        {data.word_scores && data.word_scores.length > 0 && (
          <>
            <Text className="text-foreground font-black text-lg">
              По словам
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {data.word_scores.map((w, i) => (
                <WordScoreBadge key={i} item={w} />
              ))}
            </View>
          </>
        )}
      </View>

      <Pressable
        onPress={onReset}
        className="bg-card border-4 border-border rounded-2xl px-4 py-3 flex-row items-center justify-center gap-2 active:opacity-80"
      >
        <RotateCcw size={16} color="#fff" />
        <Text className="text-foreground font-bold">Попробовать ещё раз</Text>
      </Pressable>
    </View>
  );
}

function WordScoreBadge({ item }: { item: AIWordScore }) {
  const pct = Number.isFinite(item.score) ? Math.round(item.score * 100) : 0;
  const bg =
    pct >= 80
      ? 'bg-emerald-500/15'
      : pct >= 60
        ? 'bg-amber-500/15'
        : 'bg-destructive/15';
  const color =
    pct >= 80
      ? 'text-emerald-500'
      : pct >= 60
        ? 'text-amber-500'
        : 'text-destructive';
  const border =
    pct >= 80
      ? 'rgba(16,185,129,0.3)'
      : pct >= 60
        ? 'rgba(245,158,11,0.3)'
        : 'rgba(255,75,75,0.3)';
  return (
    <View
      className={`rounded-xl px-2 py-1 flex-row items-center gap-1.5 ${bg}`}
      style={{ borderWidth: 1, borderColor: border }}
    >
      <Text className={`font-bold text-sm ${color}`}>{item.word}</Text>
      <Text className="text-muted-foreground font-bold text-xs tabular-nums">
        {pct}
      </Text>
    </View>
  );
}
