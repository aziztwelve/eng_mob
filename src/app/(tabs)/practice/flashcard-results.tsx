import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Home } from 'lucide-react-native';

import { hasLottieAsset } from '@/lib/lottie-manifest';

function ResultsAnimation() {
  // TODO: Add flashcard-results.json to assets/lottie/
  // if (hasLottieAsset('flashcard-results')) {
  //   const Lottie = require('lottie-react-native');
  //   return (
  //     <Lottie
  //       source={require('@/../assets/lottie/flashcard-results.json') as never}
  //       autoPlay
  //       loop={false}
  //       style={{ width: 160, height: 160 }}
  //     />
  //   );
  // }
  return (
    <Text className="text-7xl" style={{ textAlign: 'center' }}>
      🏆
    </Text>
  );
}

export default function FlashcardResultsScreen() {
  const params = useLocalSearchParams<{ total: string; remembered: string }>();
  const total = parseInt(params.total || '0', 10);
  const remembered = parseInt(params.remembered || '0', 10);
  const percentage = total > 0 ? Math.round((remembered / total) * 100) : 0;

  const isGood = percentage >= 70;

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 items-center justify-center p-6 gap-6">
        {/* Animation / Icon */}
        <ResultsAnimation />

        {/* Title */}
        <Text className="text-foreground font-black text-3xl text-center">
          {isGood ? 'Отлично!' : 'Хороший старт!'}
        </Text>

        {/* Stats */}
        <View className="bg-card rounded-3xl border-4 border-border p-6 w-full gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-muted-foreground font-bold">Повторено слов:</Text>
            <Text className="text-foreground font-black text-2xl">{total}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-muted-foreground font-bold">Помню:</Text>
            <Text className="text-primary font-black text-2xl">{remembered}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-muted-foreground font-bold">Не помню:</Text>
            <Text className="text-red-500 font-black text-2xl">{total - remembered}</Text>
          </View>
          <View className="h-px bg-border my-2" />
          <View className="flex-row items-center justify-between">
            <Text className="text-foreground font-black text-lg">Успешность:</Text>
            <Text
              className="font-black text-3xl"
              style={{ color: isGood ? '#58cc02' : '#ff9600' }}
            >
              {percentage}%
            </Text>
          </View>
        </View>

        {/* Message */}
        <Text className="text-muted-foreground text-center">
          {isGood
            ? 'Продолжайте в том же духе! Слова, которые вы не помните, появятся снова завтра.'
            : 'Не переживайте! Повторение — мать учения. Слова появятся снова завтра.'}
        </Text>

        {/* Buttons */}
        <View className="w-full gap-3">
          <Pressable
            onPress={() => router.push('/practice/library' as any)}
            className="bg-primary rounded-2xl p-4 items-center active:opacity-80"
          >
            <Text className="text-white font-bold text-lg">Вернуться в библиотеку</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)')}
            className="bg-card border-2 border-border rounded-2xl p-4 flex-row items-center justify-center gap-2 active:opacity-80"
          >
            <Home size={20} color="#999" />
            <Text className="text-foreground font-bold">На главную</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
