import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  ArrowLeft,
  GraduationCap,
  RotateCcw,
  Send,
} from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import Toast from 'react-native-toast-message';

import { QuotaWidget, hasQuotaLeft } from '@/components/ai/quota-widget';
import { useAIQuota, useAskTutor } from '@/hooks/use-ai';

const TARGET_LANGS = [
  { value: '', label: '—' },
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
  { value: 'de', label: 'DE' },
  { value: 'fr', label: 'FR' },
];

const NATIVE_LANGS = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

/**
 * /ai/tutor — однократный Q&A. Без persistence — родственник /ai/chat,
 * но без истории. Нужна история — открывайте обычный чат со scenario=tutor_qa.
 */
export default function TutorScreen() {
  const [question, setQuestion] = useState('');
  const [targetLang, setTargetLang] = useState('en');
  const [nativeLang, setNativeLang] = useState('ru');

  const quota = useAIQuota();
  const mut = useAskTutor();
  const canChat = hasQuotaLeft(quota.data, 'chat');

  const submittable =
    !!question.trim() && canChat && !mut.isPending;

  const handleSubmit = async () => {
    if (!submittable) return;
    try {
      await mut.mutateAsync({
        question: question.trim(),
        target_language: targetLang || undefined,
        native_language: nativeLang || undefined,
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Ошибка',
        text2: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleReset = () => {
    mut.reset();
    setQuestion('');
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: 'Спросить учителя' }} />
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
            <GraduationCap size={28} color="#f59e0b" />
            <Text className="text-foreground font-black text-3xl">
              Спросить учителя
            </Text>
          </View>
          <Text className="text-muted-foreground font-medium">
            Однократный вопрос про грамматику, лексику или культуру
            изучаемого языка. Если нужен диалог — открывайте обычный чат.
          </Text>
        </View>

        <QuotaWidget compact />

        {mut.data ? (
          <View className="gap-4">
            <View className="bg-card rounded-3xl border-4 border-border p-5 gap-3">
              <View>
                <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
                  Вопрос
                </Text>
                <Text className="text-foreground font-bold text-base mt-1">
                  {question}
                </Text>
              </View>
              <View>
                <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider mb-1">
                  Ответ
                </Text>
                <Markdown style={tutorMd}>{mut.data.answer}</Markdown>
              </View>
            </View>
            <Pressable
              onPress={handleReset}
              className="bg-card border-4 border-border rounded-2xl px-4 py-3 flex-row items-center justify-center gap-2 active:opacity-80"
            >
              <RotateCcw size={16} color="#fff" />
              <Text className="text-foreground font-bold">
                Задать новый вопрос
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="bg-card rounded-3xl border-4 border-border p-5 gap-4">
            <View className="gap-1">
              <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
                Язык изучения
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {TARGET_LANGS.map((o) => (
                  <Pill
                    key={o.value || 'no-lang'}
                    active={targetLang === o.value}
                    label={o.label}
                    onPress={() => setTargetLang(o.value)}
                  />
                ))}
              </View>
            </View>
            <View className="gap-1">
              <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
                Язык ответа
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {NATIVE_LANGS.map((o) => (
                  <Pill
                    key={o.value}
                    active={nativeLang === o.value}
                    label={o.label}
                    onPress={() => setNativeLang(o.value)}
                  />
                ))}
              </View>
            </View>

            <View className="gap-1">
              <Text className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
                Ваш вопрос
              </Text>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder='Например: "В чём разница между present perfect и past simple?"'
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
                  minHeight: 100,
                }}
              />
            </View>

            {!canChat && (
              <Text className="text-destructive font-medium text-sm">
                Лимит запросов на сегодня исчерпан.
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
                    Думаем…
                  </Text>
                </>
              ) : (
                <>
                  <Send size={16} color="#1a1a1a" />
                  <Text className="text-primary-foreground font-black">
                    Спросить
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Pill({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-xl px-3 py-1.5 border-2 ${
        active ? 'bg-primary border-primary' : 'bg-card border-border'
      } active:opacity-80`}
    >
      <Text
        className={`font-bold text-sm ${
          active ? 'text-primary-foreground' : 'text-foreground'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const tutorMd = StyleSheet.create({
  body: { color: '#fff', fontSize: 15, fontWeight: '500' as const },
  paragraph: { marginTop: 0, marginBottom: 8 },
  heading1: { color: '#fff', fontSize: 22, fontWeight: '900' as const, marginTop: 8 },
  heading2: { color: '#fff', fontSize: 19, fontWeight: '900' as const, marginTop: 8 },
  heading3: { color: '#fff', fontSize: 16, fontWeight: '900' as const, marginTop: 8 },
  link: { color: '#58cc02', textDecorationLine: 'underline' as const },
  code_inline: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    borderRadius: 4,
    paddingHorizontal: 4,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  fence: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#fff',
    borderRadius: 8,
    padding: 8,
    fontFamily: 'monospace',
    fontSize: 13,
  },
  list_item: { marginBottom: 4 },
});
