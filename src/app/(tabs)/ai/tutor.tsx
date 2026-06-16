import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { RotateCcw, Send } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuotaWidget, hasQuotaLeft } from '@/components/ai/quota-widget';
import { LangPills } from '@/components/ai/lang-pills';
import { useAIQuota, useAskTutor } from '@/hooks/use-ai';
import { AI_NATIVE_LANGS, AI_TARGET_LANGS, DEFAULT_NATIVE_LANG, DEFAULT_TARGET_LANG } from '@/lib/ai-languages';
import { glass, SunsetHeader, CtaButton } from '@/components/sunset';

export default function TutorScreen() {
  const [question, setQuestion] = useState('');
  const [targetLang, setTargetLang] = useState(DEFAULT_TARGET_LANG);
  const [nativeLang, setNativeLang] = useState(DEFAULT_NATIVE_LANG);
  const insets = useSafeAreaInsets();

  const quota = useAIQuota();
  const mut = useAskTutor();
  const canChat = hasQuotaLeft(quota.data, 'chat');
  const submittable = !!question.trim() && canChat && !mut.isPending;

  const handleSubmit = async () => {
    if (!submittable) return;
    try {
      await mut.mutateAsync({ question: question.trim(), target_language: targetLang || undefined, native_language: nativeLang || undefined });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Ошибка', text2: err instanceof Error ? err.message : undefined });
    }
  };

  const handleReset = () => { mut.reset(); setQuestion(''); };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 + insets.bottom }}
      >
        <SunsetHeader title="Спросить учителя" />

        <QuotaWidget compact />

        {mut.data ? (
          <View style={{ gap: 12, marginTop: 18 }}>
            {/* Вопрос + ответ */}
            <View style={[s.card, glass]}>
              <Text style={s.label}>Вопрос</Text>
              <Text style={s.questionText}>{question}</Text>
              <View style={s.divider} />
              <Text style={s.label}>Ответ</Text>
              <Markdown style={mdStyles}>{mut.data.answer}</Markdown>
            </View>

            <Pressable onPress={handleReset} style={[s.resetBtn, glass]}>
              <RotateCcw size={15} color="rgba(255,255,255,0.7)" />
              <Text style={s.resetText}>Задать новый вопрос</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 14, marginTop: 18 }}>
            {/* Языки */}
            <View style={[s.card, glass]}>
              <Text style={s.label}>Язык изучения</Text>
              <LangPills options={AI_TARGET_LANGS} value={targetLang} onChange={setTargetLang} />
              <Text style={[s.label, { marginTop: 14 }]}>Язык ответа</Text>
              <LangPills options={AI_NATIVE_LANGS} value={nativeLang} onChange={setNativeLang} variant="full" />
            </View>

            {/* Вопрос */}
            <View style={[s.card, glass]}>
              <Text style={s.label}>Ваш вопрос</Text>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder='"В чём разница между present perfect и past simple?"'
                placeholderTextColor="rgba(255,255,255,0.35)"
                multiline
                textAlignVertical="top"
                style={[s.input, { minHeight: 100 }]}
              />
            </View>

            {!canChat && (
              <Text style={s.limitText}>Лимит запросов на сегодня исчерпан.</Text>
            )}

            <CtaButton
              label={mut.isPending ? 'Думаем…' : 'Спросить'}
              onPress={handleSubmit}
              block
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 22, padding: 16, gap: 8 },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  questionText: { color: '#fff', fontSize: 15, fontWeight: '600', lineHeight: 22 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 4 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
  },
  limitText: { color: '#f87171', fontSize: 13, fontWeight: '600' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 18, paddingVertical: 13 },
  resetText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

const mdStyles = StyleSheet.create({
  body: { color: '#fff', fontSize: 14, fontWeight: '500' as const, lineHeight: 22 },
  paragraph: { marginTop: 0, marginBottom: 6 },
  heading1: { color: '#fff', fontSize: 20, fontWeight: '900' as const, marginTop: 8 },
  heading2: { color: '#fff', fontSize: 17, fontWeight: '900' as const, marginTop: 8 },
  heading3: { color: '#fff', fontSize: 15, fontWeight: '900' as const, marginTop: 6 },
  link: { color: '#FFD84A', textDecorationLine: 'underline' as const },
  code_inline: { backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 4, paddingHorizontal: 4, fontFamily: 'monospace', fontSize: 13 },
  fence: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: 10, padding: 10, fontFamily: 'monospace', fontSize: 13 },
  list_item: { marginBottom: 4 },
  strong: { fontWeight: '800' as const, color: '#fff' },
});
