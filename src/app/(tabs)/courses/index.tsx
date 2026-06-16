import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCourses } from '@/hooks/use-courses';
import { Course } from '@/types/api';

const LEVEL_FILTERS = [
  { label: 'All', value: null },
  { label: 'A1-A2', value: 'A1-A2' },
  { label: 'B1', value: 'B1' },
  { label: 'B2', value: 'B2' },
  { label: 'C1-C2', value: 'C1-C2' },
];

export default function CoursesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const { data: courses, isLoading, error } = useCourses({
    search: search || undefined,
    level: selectedLevel ? [selectedLevel] : undefined,
  });

  const renderCourseCard = ({ item }: { item: Course }) => (
    <Pressable
      onPress={() => router.push(`/(tabs)/courses/${item.id}`)}
      className="bg-card rounded-3xl p-4 mb-4 border-4 border-border active:scale-95"
    >
      {/* Course Image Placeholder */}
      <View className="bg-muted rounded-2xl h-40 mb-3 items-center justify-center">
        <Text className="text-4xl">📚</Text>
      </View>

      {/* Course Info */}
      <Text className="text-foreground font-black text-lg mb-1" numberOfLines={2}>
        {item.title}
      </Text>
      
      <Text className="text-muted-foreground text-sm mb-3" numberOfLines={2}>
        {item.description}
      </Text>

      {/* Course Meta */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center space-x-2">
          <View className="bg-primary/20 px-3 py-1 rounded-full">
            <Text className="text-primary font-bold text-xs uppercase">
              {item.level}
            </Text>
          </View>
          {item.rating && (
            <View className="flex-row items-center">
              <Text className="text-yellow-500 mr-1">⭐</Text>
              <Text className="text-foreground font-semibold text-sm">
                {item.rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
        
        {item.students && (
          <Text className="text-muted-foreground text-xs">
            {item.students.toLocaleString()} students
          </Text>
        )}
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-card border-b-2 border-border px-4 pt-12 pb-4">
        <Text className="text-3xl font-black text-primary mb-4">
          Courses
        </Text>

        {/* Search Bar */}
        <TextInput
          className="bg-background border-2 border-border rounded-2xl px-4 py-3 text-foreground mb-3"
          placeholder="Search courses..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />

        {/* Level Filters */}
        <View className="flex-row space-x-2">
          {LEVEL_FILTERS.map((filter) => (
            <Pressable
              key={filter.label}
              onPress={() => setSelectedLevel(filter.value)}
              className={`px-4 py-2 rounded-full border-2 ${
                selectedLevel === filter.value
                  ? 'bg-primary border-primary'
                  : 'bg-background border-border'
              }`}
            >
              <Text
                className={`font-bold text-sm ${
                  selectedLevel === filter.value
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Course List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FFD84A" />
          <Text className="text-muted-foreground mt-4">Loading courses...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-4xl mb-4">😕</Text>
          <Text className="text-foreground font-bold text-lg mb-2">
            Oops! Something went wrong
          </Text>
          <Text className="text-muted-foreground text-center">
            {(error as any)?.message || 'Failed to load courses'}
          </Text>
        </View>
      ) : !courses || courses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-4xl mb-4">🔍</Text>
          <Text className="text-foreground font-bold text-lg mb-2">
            No courses found
          </Text>
          <Text className="text-muted-foreground text-center">
            Try adjusting your search or filters
          </Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          renderItem={renderCourseCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
