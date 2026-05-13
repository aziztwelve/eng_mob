import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { GamificationApi } from '@/lib/api-client';
import { USER_STATS_KEY } from '@/hooks/use-user-stats';
import { HEARTS_KEY } from '@/hooks/use-hearts';
import { DAILY_GOAL_KEY } from '@/hooks/use-daily-goal';
import type {
  AddXPResponse,
  DailyGoal,
  UserAchievement,
  UserAchievementsResponse,
  UserStats,
} from '@/types/api';

interface FxResult {
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
  newAchievements: UserAchievement[];
  dailyGoalCompleted: boolean;
}

interface FxOptions {
  /** Inline-payload из complete-step (preferred). */
  xp?: AddXPResponse | null;
  /**
   * Если true — функция не показывает встроенные тосты, только возвращает
   * `FxResult`. UI сам рисует анимации (XPGainAnimation / AchievementModal).
   */
  silent?: boolean;
}

/**
 * Два режима, как и web-версия:
 *
 *   1. Inline-payload — точный xpGained / leveled_up / unlocked /
 *      daily_goal из ответа complete-step.
 *   2. Fallback diff — снимок до vs после (если backend еще не настроен).
 */
export function useLessonGamificationFx() {
  const qc = useQueryClient();

  return useCallback(
    async (opts: FxOptions = {}): Promise<FxResult> => {
      const { xp, silent = false } = opts;

      let result: FxResult;

      if (xp) {
        // === Inline-payload ===
        const beforeGoal = qc.getQueryData<DailyGoal>(DAILY_GOAL_KEY);

        if (xp.stats) qc.setQueryData(USER_STATS_KEY, xp.stats);
        const newAchievements = xp.unlocked_achievements ?? [];
        if (newAchievements.length) {
          const cur =
            qc.getQueryData<UserAchievementsResponse>(['my-achievements'])
              ?.achievements ?? [];
          const haveIds = new Set(cur.map((ua) => ua.achievement?.id));
          const merged = [
            ...cur,
            ...newAchievements.filter((ua) => !haveIds.has(ua.achievement?.id)),
          ];
          qc.setQueryData<UserAchievementsResponse>(['my-achievements'], {
            achievements: merged,
          });
        }
        if (xp.daily_goal_progress) {
          // Подтягиваем целиком DailyGoal из API.
          GamificationApi.getDailyGoal()
            .then((goal) => qc.setQueryData(DAILY_GOAL_KEY, goal))
            .catch(() => undefined);
        }
        qc.invalidateQueries({ queryKey: HEARTS_KEY });
        qc.invalidateQueries({ queryKey: ['xp-history'] });
        qc.invalidateQueries({ queryKey: ['xp-history-infinite'] });

        result = {
          xpGained: xp.transaction?.amount ?? 0,
          leveledUp: !!xp.leveled_up,
          newLevel: xp.new_level ?? xp.stats?.level ?? 1,
          newAchievements,
          dailyGoalCompleted:
            !!xp.daily_goal_progress?.completed &&
            !(beforeGoal?.today?.completed ?? false),
        };
      } else {
        // === Diff fallback ===
        const beforeStats = qc.getQueryData<UserStats>(USER_STATS_KEY);
        const beforeMine = qc.getQueryData<UserAchievementsResponse>([
          'my-achievements',
        ]);
        const beforeGoal = qc.getQueryData<DailyGoal>(DAILY_GOAL_KEY);
        const beforeOwned = new Set<string>(
          (beforeMine?.achievements ?? [])
            .map((ua) => ua.achievement?.id)
            .filter(Boolean) as string[]
        );

        const [afterStats, afterMine, afterGoal] = await Promise.all([
          GamificationApi.getMyStats().catch(() => null),
          GamificationApi.getMyAchievements().catch(() => null),
          GamificationApi.getDailyGoal().catch(() => null),
        ]);

        if (afterStats) qc.setQueryData(USER_STATS_KEY, afterStats);
        if (afterMine) qc.setQueryData(['my-achievements'], afterMine);
        if (afterGoal) qc.setQueryData(DAILY_GOAL_KEY, afterGoal);
        qc.invalidateQueries({ queryKey: HEARTS_KEY });
        qc.invalidateQueries({ queryKey: ['xp-history'] });
        qc.invalidateQueries({ queryKey: ['xp-history-infinite'] });

        result = {
          xpGained:
            afterStats && beforeStats
              ? Math.max(0, afterStats.total_xp - beforeStats.total_xp)
              : afterStats?.total_xp ?? 0,
          leveledUp:
            !!afterStats && !!beforeStats && afterStats.level > beforeStats.level,
          newLevel: afterStats?.level ?? beforeStats?.level ?? 1,
          newAchievements: (afterMine?.achievements ?? []).filter(
            (ua) => ua.achievement?.id && !beforeOwned.has(ua.achievement.id)
          ),
          dailyGoalCompleted:
            !!afterGoal?.today?.completed &&
            !(beforeGoal?.today?.completed ?? false),
        };
      }

      if (!silent) {
        if (result.xpGained > 0) {
          Toast.show({ type: 'success', text1: `+${result.xpGained} XP` });
        }
        if (result.leveledUp) {
          Toast.show({
            type: 'success',
            text1: '🎉 Level up!',
            text2: `Уровень ${result.newLevel}`,
          });
        }
        result.newAchievements.forEach((ua, i) => {
          setTimeout(
            () =>
              Toast.show({
                type: 'success',
                text1: '🏆 ' + (ua.achievement.title ?? 'Achievement'),
                text2: ua.achievement.description,
              }),
            i * 800
          );
        });
        if (result.dailyGoalCompleted) {
          Toast.show({ type: 'success', text1: '🎯 Цель дня выполнена!' });
        }
      }

      return result;
    },
    [qc]
  );
}
