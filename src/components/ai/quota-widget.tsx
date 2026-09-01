import React from 'react';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { Crown, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAIQuota } from '@/hooks/use-ai';
import type { AIQuotaStatus } from '@/types/api';
import { glass } from '@/components/sunset';

export function QuotaWidget({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading } = useAIQuota();

  if (isLoading) {
    return (
      <View style={[compact ? s.compactLoader : s.fullLoader, glass]}>
        <ActivityIndicator color="rgba(255,255,255,0.5)" size="small" />
      </View>
    );
  }

  if (!data) return null;

  const isPremium = data.plan === 'premium';

  if (compact) {
    return (
      <View style={s.compactRow}>
        <View style={[s.planPill, isPremium ? s.planPillGold : s.planPillFree]}>
          {isPremium
            ? <Crown size={11} color="#f59e0b" />
            : <Sparkles size={11} color="#FFD84A" />}
          <Text style={[s.planPillText, { color: isPremium ? '#f59e0b' : '#FFD84A' }]}>
            {isPremium ? 'Premium' : 'Free'}
          </Text>
        </View>
        {!isPremium && (
          <>
            <Pill label={t('ai.chats')} used={data.chat_used} limit={data.chat_limit} />
            <Pill label={t('ai.writing')} used={data.writing_used} limit={data.writing_limit} />
            <Pill label={t('ai.voice_short')} used={Math.round(data.voice_minutes_used * 10) / 10} limit={data.voice_minutes_limit} suffix={t('ai.min_short')} />
          </>
        )}
      </View>
    );
  }

  return (
    <View style={[s.fullCard, glass]}>
      <View style={s.fullHeader}>
        <View style={s.fullHeaderLeft}>
          <Sparkles size={16} color="#FFD84A" />
          <Text style={s.fullTitle}>{t('ai.quota_title')}</Text>
        </View>
        <View style={[s.planPill, isPremium ? s.planPillGold : { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
          {isPremium && <Crown size={11} color="#f59e0b" />}
          <Text style={[s.planPillText, { color: isPremium ? '#f59e0b' : 'rgba(255,255,255,0.6)' }]}>
            {isPremium ? 'Premium' : 'Free'}
          </Text>
        </View>
      </View>
      <View style={s.countersRow}>
        <Counter label={t('ai.chats')} used={data.chat_used} limit={data.chat_limit} />
        <Counter label={t('ai.voice_min')} used={Math.round(data.voice_minutes_used * 10) / 10} limit={data.voice_minutes_limit} />
        <Counter label={t('ai.writing')} used={data.writing_used} limit={data.writing_limit} />
      </View>
      {data.resets_at && !isPremium && (
        <Text style={s.resetsText}>{t('ai.resets', { time: fmtResetsAt(data.resets_at) })}</Text>
      )}
    </View>
  );
}

function Counter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const unlimited = limit < 0;
  const exceeded = !unlimited && used >= limit;
  const color = exceeded ? '#f87171' : unlimited ? '#f59e0b' : '#fff';
  return (
    <View style={{ flex: 1 }}>
      <Text style={s.counterLabel}>{label}</Text>
      <Text style={[s.counterValue, { color }]}>
        {used}
        <Text style={s.counterLimit}>{unlimited ? ' ∞' : ` / ${limit}`}</Text>
      </Text>
    </View>
  );
}

function Pill({ label, used, limit, suffix }: { label: string; used: number; limit: number; suffix?: string }) {
  if (limit < 0) {
    return (
      <View style={[s.pill, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
        <Text style={[s.pillText, { color: '#f59e0b' }]}>{label}: ∞</Text>
      </View>
    );
  }
  const exceeded = used >= limit;
  return (
    <View style={[s.pill, exceeded ? { backgroundColor: 'rgba(248,113,113,0.12)' } : { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
      <Text style={[s.pillText, exceeded ? { color: '#f87171' } : { color: 'rgba(255,255,255,0.8)' }]}>
        {label}: {used}/{limit}{suffix ? suffix : ''}
      </Text>
    </View>
  );
}

function fmtResetsAt(iso: string): string {
  try { const d = new Date(iso); return isNaN(d.getTime()) ? iso : d.toLocaleString('ru-RU'); }
  catch { return iso; }
}

export function hasQuotaLeft(q: AIQuotaStatus | undefined, kind: 'chat' | 'voice' | 'writing'): boolean {
  if (!q) return true;
  if (q.plan === 'premium') return true;
  if (kind === 'chat') return q.chat_limit < 0 || q.chat_used < q.chat_limit;
  if (kind === 'voice') return q.voice_minutes_limit < 0 || q.voice_minutes_used < q.voice_minutes_limit;
  return q.writing_limit < 0 || q.writing_used < q.writing_limit;
}

const s = StyleSheet.create({
  compactLoader: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', marginTop: 12 },
  fullLoader: { borderRadius: 22, padding: 20, alignItems: 'center', marginTop: 14 },

  compactRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginTop: 12 },

  planPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  planPillFree: { backgroundColor: 'rgba(255,216,74,0.12)' },
  planPillGold: { backgroundColor: 'rgba(245,158,11,0.12)' },
  planPillText: { fontSize: 11, fontWeight: '800' },

  pill: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  pillText: { fontSize: 11, fontWeight: '700' },

  fullCard: { borderRadius: 22, padding: 16, gap: 12, marginTop: 14 },
  fullHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fullHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  fullTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  countersRow: { flexDirection: 'row', gap: 4 },
  counterLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  counterValue: { fontSize: 22, fontWeight: '900', lineHeight: 28 },
  counterLimit: { fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: '600' },
  resetsText: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '500' },
});
