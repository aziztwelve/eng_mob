import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  Extrapolation,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { Check, X, Undo2, SkipForward, Volume2 } from 'lucide-react-native';

import { fx } from '@/lib/fx';
import { getFxPreferences } from '@/lib/fx-prefs';
import { playWordTTS } from '@/lib/tts';

const SCREEN_W = Dimensions.get('window').width;
// Дистанция свайпа, после которой ответ засчитывается на отпускании.
const SWIPE_THRESHOLD = 110;

export interface FlashcardViewProps {
  word: string;
  translation: string;
  definition?: string;
  example?: string;
  transcription?: string;
  audioUrl?: string;
  ttsLanguage?: string;
  onRemember: () => void;
  onForgot: () => void;
  onSkip?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  /** Сколько карточек ещё осталось позади (для эффекта колоды). */
  stackCount?: number;
}

export function FlashcardView({
  word,
  translation,
  definition,
  example,
  transcription,
  audioUrl,
  ttsLanguage,
  onRemember,
  onForgot,
  onSkip,
  onUndo,
  canUndo = false,
  stackCount = 0,
}: FlashcardViewProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [ttsBusy, setTtsBusy] = useState(false);
  const rotation = useSharedValue(0);
  const translateX = useSharedValue(0);
  const ttsPlayedRef = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const playTTS = useCallback(async () => {
    if (ttsBusy || !word) return;
    // Реальный URL (MinIO) — путь B; плейсхолдеры example.com игнорируем.
    const realUrl = audioUrl && !audioUrl.includes('example.com') ? audioUrl : null;
    setTtsBusy(true);
    try {
      if (realUrl) {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        const { sound } = await Audio.Sound.createAsync(
          { uri: realUrl },
          { shouldPlay: true, volume: 0.9 },
        );
        soundRef.current = sound;
      } else {
        // Путь A: on-demand синтез слова через Google TTS + локальный кэш.
        await playWordTTS(word, ttsLanguage || 'en');
      }
    } catch {
      /* noop — озвучка не критична */
    } finally {
      setTtsBusy(false);
    }
  }, [audioUrl, word, ttsLanguage, ttsBusy]);

  useEffect(() => {
    if (isFlipped && !ttsPlayedRef.current && word && getFxPreferences().sounds) {
      ttsPlayedRef.current = true;
      const timer = setTimeout(playTTS, 200);
      return () => clearTimeout(timer);
    }
  }, [isFlipped, word, playTTS]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        void soundRef.current.unloadAsync();
      }
    };
  }, []);

  const handleFlip = () => {
    const nextFlipped = !isFlipped;
    rotation.value = withSpring(nextFlipped ? 180 : 0, { damping: 15, stiffness: 100 });
    setIsFlipped(nextFlipped);
    if (!nextFlipped) {
      ttsPlayedRef.current = false;
    }
    fx.tap();
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 180], [0, 180]);
    const opacity = interpolate(rotation.value, [0, 90, 180], [1, 0, 0]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity,
      backfaceVisibility: 'hidden',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 180], [180, 360]);
    const opacity = interpolate(rotation.value, [0, 90, 180], [0, 0, 1]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      opacity,
      backfaceVisibility: 'hidden',
    };
  });

  // Ответы: общие для кнопок и свайпа (хаптика + колбэк в сессию).
  const handleRemember = useCallback(() => {
    fx.onCorrect();
    onRemember();
  }, [onRemember]);

  const handleForgot = useCallback(() => {
    fx.onWrong();
    onForgot();
  }, [onForgot]);

  // Свайп-ответ: активен только после переворота. Вправо = «Помню»,
  // влево = «Не помню». Кнопки ниже остаются как fallback.
  const panGesture = Gesture.Pan()
    .enabled(isFlipped)
    .activeOffsetX([-15, 15])
    .failOffsetY([-24, 24])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd(() => {
      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_W * 1.4, { duration: 220 });
        runOnJS(handleRemember)();
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_W * 1.4, { duration: 220 });
        runOnJS(handleForgot)();
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 140 });
      }
    });

  const cardContainerStyle = useAnimatedStyle(() => {
    const rotateZ = interpolate(
      translateX.value,
      [-SCREEN_W, 0, SCREEN_W],
      [-12, 0, 12],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ translateX: translateX.value }, { rotateZ: `${rotateZ}deg` }],
    };
  });

  const rememberOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const forgotOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View className="gap-6">
      {/* Top actions */}
      <View className="flex-row items-center justify-between px-2">
        {canUndo && onUndo ? (
          <Pressable onPress={onUndo} className="p-2 active:opacity-60">
            <Undo2 size={24} color="#999" />
          </Pressable>
        ) : (
          <View className="w-10" />
        )}

        {/* Озвучка слова (on-demand TTS). Вне flip-Pressable, чтобы тап не
            переворачивал карточку. */}
        <Pressable
          onPress={playTTS}
          disabled={ttsBusy}
          hitSlop={8}
          className="p-2 active:opacity-60 flex-row items-center"
        >
          <Volume2 size={26} color={ttsBusy ? '#D8B7BF' : '#A8243F'} />
        </Pressable>

        {onSkip ? (
          <Pressable onPress={onSkip} className="p-2 active:opacity-60">
            <SkipForward size={24} color="#999" />
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
      </View>

      {/* Card */}
      <View className="h-96">
        {/* Колода: декоративные карты позади активной (эффект стопки) */}
        {stackCount >= 2 ? (
          <View
            pointerEvents="none"
            style={{ transform: [{ scale: 0.9 }, { translateY: 26 }] }}
            className="absolute inset-0 bg-[#FFF6F4] border-4 border-[#F2C9A0] rounded-3xl opacity-40"
          />
        ) : null}
        {stackCount >= 1 ? (
          <View
            pointerEvents="none"
            style={{ transform: [{ scale: 0.95 }, { translateY: 13 }] }}
            className="absolute inset-0 bg-[#FFF6F4] border-4 border-[#F2C9A0] rounded-3xl opacity-70"
          />
        ) : null}

        <GestureDetector gesture={panGesture}>
          <Animated.View style={cardContainerStyle} className="absolute inset-0">
            <Pressable onPress={handleFlip} className="flex-1">
              <View className="flex-1 relative">
              {/* Front */}
              <Animated.View
                style={[frontAnimatedStyle]}
                className="absolute inset-0 bg-[#FFF6F4] border-4 border-[#F2C9A0] rounded-3xl p-8 items-center justify-center"
              >
                <Text className="text-[#2B1422] font-black text-4xl text-center">{word}</Text>
                {transcription ? (
                  <Text className="text-[#A8243F] text-lg mt-2 font-semibold">{transcription}</Text>
                ) : null}
                <Text className="text-[#9a7c86] text-sm mt-4">Нажмите для перевода</Text>
              </Animated.View>

              {/* Back */}
              <Animated.View
                style={[backAnimatedStyle]}
                className="absolute inset-0 bg-[#FFF6F4] border-4 border-[#FFB338] rounded-3xl p-8 justify-center"
              >
                <View className="flex-row items-center justify-center gap-2 mb-2">
                  <Text className="text-[#2B1422] font-black text-3xl text-center">
                    {translation}
                  </Text>
                  <Pressable onPress={playTTS} disabled={ttsBusy} hitSlop={8} className="p-1 active:opacity-60">
                    <Volume2 size={22} color={ttsBusy ? '#D8B7BF' : '#A8243F'} />
                  </Pressable>
                </View>
                {transcription ? (
                  <Text className="text-[#A8243F] text-base text-center mb-2 font-semibold">
                    {transcription}
                  </Text>
                ) : null}
                {definition && (
                  <Text className="text-[#6b4b56] text-base text-center mb-2">
                    {definition}
                  </Text>
                )}
                {example && (
                  <Text className="text-[#9a7c86] text-sm text-center italic">
                    &ldquo;{example}&rdquo;
                  </Text>
                )}
                {isFlipped ? (
                  <Text className="text-[#c19aa6] text-xs text-center mt-4">
                    Свайп вправо — помню · влево — не помню
                  </Text>
                ) : null}
              </Animated.View>

              {/* Swipe overlays — проявляются при перетаскивании, поверх карты */}
              <Animated.View
                pointerEvents="none"
                style={rememberOverlayStyle}
                className="absolute inset-0 rounded-3xl bg-primary/20 border-4 border-primary items-center justify-center"
              >
                <View className="bg-primary rounded-2xl px-5 py-2 flex-row items-center gap-2">
                  <Check size={22} color="white" />
                  <Text className="text-white font-black text-lg">Помню</Text>
                </View>
              </Animated.View>
              <Animated.View
                pointerEvents="none"
                style={forgotOverlayStyle}
                className="absolute inset-0 rounded-3xl bg-red-500/20 border-4 border-red-500 items-center justify-center"
              >
                <View className="bg-red-500 rounded-2xl px-5 py-2 flex-row items-center gap-2">
                  <X size={22} color="white" />
                  <Text className="text-white font-black text-lg">Не помню</Text>
                </View>
              </Animated.View>
            </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
      </View>

      {/* Buttons */}
      {isFlipped && (
        <View className="flex-row gap-4">
          <Pressable
            onPress={handleForgot}
            className="flex-1 bg-red-500 rounded-2xl p-4 flex-row items-center justify-center gap-2 active:opacity-80"
          >
            <X size={24} color="white" />
            <Text className="text-white font-bold text-lg">Не помню</Text>
          </Pressable>

          <Pressable
            onPress={handleRemember}
            className="flex-1 bg-primary rounded-2xl p-4 flex-row items-center justify-center gap-2 active:opacity-80"
          >
            <Check size={24} color="white" />
            <Text className="text-white font-bold text-lg">Помню</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
