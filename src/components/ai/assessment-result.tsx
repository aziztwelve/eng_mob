import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { glass } from '@/components/sunset';
import type { AIWritingFeedback, AssessWritingResponse } from '@/types/api';

export function AssessmentResult({ data }: { data: AssessWritingResponse }) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: 12 }}>
      {/* Overall */}
      <View style={[s.card, glass]}>
        <View style={s.overallRow}>
          <View>
            <Text style={s.label}>{t('ai.overall')}</Text>
            <Text style={[s.bigScore, { color: scoreColor(data.overall_score) }]}>
              {data.overall_score}
              <Text style={s.bigScoreDenom}> /100</Text>
            </Text>
          </View>
          <View style={[s.badgeWrap, { backgroundColor: scoreBadgeBg(data.overall_score), borderColor: scoreBorder(data.overall_score) }]}>
            <Text style={[s.badgeText, { color: scoreColor(data.overall_score) }]}>
              {t(scoreLabelKey(data.overall_score))}
            </Text>
          </View>
        </View>
        <View style={s.barsGrid}>
          <ScoreBar label={t('ai.grammar')} value={data.grammar_score} />
          <ScoreBar label={t('ai.vocabulary')} value={data.vocabulary_score} />
          <ScoreBar label={t('ai.coherence')} value={data.coherence_score} />
          <ScoreBar label={t('ai.style')} value={data.style_score} />
        </View>
      </View>

      {/* Corrected text */}
      {data.corrected_text ? (
        <View style={[s.card, glass]}>
          <Text style={s.sectionTitle}>{t('ai.corrected')}</Text>
          <View style={s.correctedBox}>
            <Text style={s.correctedText}>{data.corrected_text}</Text>
          </View>
        </View>
      ) : null}

      {/* Feedback */}
      {data.feedback && data.feedback.length > 0 ? (
        <View style={[s.card, glass]}>
          <Text style={s.sectionTitle}>{t('ai.feedback_title')}</Text>
          <View style={{ gap: 8 }}>
            {data.feedback.map((f, i) => <FeedbackRow key={i} item={f} />)}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={s.barItem}>
      <View style={s.barHeader}>
        <Text style={s.barLabel}>{label}</Text>
        <Text style={[s.barValue, { color: scoreColor(value) }]}>{value}</Text>
      </View>
      <View style={s.barBg}>
        <View style={[s.barFill, { width: `${pct}%` as any, backgroundColor: scoreBarColor(value) }]} />
      </View>
    </View>
  );
}

function FeedbackRow({ item }: { item: AIWritingFeedback }) {
  return (
    <View style={[s.feedbackRow, glass]}>
      <View style={[s.catBadge, { backgroundColor: categoryBg(item.category) }]}>
        <Text style={[s.catText, { color: categoryColor(item.category) }]}>
          {categoryLabel(item.category)}
        </Text>
      </View>
      <Text style={s.feedbackIssue}>{item.issue}</Text>
      <Text style={s.feedbackSugg}>💡 {item.suggestion}</Text>
    </View>
  );
}

// helpers
function scoreColor(v: number) { return v >= 80 ? '#10b981' : v >= 60 ? '#f59e0b' : '#f87171'; }
function scoreBarColor(v: number) { return v >= 80 ? '#10b981' : v >= 60 ? '#f59e0b' : '#f87171'; }
function scoreBadgeBg(v: number) { return v >= 80 ? 'rgba(16,185,129,0.12)' : v >= 60 ? 'rgba(245,158,11,0.12)' : 'rgba(248,113,113,0.12)'; }
function scoreBorder(v: number) { return v >= 80 ? 'rgba(16,185,129,0.3)' : v >= 60 ? 'rgba(245,158,11,0.3)' : 'rgba(248,113,113,0.3)'; }
function scoreLabelKey(v: number) { return v >= 90 ? 'ai.score_great' : v >= 75 ? 'ai.score_good' : v >= 60 ? 'ai.score_ok' : v >= 40 ? 'ai.score_weak' : 'ai.score_bad'; }
function categoryLabel(c: string) { return c === 'grammar' ? 'Грамматика' : c === 'vocabulary' ? 'Лексика' : c === 'coherence' ? 'Связность' : c === 'style' ? 'Стиль' : c; }
function categoryBg(c: string) { return c === 'grammar' ? 'rgba(244,63,94,0.15)' : c === 'vocabulary' ? 'rgba(59,130,246,0.15)' : c === 'coherence' ? 'rgba(139,92,246,0.15)' : c === 'style' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.1)'; }
function categoryColor(c: string) { return c === 'grammar' ? '#f43f5e' : c === 'vocabulary' ? '#3b82f6' : c === 'coherence' ? '#8b5cf6' : c === 'style' ? '#f59e0b' : '#fff'; }

const s = StyleSheet.create({
  card: { borderRadius: 22, padding: 16, gap: 12 },
  label: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },

  overallRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  bigScore: { fontSize: 46, fontWeight: '900', lineHeight: 52 },
  bigScoreDenom: { fontSize: 20, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  badgeWrap: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  badgeText: { fontSize: 13, fontWeight: '800' },

  barsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  barItem: { gap: 4, width: '47%' },
  barHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  barLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  barValue: { fontSize: 14, fontWeight: '900' },
  barBg: { height: 5, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },

  correctedBox: { backgroundColor: 'rgba(16,185,129,0.06)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  correctedText: { color: '#fff', fontSize: 14, fontWeight: '500', lineHeight: 22 },

  feedbackRow: { borderRadius: 16, padding: 12, gap: 5 },
  catBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  catText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  feedbackIssue: { color: '#fff', fontSize: 13, fontWeight: '700' },
  feedbackSugg: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '500' },
});
