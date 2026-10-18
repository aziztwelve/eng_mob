import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { Bot, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { SkyScreen, SKY } from '@/components/lesson/sky-lesson-header';

/** AI-раздел пока показываем как sky-заглушку до запуска помощника. */
export default function AIHubScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <SkyScreen>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mascotCircle}>
          <Bot size={58} color={SKY.blueDark} strokeWidth={2.5} />
          <Sparkles size={19} color={SKY.blueDark} fill={SKY.blueDark} style={styles.sparkle} />
        </View>

        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t('ai.soon')}</Text>
          </View>
          <Text style={styles.title}>{t('ai.title')}</Text>
          <Text style={styles.description}>{t('ai.coming_soon_desc')}</Text>
        </View>
      </ScrollView>
    </SkyScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  mascotCircle: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 56,
    backgroundColor: '#E7F8FF',
    borderWidth: 2,
    borderColor: SKY.line,
    marginBottom: 18,
  },
  sparkle: { position: 'absolute', top: 20, right: 19 },
  card: {
    width: '100%',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1.5,
    borderBottomWidth: 4,
    borderColor: SKY.card,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  badge: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#9DDEFA',
    backgroundColor: '#E7F8FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 12,
  },
  badgeText: { color: '#1597D1', fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
  title: { color: SKY.ink, fontFamily: 'Nunito_900Black', fontSize: 26, textAlign: 'center' },
  description: {
    maxWidth: 290,
    color: SKY.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
  },
});
