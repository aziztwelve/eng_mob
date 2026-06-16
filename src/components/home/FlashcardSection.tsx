import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { neon, neonStyles } from '@/components/neon-screen';
import { useFlashcardStats } from '@/hooks/use-flashcards';

const S = {
  surface: neonStyles.surface,
} as const;

/**
 * FlashcardSection — виджет на главной: ведёт в отдельный раздел
 * «Флешкарты» (повторение слов). Без mock-данных — реальная SRS-статистика.
 */
export function FlashcardSection() {
  const stats = useFlashcardStats();

  const todayDue = stats.data?.today_due ?? 0;
  const learned = stats.data?.mastered_count ?? 0;
  const total = stats.data?.total_count ?? 0;

  const goToFlashcards = () => router.push('/flashcards' as any);

  return (
    <View style={{ paddingHorizontal: 18, marginTop: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <View style={{
            width: 30, height: 30, borderRadius: 9,
            backgroundColor: 'rgba(255,213,79,0.14)', alignItems: 'center', justifyContent: 'center',
          }}>
            <Text>🎴</Text>
          </View>
          <Text style={{ fontSize: 19, fontWeight: '900', color: neon.text }}>
            Флешкарты
          </Text>
        </View>
        <Text style={{ color: neon.muted, fontWeight: '700', fontSize: 13 }}>
          {learned}/{total} изучено
        </Text>
      </View>

      <Pressable
        onPress={goToFlashcards}
        style={[S.surface, { borderRadius: 18, padding: 20, minHeight: 120, justifyContent: 'center' }]}
      >
        <LinearGradient
          colors={['rgba(40,220,233,0.1)', 'rgba(46,236,200,0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 18 }}
        />
        <Text style={{ color: neon.muted, fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
          Повторение слов
        </Text>
        <Text style={{ color: neon.text, fontSize: 22, fontWeight: '900' }}>
          {todayDue > 0 ? `${todayDue} слов на сегодня` : 'Все повторено 🎉'}
        </Text>
        <Text style={{ color: neon.muted, fontSize: 13, fontWeight: '600', marginTop: 6 }}>
          {todayDue > 0 ? 'Нажмите, чтобы повторить' : 'Добавьте новые слова или вернитесь позже'}
        </Text>
      </Pressable>

      {todayDue > 0 && (
        <Pressable
          onPress={goToFlashcards}
          style={[S.surface, { borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 12 }]}
        >
          <Text style={{ color: neon.text, fontWeight: '800', fontSize: 14 }}>Повторить →</Text>
        </Pressable>
      )}
    </View>
  );
}
