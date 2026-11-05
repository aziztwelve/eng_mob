import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';

import { useMistakes } from '@/hooks/use-srs';
import { tsToDate } from '@/lib/api-client';
import type { Mistake, MistakeFilter } from '@/types/api';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 20;

const TABS: { value: MistakeFilter; label: string }[] = [
  { value: 'unresolved', label: 'practice.tab_active' },
  { value: 'resolved', label: 'practice.tab_resolved' },
  { value: 'all', label: 'practice.tab_all' },
];

/**
 * /practice/mistakes — список ошибок (mirror web mistakes/page).
 *
 * Источник правды — `user_mistakes` в srs-service. Записи отмечаются
 * `is_resolved=TRUE` автоматически при первом корректном ответе на тот же
 * шаг (см. step-validation.recordSRS). Здесь — только просмотр.
 */
export default function MistakesScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<MistakeFilter>('unresolved');
  const [page, setPage] = useState(0);

  const onTabChange = (v: MistakeFilter) => {
    setTab(v);
    setPage(0);
  };

  const q = useMistakes({
    resolved: tab,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const list = q.data?.mistakes ?? [];
  const total = q.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <View className="flex-1 bg-transparent">
      <Stack.Screen options={{ title: t('practice.mistakes_title') }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <Pressable
          onPress={() => router.navigate('/(tabs)/practice')}
          className="flex-row items-center gap-1 self-start active:opacity-60"
        >
          <ArrowLeft size={16} color="#5D686F" />
          <Text className="text-mieo-body font-nunito-bold">{t('practice.to_practice')}</Text>
        </Pressable>

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <AlertTriangle size={28} color="#f97316" />
            <Text className="text-mieo-heading font-nunito-black text-3xl">{t('practice.mistakes_title')}</Text>
          </View>
          <Text className="text-mieo-body font-nunito-medium">
            {t('practice.mistakes_description')}
          </Text>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-mieo-surface rounded-2xl border-2 border-mieo-stroke p-1">
          {TABS.map((tabItem) => {
            const active = tab === tabItem.value;
            return (
              <Pressable
                key={tabItem.value}
                onPress={() => onTabChange(tabItem.value)}
                className={`flex-1 rounded-xl py-2 items-center ${
                  active ? 'bg-mieo-primary' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`font-nunito-bold text-xs ${
                    active ? 'text-white' : 'text-mieo-heading'
                  }`}
                >
                  {t(tabItem.label as never)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* List */}
        {q.isPending ? (
          <View className="bg-mieo-surface rounded-3xl border-[1.5px] border-b-4 border-mieo-stroke p-12 items-center justify-center">
            <ActivityIndicator color="#2FA8E6" />
          </View>
        ) : q.isError ? (
          <View accessibilityRole="alert" className="bg-mieo-surface rounded-3xl border-[1.5px] border-b-4 border-mieo-stroke p-8 items-center gap-4">
            <Text className="text-mieo-heading font-nunito-black text-xl text-center">
              {t('practice.mistakes_load_error')}
            </Text>
            <Text className="text-mieo-body font-nunito-medium text-center">
              {t('practice.mistakes_load_error_hint')}
            </Text>
            <Pressable
              onPress={() => void q.refetch()}
              disabled={q.isFetching}
              accessibilityRole="button"
              className={`bg-mieo-primary rounded-2xl px-5 py-3 ${q.isFetching ? 'opacity-40' : 'active:opacity-80'}`}
            >
              <Text className="text-white font-nunito-bold">
                {t('practice.retry')}
              </Text>
            </Pressable>
          </View>
        ) : list.length === 0 ? (
          <View className="bg-mieo-surface rounded-3xl border-[1.5px] border-b-4 border-mieo-stroke p-8 items-center gap-2">
            <Text className="text-mieo-heading font-nunito-black text-xl">
              {t('practice.mistakes_empty')}
            </Text>
            <Text className="text-mieo-body font-nunito-medium text-center">
              {tab === 'unresolved'
                ? t('practice.all_fixed')
                : tab === 'resolved'
                  ? t('practice.no_resolved')
                  : t('practice.mistakes_none')}
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {list.map((m) => (
              <MistakeRow key={m.id} mistake={m} />
            ))}
          </View>
        )}

        {/* Pagination */}
        {!q.isError && totalPages > 1 && (
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-mieo-body text-xs font-nunito-bold tabular-nums">
              {t('practice.mistakes_pagination', { page: page + 1, pages: totalPages, total })}
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || q.isFetching}
                className={`flex-row items-center bg-mieo-surface border-2 border-mieo-stroke rounded-2xl px-3 py-2 ${
                  page === 0 || q.isFetching ? 'opacity-40' : 'active:opacity-80'
                }`}
              >
                <ChevronLeft size={16} color="#ffffff" />
                <Text className="text-mieo-heading font-nunito-bold text-xs ml-1">
                  {t('practice.mistakes_previous')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  setPage((p) => (p + 1 < totalPages ? p + 1 : p))
                }
                disabled={page + 1 >= totalPages || q.isFetching}
                className={`flex-row items-center bg-mieo-surface border-2 border-mieo-stroke rounded-2xl px-3 py-2 ${
                  page + 1 >= totalPages || q.isFetching
                    ? 'opacity-40'
                    : 'active:opacity-80'
                }`}
              >
                <Text className="text-mieo-heading font-nunito-bold text-xs mr-1">
                  {t('practice.mistakes_next')}
                </Text>
                <ChevronRight size={16} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MistakeRow({ mistake }: { mistake: Mistake }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const last = tsToDate(mistake.last_made_at ?? null);
  const resolved = mistake.is_resolved;
  const hasAnswer =
    mistake.incorrect_answer &&
    Object.keys(mistake.incorrect_answer).length > 0;

  return (
    <View className="bg-mieo-surface rounded-2xl border-[1.5px] border-b-4 border-mieo-stroke p-4 gap-2">
      <View className="flex-row items-center justify-between flex-wrap gap-2">
        <View className="flex-row items-center gap-2 flex-wrap">
          {resolved ? (
            <View className="flex-row items-center gap-1 bg-emerald-500 rounded-full px-3 py-1">
              <CheckCircle2 size={12} color="#ffffff" />
              <Text className="text-white text-xs font-nunito-bold">{t('practice.fixed')}</Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-1 bg-orange-500 rounded-full px-3 py-1">
              <AlertTriangle size={12} color="#ffffff" />
              <Text className="text-white text-xs font-nunito-bold">
                {t('practice.not_fixed')}
              </Text>
            </View>
          )}
          <Text className="text-mieo-body text-sm font-nunito-bold tabular-nums">
            ×{mistake.times_made}
          </Text>
        </View>
        <Text className="text-mieo-body text-xs font-nunito-bold">
          {last ? last.toLocaleDateString() : '—'}
        </Text>
      </View>

      <Text className="text-mieo-body text-xs font-mono" numberOfLines={1}>
        {t('practice.mistakes_step', { id: mistake.step_id })}
      </Text>

      {hasAnswer && (
        <View>
          <Pressable
            onPress={() => setExpanded((e) => !e)}
            className="active:opacity-60"
          >
            <Text className="text-mieo-body text-xs font-nunito-bold">
              {expanded ? t('practice.mistakes_hide_answer') : t('practice.mistakes_show_answer')}
            </Text>
          </Pressable>
          {expanded && (
            <View className="bg-mieo-bg rounded-lg p-3 mt-2">
              <Text className="text-mieo-heading text-xs font-mono">
                {JSON.stringify(mistake.incorrect_answer, null, 2)}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
