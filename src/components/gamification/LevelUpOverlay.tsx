import React, { useEffect, useRef } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { LOTTIE_ASSETS, hasLottieAsset } from '@/lib/lottie-manifest';

export interface LevelUpOverlayProps {
  /** Если null/0 — оверлей не виден. Передаем новый level. */
  level: number | null;
  /** Колбэк закрытия (тап по фону или авто-таймер). */
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 3200;

/**
 * Full-screen celebration оверлей для level-up.
 *
 * Поведение:
 *   - Если в `lottie-manifest.LOTTIE_ASSETS['level-up']` зарегистрирован
 *     .json — играем Lottie. Иначе включается fallback из Reanimated:
 *     пульсирующий "LEVEL UP" + орбита эмодзи (✨🎉🌟).
 *   - Авто-закрытие через `AUTO_DISMISS_MS`. Тап по фону тоже закрывает.
 *   - Игнорирует back-press внутри Modal (закрытие только через onDismiss).
 *
 * Используем `Modal`, а не absolute-overlay внутри экрана, чтобы оверлей
 * рендерился поверх header/tabbar и не зависел от parent-layout.
 */
export function LevelUpOverlay({ level, onDismiss }: LevelUpOverlayProps) {
  const visible = level != null && level > 0;

  const lottieRef = useRef<LottieView>(null);

  const cardScale = useSharedValue(0.6);
  const cardOpacity = useSharedValue(0);
  const labelTranslate = useSharedValue(20);
  const orbitRotate = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    // Entrance: scale-spring + fade-in.
    cardScale.value = withSpring(1, { damping: 9, stiffness: 110 });
    cardOpacity.value = withTiming(1, { duration: 220 });

    // Label slide-up чуть позже, чтобы было ощущение «текст пришёл вторым».
    labelTranslate.value = withDelay(
      120,
      withSpring(0, { damping: 14, stiffness: 130 }),
    );

    // Орбита эмодзи: бесконечное вращение для fallback (Lottie ее
    // перекрывает, но дёшево).
    orbitRotate.value = withTiming(360, {
      duration: 3000,
      easing: Easing.linear,
    });

    // Старт Lottie (если зарегистрирован).
    lottieRef.current?.reset();
    lottieRef.current?.play();

    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => {
      clearTimeout(t);
      // Сбрасываем для следующего level-up.
      cardScale.value = 0.6;
      cardOpacity.value = 0;
      labelTranslate.value = 20;
      orbitRotate.value = 0;
    };
  }, [visible, cardScale, cardOpacity, labelTranslate, orbitRotate, onDismiss]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: labelTranslate.value }],
  }));

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbitRotate.value}deg` }],
  }));

  if (!visible) return null;

  const lottieSource = LOTTIE_ASSETS['level-up'];

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onDismiss}>
      <Pressable
        onPress={onDismiss}
        className="flex-1 items-center justify-center bg-black/75 px-6"
      >
        <Animated.View style={cardStyle} className="items-center">
          {/* Lottie слой — поверх fallback'а. Если ассета нет, окно остается
              пустым и виден только fallback (эмодзи-орбита). */}
          <View style={{ width: 280, height: 280, position: 'relative' }}>
            {hasLottieAsset('level-up') ? (
              <LottieView
                ref={lottieRef}
                // Manifest сознательно типизирован как `unknown` (require()
                // возвращает number в RN, а Lottie ждет AnimationObject —
                // оба варианта валидны в runtime, безопасно кастуем).
                source={lottieSource as never}
                autoPlay
                loop={false}
                style={{ width: 280, height: 280 }}
                resizeMode="contain"
              />
            ) : (
              <FallbackBurst orbitStyle={orbitStyle} />
            )}
          </View>

          <Animated.View style={labelStyle} className="items-center -mt-4">
            <Text className="text-yellow-300 font-black text-base tracking-[6px]">
              LEVEL UP
            </Text>
            <View className="mt-2 rounded-3xl border-4 border-amber-300 bg-amber-400 px-8 py-3 shadow-lg">
              <Text className="text-amber-900 font-black text-5xl">
                {level}
              </Text>
            </View>
            <Text className="mt-5 text-white/70 font-bold text-xs uppercase tracking-widest">
              Tap to continue
            </Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

/**
 * Reanimated-фолбэк, который играет, если .json не зарегистрирован.
 * Эмодзи на «орбите» вокруг центра + центральная звезда.
 */
function FallbackBurst({
  orbitStyle,
}: {
  orbitStyle: ReturnType<typeof useAnimatedStyle>;
}) {
  // Угловые позиции (deg) для 6 эмодзи. Радиус задан translateY.
  const items: { emoji: string; angle: number; size: number }[] = [
    { emoji: '✨', angle: 0, size: 32 },
    { emoji: '🎉', angle: 60, size: 36 },
    { emoji: '🌟', angle: 120, size: 30 },
    { emoji: '✨', angle: 180, size: 28 },
    { emoji: '🎊', angle: 240, size: 34 },
    { emoji: '🌟', angle: 300, size: 30 },
  ];

  return (
    <View className="absolute inset-0 items-center justify-center">
      <Animated.View
        style={[
          {
            width: 240,
            height: 240,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
          },
          orbitStyle as object,
        ]}
      >
        {items.map((it, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              transform: [
                { rotate: `${it.angle}deg` },
                { translateY: -110 },
                { rotate: `-${it.angle}deg` },
              ],
            }}
          >
            <Text style={{ fontSize: it.size }}>{it.emoji}</Text>
          </View>
        ))}
      </Animated.View>
      <View className="absolute items-center justify-center">
        <Text style={{ fontSize: 96 }}>⭐</Text>
      </View>
    </View>
  );
}
