import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCourse, useEnrollCourse } from '@/hooks/use-courses';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: course, isLoading, error } = useCourse(id);
  const enrollMutation = useEnrollCourse();

  const handleEnroll = () => {
    if (id) {
      enrollMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#FFD84A" />
        <Text className="text-muted-foreground mt-4">Loading course...</Text>
      </View>
    );
  }

  if (error || !course) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-4xl mb-4">😕</Text>
        <Text className="text-foreground font-bold text-lg mb-2">
          Course not found
        </Text>
        <Text className="text-muted-foreground text-center">
          {(error as any)?.message || 'Unable to load course details'}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Course Header */}
        <View className="bg-card p-6 border-b-4 border-border">
          {/* Course Image Placeholder */}
          <View className="bg-muted rounded-3xl h-48 mb-4 items-center justify-center">
            <Text className="text-6xl">📚</Text>
          </View>

          <Text className="text-3xl font-black text-foreground mb-2">
            {course.title}
          </Text>

          <Text className="text-muted-foreground text-base mb-4">
            {course.description}
          </Text>

          {/* Course Meta */}
          <View className="flex-row items-center space-x-3 mb-4">
            <View className="bg-primary/20 px-4 py-2 rounded-full">
              <Text className="text-primary font-bold uppercase">
                {course.level}
              </Text>
            </View>
            
            {course.rating && (
              <View className="flex-row items-center bg-muted px-3 py-2 rounded-full">
                <Text className="text-yellow-500 mr-1">⭐</Text>
                <Text className="text-foreground font-semibold">
                  {course.rating.toFixed(1)}
                </Text>
              </View>
            )}

            {course.students && (
              <View className="bg-muted px-3 py-2 rounded-full">
                <Text className="text-foreground font-semibold">
                  {course.students.toLocaleString()} 👥
                </Text>
              </View>
            )}
          </View>

          {course.instructor && (
            <View className="flex-row items-center">
              <View className="bg-primary rounded-full w-10 h-10 items-center justify-center mr-3">
                <Text className="text-xl">👨‍🏫</Text>
              </View>
              <View>
                <Text className="text-muted-foreground text-xs">Instructor</Text>
                <Text className="text-foreground font-bold">{course.instructor}</Text>
              </View>
            </View>
          )}
        </View>

        {/* What You'll Learn */}
        {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
          <View className="p-6 border-b-2 border-border">
            <Text className="text-xl font-black text-foreground mb-4">
              What you'll learn
            </Text>
            {course.whatYouWillLearn.map((item, index) => (
              <View key={index} className="flex-row mb-3">
                <Text className="text-primary mr-2">✓</Text>
                <Text className="text-foreground flex-1">{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Course Modules */}
        {course.modules && course.modules.length > 0 && (
          <View className="p-6">
            <Text className="text-xl font-black text-foreground mb-4">
              Course Content
            </Text>
            {course.modules.map((module, moduleIndex) => (
              <View key={moduleIndex} className="bg-card rounded-2xl p-4 mb-3 border-2 border-border">
                <Text className="text-foreground font-bold text-lg mb-2">
                  {module.title}
                </Text>
                {module.lessons.map((lesson, lessonIndex) => (
                  <View key={lessonIndex} className="flex-row items-center py-2">
                    <View className="w-6 h-6 rounded-full bg-muted items-center justify-center mr-3">
                      <Text className="text-xs font-bold text-muted-foreground">
                        {lessonIndex + 1}
                      </Text>
                    </View>
                    <Text className="text-muted-foreground flex-1">
                      {lesson.title}
                    </Text>
                    {lesson.status === 'completed' && (
                      <Text className="text-primary">✓</Text>
                    )}
                    {lesson.status === 'locked' && (
                      <Text className="text-muted-foreground">🔒</Text>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Bottom Padding */}
        <View className="h-24" />
      </ScrollView>

      {/* Enroll Button - Fixed at bottom */}
      <View className="absolute bottom-0 left-0 right-0 bg-card border-t-2 border-border p-4">
        <Pressable
          onPress={handleEnroll}
          disabled={enrollMutation.isPending}
          className="bg-primary rounded-3xl py-4 shadow-lg active:scale-95"
          style={{
            shadowColor: '#FFD84A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text className="text-center text-primary-foreground font-black text-lg uppercase tracking-wide">
            {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
