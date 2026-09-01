import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Stack, Link, router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Sparkles,
  TrendingDown,
} from 'lucide-react-native';

import { StepRenderer } from '@/components/lesson/StepRenderer';
import { stepTitle } from '@/lib/step-titles';
import { useTranslation } from 'react-i18next';
import { useLessonGamificationFx } from '@/hooks/use-gamification-fx';
import { useStep } from '@/hooks/use-steps';
import { useStepSubmit } from '@/hooks/use-step-submit';
import {
  MISTAKES_KEY,
  SKILLS_KEY,
  SKILLS_WEAK_KEY,
  SRS_DUE_KEY,
  SRS_STATS_KEY,
  SRS_WEAK_KEY,
  useGeneratePracticeSession,
} from '@/hooks/use-srs';
import {
  isInteractiveStep,
  practiceSourceLabel,
  type PracticeItem,
  type SubmitAnswerResponse,
} from '@/types/api';

const SESSION_SIZE = 10;

/**
 * /practice/session — одна сессия практики (mirror web /practice/session).
 *
 * 1. На mount генерируем сессию (POST /practice/session, size=10).
 * 2. Прогоняем items по очереди — каждый item.step_id → useStep →
 *    <StepRenderer> с тем же интерфейсом, что и обычный урок.
 * 3. step-validation сам пишет SRS-карточки и mistake-resolution.
 * 4. На последнем шаге — экран summary.
 */
export default function PracticeSessionScreen() {
  const { t } = useTranslation();
  const generate = useGeneratePracticeSession();
  const fireGamificationFx = useLessonGamificationFx();
  const qc = useQueryClient();

  const [items, setItems] = useState<PracticeItem[]>([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Array<{ correct: boolean }>>([]);
  const startedAtRef = useRef<number>(0);

  // На mount запрашиваем сессию ровно один раз.
  const didGenerate = useRef(false);
  useEffect(() => {
    if (didGenerate.current) return;
    didGenerate.current = true;
    startedAtRef.current = Date.now();
    generate.mutate(
      { size: SESSION_SIZE },
      {
        onSuccess: (data) => setItems(data.items ?? []),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = items.length;
  const isFinished = total > 0 && index >= total;
  const current = items[index];
  const progressPct =
    total === 0
      ? 0
      : Math.round(((index + (isFinished ? 0 : 1)) / total) * 100);

  // === Loading / error states ===
  if (generate.isPending && items.length === 0) {
    return (
      <Container>
        <View className="bg-card rounded-3xl border-4 border-border p-12 items-center justify-center">
          <ActivityIndicator color="#FFD84A" />
        </View>
      </Container>
    );
  }
  if (generate.isError) {
    return (
      <Container>
        <View className="bg-card rounded-3xl border-4 border-border p-8 items-center gap-3">
          <Text className="text-foreground font-bold text-center">
            {t('practice.gen_failed')}
          </Text>
          <Pressable
            onPress={() => generate.mutate({ size: SESSION_SIZE })}
            className="bg-primary rounded-2xl px-5 py-3 active:opacity-80"
          >
            <Text className="text-primary-foreground font-black">
              {t('practice.retry')}
            </Text>
          </Pressable>
        </View>
      </Container>
    );
  }
  if (items.length === 0) {
    return (
      <Container>
        <View className="bg-card rounded-3xl border-4 border-border p-8 items-center gap-3">
          <Clock size={48} color="#9ca3af" />
          <Text className="text-foreground font-black text-2xl text-center">
            {t('practice.nothing_now')}
          </Text>
          <Text className="text-muted-foreground font-medium text-center">
            {t('practice.nothing_now_desc')}
          </Text>
          <Link href="/practice" asChild>
            <Pressable className="bg-primary rounded-2xl px-5 py-3 mt-2 active:opacity-80">
              <Text className="text-primary-foreground font-black">
                {t('practice.to_practice')}
              </Text>
            </Pressable>
          </Link>
        </View>
      </Container>
    );
  }

  if (isFinished) {
    const correct = results.filter((r) => r.correct).length;
    return (
      <Container>
        <View className="bg-card rounded-3xl border-4 border-border p-8 items-center gap-3">
          <Sparkles size={48} color="#FFD84A" />
          <Text className="text-foreground font-black text-3xl text-center">
            {t('practice.finished')}
          </Text>
          <Text className="text-muted-foreground font-medium text-center">
            {t('practice.correct_of', { correct, total })}
          </Text>
          <View className="flex-row flex-wrap gap-2 justify-center pt-2">
            <Pressable
              onPress={() => {
                qc.invalidateQueries({ queryKey: SRS_STATS_KEY });
                qc.invalidateQueries({ queryKey: SRS_DUE_KEY });
                qc.invalidateQueries({ queryKey: SRS_WEAK_KEY });
                qc.invalidateQueries({ queryKey: MISTAKES_KEY });
                qc.invalidateQueries({ queryKey: SKILLS_KEY });
                qc.invalidateQueries({ queryKey: SKILLS_WEAK_KEY });
                setItems([]);
                setIndex(0);
                setResults([]);
                didGenerate.current = false;
                generate.mutate(
                  { size: SESSION_SIZE },
                  {
                    onSuccess: (data) => setItems(data.items ?? []),
                  },
                );
              }}
              className="bg-primary rounded-2xl px-5 py-3 active:opacity-80"
            >
              <Text className="text-primary-foreground font-black">
                {t('practice.another')}
              </Text>
            </Pressable>
            <Link href="/practice" asChild>
              <Pressable className="bg-card border-2 border-border rounded-2xl px-5 py-3 active:opacity-80">
                <Text className="text-foreground font-black">{t('practice.to_practice')}</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <ProgressBar pct={progressPct} index={index} total={total} />
      {current && (
        <CurrentStepCard
          item={current}
          onResult={(correct) => setResults((r) => [...r, { correct }])}
          onContinue={() => setIndex((i) => i + 1)}
          fireGamificationFx={fireGamificationFx}
          startedAtRef={startedAtRef}
          onAdvance={() => {
            startedAtRef.current = Date.now();
          }}
        />
      )}
    </Container>
  );
}

function Container({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: t('practice.session_title') }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 self-start active:opacity-60"
        >
          <ArrowLeft size={16} color="#9ca3af" />
          <Text className="text-muted-foreground font-bold">{t('practice.to_practice')}</Text>
        </Pressable>
        {children}
      </ScrollView>
    </View>
  );
}

function ProgressBar({
  pct,
  index,
  total,
}: {
  pct: number;
  index: number;
  total: number;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-1 h-3 bg-muted rounded-full overflow-hidden border-2 border-border">
        <View
          className="h-full bg-primary"
          style={{ width: `${pct}%` }}
        />
      </View>
      <Text className="text-foreground font-black text-sm tabular-nums">
        {index + 1} / {total}
      </Text>
    </View>
  );
}

function SourceBadge({ item }: { item: PracticeItem }) {
  const { t } = useTranslation();
  const src = practiceSourceLabel(item.source);
  if (src === 'overdue') {
    return (
      <View className="flex-row items-center gap-1 bg-primary rounded-full px-3 py-1">
        <Clock size={12} color="#ffffff" />
        <Text className="text-primary-foreground font-bold text-xs">
          {t('practice.src_overdue')}
        </Text>
      </View>
    );
  }
  if (src === 'mistake') {
    return (
      <View className="flex-row items-center gap-1 bg-orange-500 rounded-full px-3 py-1">
        <AlertTriangle size={12} color="#ffffff" />
        <Text className="text-white font-bold text-xs">{t('practice.src_mistake')}</Text>
      </View>
    );
  }
  if (src === 'weak') {
    return (
      <View className="flex-row items-center gap-1 bg-amber-500 rounded-full px-3 py-1">
        <TrendingDown size={12} color="#ffffff" />
        <Text className="text-white font-bold text-xs">{t('practice.src_weak')}</Text>
      </View>
    );
  }
  return null;
}

function CurrentStepCard({
  item,
  onResult,
  onContinue,
  fireGamificationFx,
  startedAtRef,
  onAdvance,
}: {
  item: PracticeItem;
  onResult: (correct: boolean) => void;
  onContinue: () => void;
  fireGamificationFx: ReturnType<typeof useLessonGamificationFx>;
  startedAtRef: React.MutableRefObject<number>;
  onAdvance: () => void;
}) {
  const { t, i18n } = useTranslation();
  const step = useStep(item.step_id);
  const submit = useStepSubmit();
  const lastResultRef = useRef<{ stepId: string; correct: boolean } | null>(
    null,
  );

  useEffect(() => {
    onAdvance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.step_id]);

  const interactive = useMemo(
    () => step.data?.step && isInteractiveStep(step.data.step.type),
    [step.data],
  );

  const handleSubmit = async (
    answer: Record<string, unknown>,
  ): Promise<SubmitAnswerResponse> => {
    if (!step.data?.step) throw new Error('no step loaded');
    const timeMs = Math.max(0, Date.now() - startedAtRef.current);
    const resp = await submit.mutateAsync({
      stepId: step.data.step.id,
      body: { answer, time_spent_ms: timeMs, source_type: 'standalone' },
    });
    if (resp.is_correct) {
      void fireGamificationFx({ xp: resp.gamification ?? null, silent: true });
    }
    lastResultRef.current = {
      stepId: step.data.step.id,
      correct: !!resp.is_correct,
    };
    return resp;
  };

  const handleContinue = () => {
    if (lastResultRef.current) {
      onResult(lastResultRef.current.correct);
      lastResultRef.current = null;
    }
    onContinue();
  };

  if (step.isLoading) {
    return (
      <View className="bg-card rounded-3xl border-4 border-border p-12 items-center justify-center">
        <ActivityIndicator color="#FFD84A" />
      </View>
    );
  }
  if (step.isError || !step.data?.step) {
    return (
      <View className="bg-card rounded-3xl border-4 border-border p-6 items-center gap-3">
        <Text className="text-foreground font-bold text-center">
          {t('practice.step_failed')}
        </Text>
        <Pressable
          onPress={onContinue}
          className="bg-primary rounded-2xl px-5 py-3 active:opacity-80"
        >
          <Text className="text-primary-foreground font-black">{t('cards.skip')}</Text>
        </Pressable>
      </View>
    );
  }
  if (!interactive) {
    return (
      <View className="bg-card rounded-3xl border-4 border-border p-6 gap-3">
        <SourceBadge item={item} />
        <Text className="text-foreground font-black text-xl">
          {stepTitle(step.data.step.type, i18n.language)}
        </Text>
        <Text className="text-muted-foreground font-medium">
          {t('practice.non_interactive')}
        </Text>
        <Pressable
          onPress={() => {
            onResult(true);
            onContinue();
          }}
          className="bg-primary rounded-2xl px-5 py-3 self-start active:opacity-80"
        >
          <Text className="text-primary-foreground font-black">{t('lesson.feedback.next')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2 flex-wrap">
        <SourceBadge item={item} />
        <View className="bg-card border-2 border-border rounded-full px-3 py-1">
          <Text className="text-foreground text-xs font-bold uppercase">
            {step.data.step.type}
          </Text>
        </View>
        <Text className="text-foreground font-black text-xl">
          {stepTitle(step.data.step.type, i18n.language)}
        </Text>
      </View>

      <StepRenderer
        step={step.data.step}
        onSubmit={handleSubmit}
        onContinue={handleContinue}
      />
    </View>
  );
}
