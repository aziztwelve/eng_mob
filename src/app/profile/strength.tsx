import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TrendingDown, TrendingUp } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSkillStrengths, useWeakSkills } from '@/hooks/use-srs';
import { tsToDate } from '@/lib/api-client';
import {
  skillTypeShort,
  type SkillDecay,
  type SkillTypeShort,
} from '@/types/api';
import { ProfileButton as CtaButton, ProfileTabs, ProfileQueryError } from '@/components/profile/profile-ui';

type Filter = 'all' | 'module' | 'lesson';

const TABS = [
  { key: 'all', label: 'stw.tab_all' },
  { key: 'module', label: 'stw.tab_module' },
  { key: 'lesson', label: 'stw.tab_lesson' },
];

/**
 * /profile/strength — карта силы навыков (mirror web).
 *
 * Источник — `user_skill_decay`. course-service создаёт записи через
 * OnLessonCompleted, ежедневный cron в srs-service декрементирует
 * current_strength по decay_rate (default 0.05/day).
 */
export default function StrengthScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');
  const skillType: SkillTypeShort | undefined =
    filter === 'all' ? undefined : filter;

  const weak = useWeakSkills({ skill_type: skillType, limit: 5 });
  const all = useSkillStrengths({ skill_type: skillType, limit: 100 });

  const sorted = useMemo(() => {
    const items = all.data?.skills ?? [];
    return [...items].sort((a, b) => a.current_strength - b.current_strength);
  }, [all.data]);

  return (
    <View className="flex-1">
      <Stack.Screen options={{ title: t('profile.strength_title') }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="w-full max-w-[600px] self-center p-4 gap-4"
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
      >
        <View className="gap-[8px]">

          <Text className="text-mieo-body text-[13px] leading-[19px] font-nunito-medium">
            {t('stw.subtitle')}
          </Text>
        </View>

        <ProfileTabs
          tabs={TABS.map((tab) => ({ ...tab, label: t(tab.label) }))}
          active={filter}
          onChange={(k) => setFilter(k as Filter)}
        />

        {/* Top weak */}
        <View className="bg-mieo-surface border-[1.5px] border-[#C9EDFF] rounded-[24px] p-[16px] gap-[4px]">
          <View className="flex-row items-center justify-between flex-wrap gap-[10px] mb-[4px]">
            <View className="flex-row items-center gap-[8px]">
              <TrendingDown size={18} color="#FFB338" />
              <Text className="text-mieo-heading font-nunito-black text-[16px]">{t('stw.weak')}</Text>
            </View>
            <View className="w-[130px]">
              <CtaButton label={t('stw.boost')} onPress={() => router.push('/practice/session')} />
            </View>
          </View>
          {weak.isError ? <ProfileQueryError onRetry={() => { void weak.refetch(); }} /> : weak.isLoading ? (
            <ActivityIndicator color="#1AB3FF" className="my-3" />
          ) : (weak.data?.skills?.length ?? 0) === 0 ? (
            <Text className="text-mieo-body font-nunito-semibold text-[13px] mt-[6px]">{t('stw.no_weak')}</Text>
          ) : (
            <View className="gap-[12px] mt-[4px]">
              {weak.data?.skills?.map((sk) => (
                <SkillBar key={`${sk.user_id}:${sk.skill_id}`} skill={sk} />
              ))}
            </View>
          )}
        </View>

        {/* All */}
        <View className="bg-mieo-surface border-[1.5px] border-[#C9EDFF] rounded-[24px] p-[16px] gap-[4px]">
          <View className="flex-row items-center gap-[8px]">
            <TrendingUp size={18} color="#34D399" />
            <Text className="text-mieo-heading font-nunito-black text-[16px]">{t('stw.all')}</Text>
            {sorted.length > 0 && (
              <Text className="text-mieo-body font-nunito-extrabold text-[14px]">· {sorted.length}</Text>
            )}
          </View>

          {all.isError ? <ProfileQueryError onRetry={() => { void all.refetch(); }} /> : all.isLoading ? (
            <ActivityIndicator color="#1AB3FF" className="my-3" />
          ) : sorted.length === 0 ? (
            <Text className="text-mieo-body font-nunito-semibold text-[13px] mt-[6px]">
              {t('stw.empty')}
            </Text>
          ) : (
            <View className="gap-[12px] mt-[8px]">
              {sorted.map((sk) => (
                <SkillBar key={`${sk.user_id}:${sk.skill_id}`} skill={sk} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function SkillBar({ skill }: { skill: SkillDecay }) {
  const { t } = useTranslation();
  const pct = Math.round(Math.max(0, Math.min(1, skill.current_strength)) * 100);
  const last = tsToDate(skill.last_practiced_at ?? null);
  const kind = skillTypeShort(skill.skill_type);
  const barColor = pct >= 80 ? '#34D399' : pct >= 50 ? '#FFB338' : '#FF6FA0';

  return (
    <View className="flex-row items-center gap-[12px]">
      <View className="flex-1 gap-[6px] min-w-[0px]">
        <View className="flex-row items-center gap-[8px]">
          {kind && (
            <View className="bg-[#F0F9FF] rounded-[999px] px-[8px] py-[2px]">
              <Text className="text-mieo-heading text-[10px] font-nunito-extrabold uppercase">{kind === 'module' ? t('stw.module') : t('stw.lesson')}</Text>
            </View>
          )}
          <Text className="text-mieo-body text-[12px] flex-1 font-mono" numberOfLines={1}>{skill.skill_id}</Text>
        </View>
        <View className="h-[10px] rounded-[6px] bg-[#F0F9FF] overflow-hidden">
          <View className="h-full rounded-md" style={{ width: `${pct}%`, backgroundColor: barColor }} />
        </View>
      </View>
      <View className="items-end">
        <Text className="text-mieo-heading font-nunito-black text-[17px]">{pct}%</Text>
        <Text className="text-mieo-body text-[10px] font-nunito-extrabold uppercase tracking-[0.5px]">{last ? last.toLocaleDateString() : '—'}</Text>
      </View>
    </View>
  );
}
