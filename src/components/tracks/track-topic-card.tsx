import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Books, ChatsCircle, Star, Trophy, Flag, type Icon as PhosphorIcon } from 'phosphor-react-native';
import type { LessonDetails } from '@/types/api';

const glass = {
  backgroundColor: 'rgba(255,255,255,0.14)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.22)',
} as const;

/** Темы-цвета и иконки в стиле AI-hub (tint из палитры QUICK/TOOLS). */
const THEMES: { tint: string; Icon: PhosphorIcon }[] = [
  { tint: '#5B6BFF', Icon: Books },
  { tint: '#3FA9FF', Icon: ChatsCircle },
  { tint: '#F5A623', Icon: Star },
  { tint: '#2EC4A0', Icon: Trophy },
  { tint: '#F2542D', Icon: Flag },
];

function themeFor(code: string) {
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  return THEMES[hash % THEMES.length];
}

interface TrackTopicCardProps {
  code: string;
  title: string;
  description?: string;
  lessons?: LessonDetails[];
  /** Завершённые lesson_id (серверный прогресс ∪ локальный кэш). */
  completed?: Set<string>;
  loading?: boolean;
}

/** Карточка трека в стиле AI-hub «Инструменты»: glass-карточка с
 *  цветным icon-thumb, прогресс-баром уроков и счётчиком. */
export function TrackTopicCard({ code, title, description, lessons, completed, loading }: TrackTopicCardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { tint, Icon } = themeFor(code);

  const list = lessons ?? [];
  const done = completed ?? new Set<string>();
  const doneCount = list.filter((lesson) => done.has(lesson.id)).length;
  const pct = list.length > 0 ? Math.round((doneCount / list.length) * 100) : 0;

  return (
    <Pressable style={[s.card, glass]} onPress={() => router.push(`/(tabs)/tracks/${code}`)}>
      <View style={[s.thumb, { backgroundColor: `${tint}26`, borderColor: `${tint}66` }]}>
        <Icon size={24} color={tint} weight="duotone" />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={s.titleRow}>
          <Text style={s.title} numberOfLines={1}>
            {title}
          </Text>
          {list.length > 0 && (
            <Text style={[s.count, { color: tint }]}>
              {doneCount}/{list.length}
            </Text>
          )}
        </View>

        {!!description && (
          <Text style={s.desc} numberOfLines={1}>
            {description}
          </Text>
        )}

        {loading ? (
          <ActivityIndicator size="small" color={tint} style={s.loader} />
        ) : list.length > 0 ? (
          <>
            <View style={s.barTrack}>
              <View style={[s.barFill, { width: `${pct}%`, backgroundColor: tint }]} />
            </View>
            <Text style={s.barText}>
              {pct >= 100 ? t('tracks.track_passed') : pct > 0 ? t('tracks.progress_left', { pct, left: list.length - doneCount }) : t('tracks.start_first_lessons', { count: list.length })}
            </Text>
          </>
        ) : (
          <Text style={s.barText}>{t('tracks.lessons_soon')}</Text>
        )}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: '#fff', fontSize: 15.5, fontWeight: '800', flex: 1 },
  count: { fontSize: 13, fontWeight: '900' },
  desc: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  loader: { marginTop: 8 },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
    marginTop: 9,
  },
  barFill: { height: '100%', borderRadius: 3 },
  barText: { color: 'rgba(255,255,255,0.66)', fontSize: 11, fontWeight: '700', marginTop: 6 },
});
