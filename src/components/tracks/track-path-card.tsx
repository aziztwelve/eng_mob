import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Lock, Play, Sparkle } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import type { LessonDetails } from '@/types/api';

const GOLD = ['#FFDF5E', '#FFB338'] as const;
const glass = {
  backgroundColor: 'rgba(255,255,255,0.10)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.20)',
} as const;

/** Акцентные темы: градиент для узлов и полосы. */
const THEMES = [
  { main: '#5B6BFF', dark: '#8B5CF6' },
  { main: '#2EC4A0', dark: '#1FA37F' },
  { main: '#FF9600', dark: '#FF6B35' },
  { main: '#1CB0F6', dark: '#5B6BFF' },
  { main: '#F25B6E', dark: '#CE82FF' },
] as const;

function themeFor(code: string) {
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = (hash * 31 + code.charCodeAt(i)) >>> 0;
  return THEMES[hash % THEMES.length];
}

interface TrackPathCardProps {
  code: string;
  title: string;
  lessons?: LessonDetails[];
  completed?: Set<string>;
  loading?: boolean;
}

/** Карточка трека — вертикальный timeline: узлы-уроки слева на единой
 *  линии, текущий урок светится, внизу — широкий CTA «Продолжить». */
export function TrackPathCard({ code, title, lessons, completed, loading }: TrackPathCardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = themeFor(code);

  const list = lessons ?? [];
  const done = completed ?? new Set<string>();

  const isDone = (i: number) => !!list[i]?.id && done.has(list[i].id);
  const isUnlocked = (i: number) => i === 0 || isDone(i) || isDone(i - 1);
  const currentIdx = list.findIndex((_, i) => isUnlocked(i) && !isDone(i));
  const doneCount = list.filter((l) => done.has(l.id)).length;
  const pct = list.length > 0 ? Math.round((doneCount / list.length) * 100) : 0;

  const openLesson = (i: number) => {
    if (!isUnlocked(i)) {
      Toast.show({ type: 'info', text1: t('lesson.locked') });
      return;
    }
    router.push(`/learn/${list[i].id}`);
  };

  const openTrack = () => router.push(`/(tabs)/tracks/${code}`);

  const ROW_H = 62;        // высота строки урока

  return (
    <View style={[s.card, glass]}>
      {/* Цветная акцентная полоса сверху */}
      <LinearGradient
        colors={[theme.main, theme.dark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.accent}
      />

      {/* Заголовок трека + прогресс */}
      <Pressable onPress={openTrack} style={s.head}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.title} numberOfLines={1}>{title}</Text>
          <View style={s.metaRow}>
            <View style={s.barTrack}>
              <LinearGradient
                colors={[theme.main, theme.dark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[s.barFill, { width: `${pct}%` }]}
              />
            </View>
            <Text style={[s.pctText, { color: theme.main }]}>{pct}%</Text>
          </View>
        </View>
        <Sparkle size={22} color={theme.main} style={{ marginTop: 2 }} />
      </Pressable>

      {/* Timeline уроков */}
      {list.length === 0 ? (
        <View style={s.emptyWrap}>
          {loading ? (
            <ActivityIndicator color={theme.main} />
          ) : (
            <Text style={s.emptyText}>{t('tracks.lessons_soon')}</Text>
          )}
        </View>
      ) : (
        <View style={s.timeline}>
          {/* Единая вертикальная линия */}
          <View
            style={[
              s.line,
              { top: ROW_H / 2, height: Math.max(0, (list.length - 1) * ROW_H) },
            ]}
          >
            <View
              style={[
                s.lineFill,
                {
                  height: currentIdx > 0 ? currentIdx * ROW_H : 0,
                  backgroundColor: theme.main,
                },
              ]}
            />
          </View>

          {list.map((lesson, i) => {
            const isDoneRow = isDone(i);
            const unlocked = isUnlocked(i);
            const isCurrent = i === currentIdx;
            return (
              <Pressable
                key={lesson.id}
                onPress={() => openLesson(i)}
                style={[s.row, isCurrent && s.rowCurrent]}
              >
                {/* Узел на линии */}
                <View style={s.dotWrap}>
                  {isDoneRow ? (
                    <LinearGradient
                      colors={[theme.main, theme.dark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={s.dotDone}
                    >
                      <Check size={9} color="#fff" strokeWidth={4} />
                    </LinearGradient>
                  ) : isCurrent ? (
                    <>
                      <View style={[s.dotHalo, { borderColor: theme.main }]} />
                      <View style={[s.dotCurrent, { backgroundColor: theme.main }]} />
                    </>
                  ) : (
                    <View style={[s.dotLocked, unlocked && { borderColor: theme.main }]} />
                  )}
                </View>

                {/* Текст урока */}
                <View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
                  <Text
                    style={[s.lessonTitle, isCurrent && { color: '#fff' }, !unlocked && s.dim]}
                    numberOfLines={1}
                  >
                    {lesson.title}
                  </Text>
                  <Text style={[s.lessonSub, isCurrent && { color: 'rgba(255,255,255,0.66)' }]} numberOfLines={1}>
                    {isDoneRow ? t('tracks.passed') : isCurrent ? t('tracks.next_lesson') : t('tracks.lesson_n', { n: i + 1 })}
                  </Text>
                </View>

                {/* Действие справа */}
                {isCurrent ? (
                  <LinearGradient
                    colors={GOLD}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.playBtn}
                  >
                    <Play size={15} color="#3D0A1A" fill="#3D0A1A" />
                  </LinearGradient>
                ) : isDoneRow ? (
                  <View style={s.replayBtn}>
                    <Play size={13} color="rgba(255,255,255,0.6)" fill="rgba(255,255,255,0.6)" />
                  </View>
                ) : (
                  <Lock size={15} color="rgba(255,255,255,0.3)" />
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Широкий CTA */}
      {currentIdx >= 0 && list.length > 0 && (
        <Pressable onPress={() => openLesson(currentIdx)} style={s.ctaWrap}>
          <LinearGradient
            colors={[theme.main, theme.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.cta}
          >
            <Play size={16} color="#fff" fill="#fff" />
            <Text style={s.ctaText}>{t('tracks.continue_lesson', { n: currentIdx + 1 })}</Text>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 22, overflow: 'hidden', marginBottom: 16 },

  accent: { height: 4 },

  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  title: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  barTrack: {
    flex: 1, height: 6, borderRadius: 3, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  barFill: { height: '100%', borderRadius: 3 },
  pctText: { fontSize: 13, fontWeight: '900', minWidth: 34, textAlign: 'right' },

  timeline: { position: 'relative', paddingHorizontal: 16 },
  line: { position: 'absolute', left: 16 + 7, width: 2, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 1, overflow: 'hidden' },
  lineFill: { width: '100%' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 62,
    borderRadius: 14,
    paddingHorizontal: 4,
  },
  rowCurrent: { backgroundColor: 'rgba(255,255,255,0.07)' },

  dotWrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  dotDone: {
    width: 14, height: 14, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  dotCurrent: { width: 10, height: 10, borderRadius: 5 },
  dotHalo: {
    position: 'absolute', width: 20, height: 20, borderRadius: 10, borderWidth: 2,
  },
  dotLocked: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
  },

  lessonTitle: { color: 'rgba(255,255,255,0.88)', fontSize: 14.5, fontWeight: '800' },
  lessonSub: { color: 'rgba(255,255,255,0.42)', fontSize: 11.5, fontWeight: '700', marginTop: 2 },
  dim: { color: 'rgba(255,255,255,0.5)' },

  playBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FFD84A', shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  replayBtn: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  ctaWrap: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 16 },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 13,
  },
  ctaText: { color: '#fff', fontSize: 14.5, fontWeight: '900', letterSpacing: 0.2 },

  emptyWrap: { minHeight: 90, alignItems: 'center', justifyContent: 'center', padding: 16 },
  emptyText: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '700' },
});
