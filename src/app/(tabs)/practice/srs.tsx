import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Stack, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSrsStats, useMistakes } from '@/hooks/use-srs';
import { GradientTitle, neon, neonStyles } from '@/components/neon-screen';

const S = {
  surface: neonStyles.surface,
} as const;

const MODES = [
  { emoji: '🔤', title: 'Перевод',     sub: 'Translate',   bg: 'rgba(46,236,200,0.14)', href: '/practice/session?mode=translate' },
  { emoji: '🔗', title: 'Пары',        sub: 'Match pairs', bg: 'rgba(40,220,233,0.14)', href: '/practice/session?mode=match' },
  { emoji: '🎧', title: 'Аудирование', sub: 'Listening',   bg: 'rgba(255,213,79,0.14)', href: '/practice/session?mode=listening' },
  { emoji: '✏️', title: 'Пропуски',    sub: 'Fill blank',  bg: 'rgba(255,147,68,0.14)', href: '/practice/session?mode=fill_blank' },
] as const;

export default function PracticeLandingScreen() {
  const stats = useSrsStats();
  const mistakes = useMistakes({ resolved: 'unresolved', limit: 1 });

  const dueNow = stats.data?.due_now ?? 0;
  const unresolvedMistakes = mistakes.data?.total ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <Stack.Screen options={{ title: 'Практика' }} />
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 110, gap: 0 }}>
        {/* Title */}
        <GradientTitle width={220}>Практика</GradientTitle>
        <Text style={[neonStyles.subtitle, { marginBottom: 18 }]}>
          Повторяй по SM-2 и подтягивай «ржавеющие» навыки
        </Text>

        {/* Hero card — due now */}
        <LinearGradient
          colors={[neon.greenHero, '#0B3F32']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20, padding: 16, marginBottom: 22, overflow: 'hidden',
            borderWidth: 1, borderColor: neon.greenHeroBorder,
            position: 'relative',
          }}
        >
          {/* +XP badge */}
          <View style={{
            position: 'absolute', right: 14, top: 14,
              backgroundColor: neon.xp, borderRadius: 99,
            paddingHorizontal: 11, paddingVertical: 6,
            shadowColor: '#FFD54F', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 16,
          }}>
            <Text style={{ color: '#1a1100', fontWeight: '900', fontSize: 13 }}>+15 XP</Text>
          </View>

          {/* Tag */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: 'rgba(0,0,0,0.3)',
            alignSelf: 'flex-start', borderRadius: 99,
            paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10,
          }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
              ⚡ {stats.isLoading ? '...' : `${dueNow} карточек на сегодня`}
            </Text>
          </View>

          <Text style={{ color: neon.text, fontWeight: '900', fontSize: 22, marginBottom: 4 }}>
            Время повторить
          </Text>
          <Text style={{ color: '#D7E2F0', fontWeight: '600', fontSize: 13, maxWidth: '65%', marginBottom: 14 }}>
            Закрепи слова, пока они не «заржавели».
          </Text>

          <Link href="/practice/session" asChild>
            <Pressable style={{
              borderRadius: 16, alignItems: 'center', width: '60%', overflow: 'hidden',
              shadowColor: neon.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.55, shadowRadius: 24,
            }}>
              <LinearGradient
                colors={[neon.primary, neon.cyan]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: '100%', paddingVertical: 15, alignItems: 'center' }}
              >
                <Text style={{ color: 'neon.ink', fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                  Начать повтор
                </Text>
              </LinearGradient>
            </Pressable>
          </Link>

          <Text style={{ position: 'absolute', right: 8, bottom: -6, fontSize: 74 }}>🦉</Text>
        </LinearGradient>

        {/* Modes grid 2-col */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <View style={{
              width: 30, height: 30, borderRadius: 9,
              backgroundColor: 'rgba(46,236,200,0.14)', alignItems: 'center', justifyContent: 'center',
            }}>
              <Text>✨</Text>
            </View>
            <Text style={{ color: neon.text, fontWeight: '900', fontSize: 19 }}>Режимы</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 }}>
          {MODES.map((m) => (
            <Link key={m.href} href={m.href as any} asChild>
              <Pressable style={{
                ...S.surface,
                width: '48%', borderRadius: 20, padding: 12, gap: 6,
                minHeight: 124,
              }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 16,
                  backgroundColor: m.bg, alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                </View>
                <Text style={{ color: neon.text, fontWeight: '800', fontSize: 16 }}>{m.title}</Text>
                <Text style={{ color: neon.muted, fontWeight: '400', fontSize: 13 }}>{m.sub}</Text>
              </Pressable>
            </Link>
          ))}
        </View>

        {/* Mistakes block */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <View style={{
              width: 30, height: 30, borderRadius: 9,
              backgroundColor: 'rgba(255,77,141,0.14)', alignItems: 'center', justifyContent: 'center',
            }}>
              <Text>⚠️</Text>
            </View>
            <Text style={{ color: neon.text, fontWeight: '900', fontSize: 19 }}>Работа над ошибками</Text>
          </View>
          <Text style={[neonStyles.primaryText, { fontWeight: '800', fontSize: 14 }]}>→</Text>
        </View>

        <Link href="/practice/mistakes" asChild>
          <Pressable style={{
            ...S.surface,
            borderRadius: 20, padding: 16,
            flexDirection: 'row', alignItems: 'center', gap: 14,
          }}>
            <View style={{
              width: 46, height: 46, borderRadius: 14,
              backgroundColor: 'rgba(255,77,141,0.14)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 22 }}>🩹</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: neon.text, fontWeight: '900', fontSize: 15 }}>
                {unresolvedMistakes > 0
                  ? `${unresolvedMistakes} ${unresolvedMistakes === 1 ? 'шаг' : 'шага'}, где ты запнулся`
                  : 'Ошибок нет — так держать!'}
              </Text>
              {unresolvedMistakes > 0 && (
                <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden', marginTop: 8, width: 200 }}>
                  <LinearGradient
                    colors={['#FF4B6E', '#FF7A1A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      height: '100%', width: `${Math.min(100, (unresolvedMistakes / 10) * 100)}%`,
                      borderRadius: 99,
                      shadowColor: '#FF4B6E', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 8,
                    }}
                  />
                </View>
              )}
            </View>
            <Text style={{ color: '#8B98B0', fontSize: 22 }}>›</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </View>
  );
}
