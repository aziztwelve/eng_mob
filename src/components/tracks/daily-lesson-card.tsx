import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import type { LessonDetails, Track } from '@/types/api';
import { neon } from '@/components/neon-screen';

interface Props {
  track?: Track | null;
  lesson?: LessonDetails | null;
  isLoading?: boolean;
}

export function DailyLessonCard({ track, lesson, isLoading }: Props) {
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={{
        backgroundColor: neon.surface, borderWidth: 1, borderColor: neon.border,
        borderRadius: 20, padding: 24, alignItems: 'center', justifyContent: 'center', minHeight: 144,
      }}>
        <ActivityIndicator size="small" color={neon.primary} />
      </View>
    );
  }

  const title = lesson?.title ?? 'Урок дня готов';
  const desc = lesson?.description ?? '5 минут — закрепи слова и грамматику уровня A2.';
  const onPress = lesson ? () => router.push(`/learn/${lesson.id}`) : undefined;

  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 28, 
        borderWidth: 1,
        borderColor: 'rgba(88,204,2,0.22)',
        overflow: 'hidden', 
        position: 'relative',
        minHeight: 222,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.28, 
        shadowRadius: 42,
      }}
    >
      {/* Complex gradient background matching mockup */}
      <LinearGradient
        pointerEvents="none"
        colors={['#1B5133', '#163A4F', '#172239']}
        locations={[0, 0.58, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      {/* Green glow at bottom-right */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(88,204,2,0.34)', 'transparent']}
        locations={[0, 0.72]}
        start={{ x: 0.08, y: 0.08 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <View style={{ padding: 20 }}>
        {/* +XP badge top-right - golden gradient */}
        <View style={{
          position: 'absolute', right: 20, top: 20,
          borderRadius: 999,
          paddingHorizontal: 15, paddingVertical: 8,
          backgroundColor: '#FFC800',
          shadowColor: '#FFC800', 
          shadowOffset: { width: 0, height: 8 }, 
          shadowOpacity: 0.28, 
          shadowRadius: 22,
        }}>
          <Text style={{ color: '#281900', fontWeight: '900', fontSize: 17 }}>+20 XP</Text>
        </View>

        {/* Tag */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
          backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 99,
          paddingHorizontal: 10, paddingVertical: 5,
        }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>🔥 Серия не прервётся</Text>
        </View>

        {/* Title */}
        <Text style={{ 
          color: '#fff', 
          fontWeight: '900', 
          fontSize: 30, 
          lineHeight: 32,
          letterSpacing: -0.5,
          marginTop: 16, 
          marginBottom: 8 
        }}>
          {title}
        </Text>

        {/* Description — max 64% width to leave room for mascot */}
        <Text style={{ 
          color: '#DCE8F4', 
          fontWeight: '650', 
          fontSize: 18,
          lineHeight: 24,
          maxWidth: '64%' 
        }} numberOfLines={3}>
          {desc}
        </Text>

        {/* CTA Button */}
        <Pressable
          onPress={onPress}
          style={{
            marginTop: 14, width: '60%',
            borderRadius: 16,
            alignItems: 'center',
            shadowColor: neon.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.55, shadowRadius: 24,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={[neon.primary, neon.cyan]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: '100%', alignItems: 'center', paddingVertical: 15 }}
          >
            <Text style={{ color: neon.ink, fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.3 }}>
              Начать урок
            </Text>
          </LinearGradient>
        </Pressable>

        {/* Bottom padding for mascot */}
        <View style={{ height: 48 }} />
      </View>

      {/* Mascot */}
      <Text pointerEvents="none" style={{
        position: 'absolute', 
        right: 16, 
        bottom: -6, 
        fontSize: 96,
        textShadowColor: 'rgba(0,0,0,0.22)', 
        textShadowOffset: { width: 0, height: 18 }, 
        textShadowRadius: 18,
      }}>
        🦉
      </Text>
    </Pressable>
  );
}
