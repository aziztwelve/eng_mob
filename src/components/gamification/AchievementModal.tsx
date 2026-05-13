import React, { useEffect } from 'react';
import { Modal, Text, View, Pressable, Image } from 'react-native';
import { Award } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { UserAchievement } from '@/types/api';

const TIER_BG: Record<number, string> = {
  1: 'bg-amber-100',
  2: 'bg-slate-100',
  3: 'bg-yellow-50',
};

const TIER_BORDER: Record<number, string> = {
  1: 'border-amber-700',
  2: 'border-slate-400',
  3: 'border-yellow-400',
};

export interface AchievementModalProps {
  achievement: UserAchievement | null;
  visible: boolean;
  onClose: () => void;
}

export function AchievementModal({ achievement, visible, onClose }: AchievementModalProps) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12, stiffness: 140 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withTiming(0.7, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible, scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!achievement) return null;
  const a = achievement.achievement;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/60 items-center justify-center px-6"
      >
        <Animated.View
          style={animStyle}
          className={`w-full max-w-sm rounded-3xl border-4 p-6 items-center ${TIER_BG[a.tier] ?? TIER_BG[1]} ${TIER_BORDER[a.tier] ?? TIER_BORDER[1]}`}
        >
          <Text className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Achievement unlocked
          </Text>
          <View
            className="h-20 w-20 rounded-2xl bg-background border-4 border-border items-center justify-center mb-3"
          >
            {a.icon_url ? (
              <Image source={{ uri: a.icon_url }} style={{ width: 56, height: 56 }} resizeMode="contain" />
            ) : (
              <Award size={40} color="#d97706" />
            )}
          </View>
          <Text className="text-foreground font-black text-xl text-center mb-1">
            {a.title}
          </Text>
          {!!a.description && (
            <Text className="text-muted-foreground font-medium text-sm text-center mb-3">
              {a.description}
            </Text>
          )}
          {(a.xp_reward > 0 || a.gems_reward > 0) && (
            <View className="flex-row gap-3 mb-4">
              {a.xp_reward > 0 && (
                <Text className="text-amber-700 font-black">+{a.xp_reward} XP</Text>
              )}
              {a.gems_reward > 0 && (
                <Text className="text-cyan-700 font-black">💎 +{a.gems_reward}</Text>
              )}
            </View>
          )}
          <Pressable
            onPress={onClose}
            className="bg-primary rounded-2xl px-6 py-3 active:scale-95"
          >
            <Text className="text-primary-foreground font-black uppercase tracking-wider">
              Круто!
            </Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
