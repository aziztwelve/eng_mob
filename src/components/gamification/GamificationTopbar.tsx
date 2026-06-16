import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsAuthenticated } from '@/hooks/use-auth';
import { useUserStats } from '@/hooks/use-user-stats';
import { useHearts } from '@/hooks/use-hearts';
import { neon } from '@/components/neon-screen';

export function GamificationTopbar() {
  const { isAuthenticated } = useIsAuthenticated();
  const { data: stats } = useUserStats();
  const { data: hearts } = useHearts();

  if (!isAuthenticated) return null;

  const streak = stats?.current_streak ?? 0;
  const heartsCount = hearts?.unlimited ? '∞' : (hearts?.hearts ?? 0);
  const xp = stats?.total_xp ?? 0;
  const level = stats?.level ?? 1;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 28,
        paddingTop: 4,
        paddingBottom: 16,
        height: 78,
        backgroundColor: 'transparent',
      }}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        {/* Streak pill */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: 'rgba(255,255,255,0.055)',
          borderWidth: 1, borderColor: neon.border,
          borderRadius: 18, paddingHorizontal: 15, height: 46,
          shadowColor: 'rgba(0,0,0,0.18)', 
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 1, 
          shadowRadius: 24,
        }}>
          <Text style={{ fontSize: 22, lineHeight: 22 }}>🔥</Text>
          <Text style={{
            color: '#FF9600', fontWeight: '900', fontSize: 20,
          }}>{streak}</Text>
        </View>

        {/* Hearts pill */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: 'rgba(255,255,255,0.055)',
          borderWidth: 1, borderColor: neon.border,
          borderRadius: 18, paddingHorizontal: 15, height: 46,
          shadowColor: 'rgba(0,0,0,0.18)', 
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 1, 
          shadowRadius: 24,
        }}>
          <Text style={{ fontSize: 22, lineHeight: 22 }}>❤️</Text>
          <Text style={{
            color: '#FF4B7A', fontWeight: '900', fontSize: 20,
          }}>{heartsCount}</Text>
        </View>

        {/* XP/gems pill */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: 'rgba(255,255,255,0.055)',
          borderWidth: 1, borderColor: neon.border,
          borderRadius: 18, paddingHorizontal: 15, height: 46,
          shadowColor: 'rgba(0,0,0,0.18)', 
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 1, 
          shadowRadius: 24,
        }}>
          <Text style={{ fontSize: 22, lineHeight: 22 }}>💎</Text>
          <Text style={{ color: '#1CB0F6', fontWeight: '900', fontSize: 20 }}>{xp}</Text>
        </View>
      </View>

      {/* Level pill */}
      <LinearGradient
        colors={['#FFE57A', '#FFC800']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          borderRadius: 18, paddingHorizontal: 15, height: 46,
          shadowColor: 'rgba(255,200,0,0.25)', 
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 1, 
          shadowRadius: 24,
        }}
      >
        <Text style={{ fontSize: 20 }}>⭐</Text>
        <Text style={{ color: '#221600', fontWeight: '900', fontSize: 20 }}>LV {level}</Text>
      </LinearGradient>
    </View>
  );
}
