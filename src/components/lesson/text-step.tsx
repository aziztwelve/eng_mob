import React from 'react';
import { View, Text, ScrollView, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { TextContent } from '@/types/api';

interface TextStepProps {
  content: TextContent;
  onComplete: () => void;
}

export function TextStep({ content, onComplete }: TextStepProps) {
  const { width } = useWindowDimensions();

  // Текстовый/словарный шаг НЕ завершается автоматически — пользователь
  // читает и сам жмёт «Continue» в нижней навигации. (Раньше тут стоял
  // setTimeout(onComplete, 2000), из-за чего шаг перелистывался сам.)
  void onComplete;

  return (
    <ScrollView className="flex-1 p-4">
      <RenderHtml
        contentWidth={width - 32}
        source={{ html: content.body }}
        tagsStyles={{
          body: { 
            color: '#ffffff', 
            fontSize: 16,
            lineHeight: 24,
          },
          p: { 
            marginBottom: 12,
            color: '#ffffff',
          },
          h1: { 
            fontSize: 28, 
            fontWeight: 'bold',
            color: '#FFD84A',
            marginBottom: 16,
          },
          h2: { 
            fontSize: 24, 
            fontWeight: 'bold',
            color: '#FFD84A',
            marginBottom: 12,
          },
          h3: { 
            fontSize: 20, 
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: 8,
          },
          strong: {
            fontWeight: 'bold',
            color: '#FFD84A',
          },
          em: {
            fontStyle: 'italic',
            color: '#8B98B0',
          },
          ul: {
            marginBottom: 12,
          },
          li: {
            marginBottom: 8,
            color: '#ffffff',
          },
        }}
      />
      
      {/* Reading time indicator */}
      {content.reading_time_minutes > 0 && (
        <View
          className="mt-6 p-4 rounded-2xl"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' }}
        >
          <View className="flex-row items-center justify-center">
            <Text className="mr-2" style={{ color: 'rgba(255,255,255,0.75)' }}>📖</Text>
            <Text style={{ color: 'rgba(255,255,255,0.75)' }}>
              {content.reading_time_minutes} min read
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
