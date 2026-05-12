import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLesson } from '@/hooks/use-lessons';
import { useCompleteStep } from '@/hooks/use-progress';
import { Step, VideoContent, TextContent, QuizContent } from '@/types/api';
import { VideoStep } from '@/components/lesson/video-step';
import { TextStep } from '@/components/lesson/text-step';
import { QuizStep } from '@/components/lesson/quiz-step';

export default function LessonPlayerScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();
  const { data: lessonData, isLoading, error } = useLesson(lessonId);
  const completeStepMutation = useCompleteStep();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [startTime] = useState(Date.now());

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#58cc02" />
        <Text className="text-muted-foreground mt-4">Loading lesson...</Text>
      </View>
    );
  }

  if (error || !lessonData) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-4xl mb-4">😕</Text>
        <Text className="text-foreground font-bold text-lg mb-2">
          Lesson not found
        </Text>
        <Text className="text-muted-foreground text-center">
          {(error as any)?.message || 'Unable to load lesson'}
        </Text>
      </View>
    );
  }

  const { lesson, steps } = lessonData;
  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleStepComplete = (score?: number) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    completeStepMutation.mutate({
      stepId: currentStep.id,
      data: {
        time_spent_seconds: timeSpent,
        score: score ?? undefined,
        attempts: 1,
      },
    });

    if (isLastStep) {
      // Lesson completed
      router.back();
    } else {
      // Move to next step
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const renderStep = () => {
    try {
      const content = JSON.parse(currentStep.content);

      switch (currentStep.type) {
        case 'video':
          const videoContent = content as VideoContent;
          // Note: video_url should come from the API response
          const videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'; // Placeholder
          return (
            <VideoStep
              content={videoContent}
              videoUrl={videoUrl}
              onComplete={handleStepComplete}
            />
          );

        case 'text':
          const textContent = content as TextContent;
          return (
            <TextStep
              content={textContent}
              onComplete={handleStepComplete}
            />
          );

        case 'quiz':
          const quizContent = content as QuizContent;
          return (
            <QuizStep
              content={quizContent}
              onComplete={handleStepComplete}
            />
          );

        default:
          return (
            <View className="flex-1 items-center justify-center p-6">
              <Text className="text-foreground text-center">
                Step type "{currentStep.type}" is not yet supported
              </Text>
            </View>
          );
      }
    } catch (e) {
      return (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-destructive text-center">
            Error loading step content
          </Text>
        </View>
      );
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-card border-b-2 border-border px-4 pt-12 pb-4">
        <Text className="text-sm text-muted-foreground mb-1">
          {lesson.title}
        </Text>
        <Text className="text-xl font-black text-foreground mb-3">
          {currentStep.title}
        </Text>
        
        {/* Progress Bar */}
        <View className="flex-row items-center">
          <View className="flex-1 bg-muted rounded-full h-2 overflow-hidden mr-3">
            <View 
              className="bg-primary h-full"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </View>
          <Text className="text-muted-foreground text-sm font-semibold">
            {currentStepIndex + 1}/{steps.length}
          </Text>
        </View>
      </View>

      {/* Step Content */}
      <View className="flex-1">
        {renderStep()}
      </View>

      {/* Navigation */}
      <View className="bg-card border-t-2 border-border p-4 flex-row space-x-3">
        {currentStepIndex > 0 && (
          <Pressable
            onPress={handlePrevious}
            className="flex-1 bg-muted border-2 border-border rounded-2xl py-3"
          >
            <Text className="text-center font-bold text-foreground">
              ← Previous
            </Text>
          </Pressable>
        )}
        
        <Pressable
          onPress={() => handleStepComplete()}
          className="flex-1 bg-primary rounded-2xl py-3"
        >
          <Text className="text-center font-black text-primary-foreground uppercase">
            {isLastStep ? 'Finish' : 'Continue →'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
