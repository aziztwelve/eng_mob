import React from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { useTranslation } from 'react-i18next';
import { TextContent } from '@/types/api';
import { SKY } from './sky-lesson-header';
import { SkyCard, skyFont } from './sky-ui';

interface TextStepProps {
  content: TextContent;
  onComplete: () => void;
}

export function TextStep({ content, onComplete }: TextStepProps) {
  const { width } = useWindowDimensions();
  const { t } = useTranslation();

  // Текстовый/словарный шаг НЕ завершается автоматически — пользователь
  // читает и сам жмёт «Continue» в нижней навигации. (Раньше тут стоял
  // setTimeout(onComplete, 2000), из-за чего шаг перелистывался сам.)
  void onComplete;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <SkyCard>
        <RenderHtml
          contentWidth={width - 68}
          source={{ html: content.body }}
          baseStyle={{ fontFamily: skyFont.medium }}
          tagsStyles={{
            body: { color: SKY.ink, fontSize: 16, lineHeight: 24 },
            p: { marginBottom: 12, color: SKY.ink },
            h1: { fontSize: 26, fontFamily: skyFont.title, color: SKY.ink, marginBottom: 14 },
            h2: { fontSize: 22, fontFamily: skyFont.title, color: SKY.ink, marginBottom: 12 },
            h3: { fontSize: 19, fontFamily: skyFont.strong, color: SKY.ink, marginBottom: 8 },
            strong: { fontFamily: skyFont.strong, color: SKY.blueDark },
            em: { fontStyle: 'italic', color: SKY.muted },
            ul: { marginBottom: 12 },
            li: { marginBottom: 8, color: SKY.ink },
          }}
        />
      </SkyCard>

      {content.reading_time_minutes > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: SKY.card }}>
          <Text style={{ fontFamily: skyFont.bold, color: SKY.muted }}>
            {t('lesson.min_read', { n: content.reading_time_minutes })}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
