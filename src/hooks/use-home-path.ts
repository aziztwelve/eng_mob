import { useCallback } from 'react';
import { useActiveTrack, useTracks, useTrack, useTrackProgress } from './use-tracks';
import { useCompletedLessons } from '@/lib/lesson-progress';
import { buildHomePath } from '@/lib/home-path';
import { useOnboardingState } from '@/hooks/use-onboarding';
import { useMemo } from 'react';

export function useHomePath() {
  const onboarding = useOnboardingState();
  const filters = useMemo(() => ({
    language: onboarding.data?.target_language || 'en',
    level: onboarding.data?.level?.toLowerCase() ?? undefined,
    motivation: onboarding.data?.goal ? [onboarding.data.goal] : undefined,
    limit: 1,
  }), [onboarding.data]);
  const plan = useTracks(filters);
  const active = useActiveTrack();
  const selected = active.data?.track ?? plan.data?.tracks?.[0];
  const id = selected?.code || selected?.id || '';
  const details = useTrack(id);
  const progress = useTrackProgress(id);
  const local = useCompletedLessons();
  const { refetch: refetchPlan } = plan;
  const { refetch: refetchActive } = active;
  const { refetch: refetchLocal } = local;
  const { refetch: refetchDetails } = details;
  const { refetch: refetchProgress } = progress;
  const refresh = useCallback(() => {
    void refetchPlan();
    void refetchActive();
    void refetchLocal();
    if (id) { void refetchDetails(); void refetchProgress(); }
  }, [id, refetchPlan, refetchActive, refetchLocal, refetchDetails, refetchProgress]);
  const completed = new Set([...(progress.data ?? []), ...(local.data ?? [])]);
  const error = plan.error || details.error || progress.error;
  const loading = onboarding.isLoading || (active.isLoading && plan.isLoading) || (!!id && (details.isLoading || progress.isLoading)) || local.isLoading;
  return {
    track: details.data ?? selected,
    lessons: buildHomePath(details.data?.lessons ?? [], completed, loading || !!error),
    loading, error, refresh,
  };
}
