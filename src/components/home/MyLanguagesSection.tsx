import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboardingState } from '@/hooks/use-onboarding';
import { useUserStats } from '@/hooks/use-user-stats';
import { getLanguage } from '@/lib/supported-languages';
import { analytics } from '@/lib/analytics';
import { neon, neonStyles } from '@/components/neon-screen';

const S = {
  surface: neonStyles.surface,
} as const;

export function MyLanguagesSection() {
  const router = useRouter();
  const { data: state } = useOnboardingState();
  const stats = useUserStats();

  const targetLang = state?.target_language ?? null;
  const lang = targetLang ? getLanguage(targetLang) : null;
  const level = state?.level ?? null;
  const streak = stats.data?.current_streak ?? 0;

  const onAdd = () => {
    analytics.track('add_language_clicked', { current_language: targetLang ?? undefined });
    router.push('/onboarding/add-language');
  };

  const levelCode = levelToCode(level);

  return (
    <View style={{ paddingHorizontal: 18, marginTop: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <View style={{
            width: 30, height: 30, borderRadius: 9,
            backgroundColor: 'rgba(46,236,200,0.14)', alignItems: 'center', justifyContent: 'center',
          }}>
            <Text>🌍</Text>
          </View>
          <Text style={{ fontSize: 19, fontWeight: '900', color: neon.text }}>
            Мои языки
          </Text>
        </View>
        <Pressable onPress={onAdd} hitSlop={8}>
          <Text style={[neonStyles.primaryText, { fontWeight: '800', fontSize: 14 }]}>
            + Добавить
          </Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        {/* Current language card */}
        <View style={[S.surface, { flex: 1, borderRadius: 18, padding: 14 }]}>
          <Text style={{ fontSize: 26 }}>{lang?.flag ?? '🌐'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <Text style={{ color: neon.text, fontWeight: '900', fontSize: 16 }}>
              {lang?.nameNative ?? targetLang?.toUpperCase() ?? 'Не выбран'}
            </Text>
            {levelCode && (
              <View style={{
                backgroundColor: 'rgba(40,220,233,0.14)',
                borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
              }}>
                <Text style={{ color: neon.cyan, fontSize: 12, fontWeight: '900' }}>{levelCode}</Text>
              </View>
            )}
          </View>
          {/* Progress bar */}
          <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden', marginTop: 12 }}>
            <LinearGradient
              colors={[neon.primary, neon.cyan]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: '100%', width: streak > 0 ? '62%' : '10%', borderRadius: 99,
                shadowColor: neon.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 12,
              }}
            />
          </View>
        </View>

        {/* Add card — dashed border */}
        <Pressable
          onPress={onAdd}
          style={{
            flex: 1, borderWidth: 2, borderStyle: 'dashed',
            borderColor: 'rgba(255,255,255,0.18)',
            borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 14,
          }}
        >
          <View style={{
            width: 38, height: 38, borderRadius: 12,
            backgroundColor: 'rgba(46,236,200,0.14)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: neon.primary, fontSize: 22 }}>+</Text>
          </View>
          <Text style={{ color: neon.muted, fontWeight: '800', fontSize: 13, textAlign: 'center' }}>
            Добавить{'\n'}язык
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function levelToCode(level: string | null | undefined): string | null {
  const map: Record<string, string> = {
    a1: 'A1', a2: 'A2', b1: 'B1', b2: 'B2', c1: 'C1', c2: 'C2',
    beginner: 'A1', intermediate: 'B1', advanced: 'C1',
  };
  return level ? (map[level] ?? null) : null;
}
