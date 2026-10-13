import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { VideoContent } from '@/types/api';

interface VideoStepProps {
  content: VideoContent;
  videoUrl: string;
  onComplete: () => void;
}

export function VideoStep({ content, videoUrl, onComplete }: VideoStepProps) {
  const player = useVideoPlayer({ uri: videoUrl }, (p) => {
    p.timeUpdateEventInterval = 0.5;
  });
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const subscription = player.addListener('timeUpdate', ({ currentTime }) => {
      const duration = player.duration;
      if (!duration) return;
      const percent = (currentTime / duration) * 100;
      setProgress(percent);

      // Auto-complete at 90%
      if (percent >= 90 && !isCompleted) {
        setIsCompleted(true);
        onComplete();
      }
    });
    return () => subscription.remove();
  }, [player, isCompleted, onComplete]);

  return (
    <View className="flex-1 bg-background">
      {/* Video Player */}
      <View className="bg-black">
        <VideoView
          player={player}
          nativeControls
          contentFit="contain"
          className="w-full h-64"
        />
      </View>

      {/* Progress Bar */}
      <View className="p-4">
        <View className="bg-muted rounded-full h-3 overflow-hidden">
          <View
            className="bg-primary h-full rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
        <Text className="text-muted-foreground text-sm text-center mt-2">
          {progress.toFixed(0)}% watched
        </Text>
      </View>

      {/* Video Info */}
      <View className="p-4">
        <View className="flex-row items-center mb-2">
          <Text className="text-primary mr-2">🎥</Text>
          <Text className="text-muted-foreground">
            Duration: {Math.floor(content.duration_seconds / 60)}:{(content.duration_seconds % 60).toString().padStart(2, '0')}
          </Text>
        </View>

        {isCompleted && (
          <View className="bg-primary/20 rounded-2xl p-4 border-2 border-primary">
            <Text className="text-primary font-bold text-center">
              ✓ Video completed!
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
