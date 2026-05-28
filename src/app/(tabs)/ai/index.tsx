import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, Link, router, type Href } from 'expo-router';
import {
  ArrowLeft,
  BookOpen,
  Bot,
  Drama,
  GraduationCap,
  Mic,
  PenLine,
  Sparkles,
} from 'lucide-react-native';

import { QuotaWidget } from '@/components/ai/quota-widget';

/**
 * /ai — hub-страница AI-фич. 5 карточек + quota widget сверху.
 * Mirror eng_next2/app/ai/page.tsx.
 *
 * Все фичи требуют auth; QuotaWidget сам обрабатывает loading state.
 */
export default function AIHubScreen() {
  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'AI помощник' }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 self-start active:opacity-60"
        >
          <ArrowLeft size={16} color="#9ca3af" />
          <Text className="text-muted-foreground font-bold">Назад</Text>
        </Pressable>

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Bot size={28} color="#58cc02" />
            <Text className="text-foreground font-black text-3xl">
              AI помощник
            </Text>
          </View>
          <Text className="text-muted-foreground font-medium">
            Практикуйте язык в реалистичных сценариях, получайте объяснения
            ошибок и оценку письма от AI.
          </Text>
        </View>

        <QuotaWidget />

        <View className="gap-3">
          <FeatureCard
            href="/ai/chat"
            icon={<Sparkles size={22} color="#58cc02" />}
            iconBg="bg-primary/15"
            title="Свободный чат"
            description="Поговорите с AI на изучаемом языке. История диалогов сохраняется."
          />
          <FeatureCard
            href="/ai/roleplay"
            icon={<Drama size={22} color="#f43f5e" />}
            iconBg="bg-rose-500/15"
            title="Roleplay"
            description="Симуляция реальных ситуаций: ресторан, аэропорт, работа — выбирайте сценарий."
          />
          <FeatureCard
            href="/ai/writing"
            icon={<PenLine size={22} color="#3b82f6" />}
            iconBg="bg-blue-500/15"
            title="Проверить эссе"
            description="Получите оценку по 4 параметрам, исправленный текст и фидбэк."
          />
          <FeatureCard
            href="/ai/tutor"
            icon={<GraduationCap size={22} color="#f59e0b" />}
            iconBg="bg-amber-500/15"
            title="Спросить учителя"
            description="Однократный Q&A — задайте вопрос про грамматику, лексику или культуру."
          />
          <FeatureCard
            href="/ai/pronunciation"
            icon={<Mic size={22} color="#10b981" />}
            iconBg="bg-emerald-500/15"
            title="Проверить произношение"
            description="Запишите аудио и получите word-level оценку точности."
          />
          <FeatureCard
            href="/ai/chat"
            icon={<BookOpen size={22} color="#8b5cf6" />}
            iconBg="bg-violet-500/15"
            title="Мои диалоги"
            description="История всех бесед — продолжайте с того места, где остановились."
          />
        </View>
      </ScrollView>
    </View>
  );
}

function FeatureCard({
  href,
  icon,
  iconBg,
  title,
  description,
}: {
  href: Href;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} asChild>
      <Pressable className="bg-card rounded-3xl border-4 border-border p-4 flex-row items-center gap-3 active:opacity-80">
        <View className={`${iconBg} rounded-2xl p-2`}>{icon}</View>
        <View className="flex-1">
          <Text className="text-foreground font-black text-base">{title}</Text>
          <Text className="text-muted-foreground font-medium text-sm">
            {description}
          </Text>
        </View>
        <Text className="text-muted-foreground">→</Text>
      </Pressable>
    </Link>
  );
}
