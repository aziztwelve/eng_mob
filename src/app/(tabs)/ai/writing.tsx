import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, PenLine, RotateCcw } from 'lucide-react-native';
import Toast from 'react-native-toast-message';

import { AssessmentResult } from '@/components/ai/assessment-result';
import { LangPills } from '@/components/ai/lang-pills';
import { QuotaWidget, hasQuotaLeft } from '@/components/ai/quota-widget';
import { useAIQuota, useAssessWriting } from '@/hooks/use-ai';
import { AI_TARGET_LANGS, DEFAULT_TARGET_LANG } from '@/lib/ai-languages';

const LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const MIN_WORDS = 10;

/**
 * /ai/writing — отправка эссе/текста + AssessmentResult после ответа.
 *
 * Frontend guard: минимум 10 слов — иначе бэк вернёт мало смысла.
 */
export default function WritingScreen() {
  const [prompt, setPrompt] = useState('');
  const [text, setText] = useState('');
  const [lang, setLang] = useState(DEFAULT_TARGET_LANG);
  const [level, setLevel] = useState('B1');

  const quota = useAIQuota();
  const mut = useAssessWriting();
  const canWrite = hasQuotaLeft(quota.data, 'writing');

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const tooShort = wordCount < MIN_WORDS;
  const submittable = !tooShort && canWrite && !mut.isPending;

  const handleSubmit = async () => {
    if (!submittable) return;
    try {
      await mut.mutateAsync({
        prompt: prompt.trim() || undefined,
        user_text: text,
        target_language: lang,
        user_level: level,
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Ошибка проверки',
        text2: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleReset = () => {
    mut.reset();
    setText('');
    setPrompt('');
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Проверить эссе' }} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center gap-1 self-start active:opacity-60"
        >
          <ArrowLeft size={16} color="#9ca3af" />
          <Text className="text-muted-foreground font-bold">К AI hub</Text>
        </Pressable>

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <PenLine size={28} color="#3b82f6" />
            <Text className="text-foreground font-black text-3xl">
              Проверить эссе
            </Text>
          </View>
          <Text className="text-muted-foreground font-medium">
            AI оценит грамматику, лексику, связность и стиль. Также получите
            исправленный текст и фидбэк по категориям.
          </Text>
        </View>

        <QuotaWidget compact />

        {mut.data ? (
          <View className="gap-4">
            <AssessmentResult data={mut.data} />
            <Pressable
              onPress={handleReset}
              className="bg-card border-4 border-border rounded-2xl px-4 py-3 flex-row items-center justify-center gap-2 active:opacity-80"
            >
              <RotateCcw size={16} color="#fff" />
              <Text className="text-foreground font-bold">
                Проверить ещё одну работу
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="bg-card rounded-3xl border-4 border-border p-5 gap-4">
            {/* Lang + Level */}
            <View className="flex-row gap-3">
              <View className="flex-1 gap-1">
                <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
                  Язык
                </Text>
                <LangPills
                  options={AI_TARGET_LANGS}
                  value={lang}
                  onChange={setLang}
                />
              </View>
            </View>

            <View className="gap-1">
              <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
                Уровень
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {LEVEL_OPTIONS.map((o) => (
                  <Pressable
                    key={o}
                    onPress={() => setLevel(o)}
                    className={`rounded-xl px-2.5 py-1.5 border-2 ${
                      level === o
                        ? 'bg-primary border-primary'
                        : 'bg-card border-border'
                    } active:opacity-80`}
                  >
                    <Text
                      className={`font-bold text-xs ${
                        level === o
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {o}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Prompt (optional) */}
            <View className="gap-1">
              <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
                Задание (опционально)
              </Text>
              <TextInput
                value={prompt}
                onChangeText={setPrompt}
                placeholder="Например: Опишите ваш типичный рабочий день."
                placeholderTextColor="#6b7280"
                className="text-foreground font-medium"
                style={{
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: '#fff',
                }}
              />
            </View>

            {/* User text */}
            <View className="gap-1">
              <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
                Ваш текст
              </Text>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Напишите минимум 10 слов…"
                placeholderTextColor="#6b7280"
                multiline
                textAlignVertical="top"
                className="text-foreground font-medium"
                style={{
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: '#fff',
                  minHeight: 160,
                }}
              />
              <Text className="text-muted-foreground font-medium text-xs">
                {wordCount} слов
                {tooShort ? ` — минимум ${MIN_WORDS}` : ''}
              </Text>
            </View>

            {!canWrite && (
              <Text className="text-destructive font-medium text-sm">
                Лимит проверок на сегодня исчерпан. Сбрасывается завтра.
              </Text>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={!submittable}
              className={`rounded-2xl px-4 py-3 flex-row items-center justify-center gap-2 ${
                submittable
                  ? 'bg-primary active:opacity-80'
                  : 'bg-muted opacity-60'
              }`}
            >
              {mut.isPending ? (
                <>
                  <ActivityIndicator size="small" color="#1a1a1a" />
                  <Text className="text-primary-foreground font-black">
                    Анализируем…
                  </Text>
                </>
              ) : (
                <Text className="text-primary-foreground font-black">
                  Проверить
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
