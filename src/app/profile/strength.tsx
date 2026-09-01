import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Layers, TrendingDown, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSkillStrengths, useWeakSkills } from '@/hooks/use-srs';
import { tsToDate } from '@/lib/api-client';
import {
  skillTypeShort,
  type SkillDecay,
  type SkillTypeShort,
} from '@/types/api';
import { glass, CtaButton, SunsetTabs } from '@/components/sunset';

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
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: t('profile.strength_title') }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 + insets.bottom }}
      >
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Layers size={28} color="#FFD84A" />
            <Text style={s.title}>{t('profile.strength')}</Text>
          </View>
          <Text style={s.subtitle}>
            {t('stw.subtitle')}
          </Text>
        </View>

        <SunsetTabs
          tabs={TABS.map((tab) => ({ ...tab, label: t(tab.label) }))}
          active={filter}
          onChange={(k) => setFilter(k as Filter)}
        />

        {/* Top weak */}
        <View style={[glass, s.card]}>
          <View style={s.cardHead}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TrendingDown size={18} color="#FFB338" />
              <Text style={s.cardTitle}>{t('stw.weak')}</Text>
            </View>
            <View style={{ width: 130 }}>
              <CtaButton label={t('stw.boost')} onPress={() => router.push('/practice/session')} />
            </View>
          </View>
          {weak.isLoading ? (
            <ActivityIndicator color="#FFD84A" style={{ marginVertical: 12 }} />
          ) : (weak.data?.skills?.length ?? 0) === 0 ? (
            <Text style={s.empty}>{t('stw.no_weak')}</Text>
          ) : (
            <View style={{ gap: 12, marginTop: 4 }}>
              {weak.data?.skills?.map((sk) => (
                <SkillBar key={`${sk.user_id}:${sk.skill_id}`} skill={sk} />
              ))}
            </View>
          )}
        </View>

        {/* All */}
        <View style={[glass, s.card]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="#34D399" />
            <Text style={s.cardTitle}>{t('stw.all')}</Text>
            {sorted.length > 0 && (
              <Text style={s.count}>· {sorted.length}</Text>
            )}
          </View>

          {all.isLoading ? (
            <ActivityIndicator color="#FFD84A" style={{ marginVertical: 12 }} />
          ) : sorted.length === 0 ? (
            <Text style={s.empty}>
              {t('stw.empty')}
            </Text>
          ) : (
            <View style={{ gap: 12, marginTop: 8 }}>
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {kind && (
            <View style={s.kindPill}>
              <Text style={s.kindText}>{kind === 'module' ? t('stw.module') : t('stw.lesson')}</Text>
            </View>
          )}
          <Text style={s.skillId} numberOfLines={1}>{skill.skill_id}</Text>
        </View>
        <View style={s.barTrack}>
          <View style={{ height: '100%', borderRadius: 6, width: `${pct}%`, backgroundColor: barColor }} />
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={s.pct}>{pct}%</Text>
        <Text style={s.pctDate}>{last ? last.toLocaleDateString() : '—'}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  title: { color: '#fff', fontWeight: '900', fontSize: 28 },
  subtitle: { color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 19, fontWeight: '500' },

  card: { borderRadius: 24, padding: 16, gap: 4 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  cardTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  count: { color: 'rgba(255,255,255,0.7)', fontWeight: '800', fontSize: 14 },
  empty: { color: 'rgba(255,255,255,0.72)', fontWeight: '600', fontSize: 13, marginTop: 6 },

  kindPill: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  kindText: { color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  skillId: { color: 'rgba(255,255,255,0.7)', fontSize: 12, flex: 1, fontFamily: 'monospace' },
  barTrack: { height: 10, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.16)', overflow: 'hidden' },
  pct: { color: '#fff', fontWeight: '900', fontSize: 17 },
  pctDate: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
});
