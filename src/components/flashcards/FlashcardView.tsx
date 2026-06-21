import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { Check, X, Undo2, SkipForward, Volume2 } from 'lucide-react-native';

import { fx } from '@/lib/fx';
import { getFxPreferences } from '@/lib/fx-prefs';
import { playWordTTS } from '@/lib/tts';

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
}: FlashcardViewProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [ttsBusy, setTtsBusy] = useState(false);
  const rotation = useSharedValue(0);
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
      <Pressable onPress={handleFlip} className="h-96">
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
          </Animated.View>
        </View>
      </Pressable>

      {/* Buttons */}
      {isFlipped && (
        <View className="flex-row gap-4">
          <Pressable
            onPress={() => {
              fx.onWrong();
              onForgot();
            }}
            className="flex-1 bg-red-500 rounded-2xl p-4 flex-row items-center justify-center gap-2 active:opacity-80"
          >
            <X size={24} color="white" />
            <Text className="text-white font-bold text-lg">Не помню</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              fx.onCorrect();
              onRemember();
            }}
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
