import { KeyboardLift } from '@/components/keyboard-lift';
import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useUserStats } from '@/hooks/use-user-stats';
import { useHearts } from '@/hooks/use-hearts';
import VocabularyBankTab from '@/components/vocabulary/VocabularyBankTab';
import { SKY } from '@/components/lesson/sky-lesson-header';
import { PracticeHeader, type PracticeTab } from '@/components/practice/practice-ui';
import { TracksTab } from '@/components/practice/tracks-tab';
import { CoursesTab } from '@/components/practice/courses-tab';
import { WordsTab } from '@/components/practice/words-tab';

/**
 * Practice page in the Figma-based sky style: stats + icon tabs on top, then
 * the selected tab (tracks path, courses teaser, quick word review, word bank).
 */
export default function LessonsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [activeTab, setActiveTab] = useState<PracticeTab>('tracks');

  const { data: stats } = useUserStats();
  const { data: hearts } = useHearts();
  const streak = stats?.current_streak ?? 0;
  const heartsCount = hearts?.unlimited ? '∞' : (hearts?.hearts ?? stats?.hearts ?? 0);
  const gems = stats?.gems ?? 0;

  const labels: Record<PracticeTab, string> = {
    tracks: t('practice.tab_tracks'),
    courses: t('practice.tab_courses'),
    words: t('practice.tab_words'),
    bank: t('practice.tab_bank'),
  };

  return (
    <LinearGradient colors={[SKY.top, SKY.mid, '#FFFFFF']} locations={[0, 0.3, 0.6]} style={st.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      <KeyboardLift>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[st.scroll, { paddingBottom: 20 + tabBarHeight + insets.bottom }]}
        >
          <PracticeHeader
            active={activeTab}
            onChange={setActiveTab}
            labels={labels}
            streak={streak}
            hearts={heartsCount}
            gems={gems}
          />
          <View>
            {activeTab === 'tracks' ? <TracksTab /> : null}
            {activeTab === 'courses' ? <CoursesTab /> : null}
            {activeTab === 'words' ? <WordsTab /> : null}
            {activeTab === 'bank' ? <VocabularyBankTab /> : null}
          </View>
        </ScrollView>
      </KeyboardLift>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 12 },
});
