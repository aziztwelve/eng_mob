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

  // Auto-complete when component mounts (user has viewed the text)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000); // Mark as complete after 2 seconds of viewing

    return () => clearTimeout(timer);
  }, []);

  return (
    <ScrollView className="flex-1 bg-background p-4">
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
            color: '#00FFA3',
            marginBottom: 16,
          },
          h2: { 
            fontSize: 24, 
            fontWeight: 'bold',
            color: '#00FFA3',
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
            color: '#00FFA3',
          },
          em: {
            fontStyle: 'italic',
            color: '#9FB0C8',
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
        <View className="mt-6 p-4 bg-card rounded-2xl border-2 border-border">
          <View className="flex-row items-center justify-center">
            <Text className="text-muted-foreground mr-2">📖</Text>
            <Text className="text-muted-foreground">
              {content.reading_time_minutes} min read
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
