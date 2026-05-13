import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Zap } from 'lucide-react-native';

export interface XPGainAnimationProps {
  amount: number;
  /** Колбек, когда анимация полностью отыграла (для удаления из дерева). */
  onDone?: () => void;
}

/**
 * Inline-overlay анимация "+N XP" — fade in, поднимается вверх, fade out.
 * Длительность ~1.6s.
 */
export function XPGainAnimation({ amount, onDone }: XPGainAnimationProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 250 }),
      withDelay(900, withTiming(0, { duration: 350 })),
    );
    translateY.value = withSequence(
      withTiming(0, { duration: 250 }),
      withDelay(900, withTiming(-20, { duration: 350 })),
    );
    const t = setTimeout(() => onDone?.(), 1600);
    return () => clearTimeout(t);
  }, [opacity, translateY, onDone]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (amount <= 0) return null;

  return (
    <Animated.View
      pointerEvents="none"
      className="absolute top-12 left-0 right-0 items-center"
      style={animatedStyle}
    >
      <View className="flex-row items-center gap-2 rounded-full border-4 border-amber-400 bg-amber-50 px-4 py-2">
        <Zap size={20} color="#d97706" fill="#d97706" />
        <Text className="text-amber-700 font-black text-lg">+{amount} XP</Text>
      </View>
    </Animated.View>
  );
}
