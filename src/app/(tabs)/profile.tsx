import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useLogout, useCurrentUser } from '@/hooks/use-auth';

export default function ProfileScreen() {
  const router = useRouter();
  const logout = useLogout();
  const { data: user } = useCurrentUser();

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-card border-b-2 border-border px-4 pt-12 pb-6">
        <Text className="text-3xl font-black text-primary mb-2">
          Profile
        </Text>
      </View>

      {/* User Info */}
      <View className="p-6">
        <View className="bg-card rounded-3xl p-6 border-4 border-border items-center mb-6">
          {/* Avatar */}
          <View className="bg-primary rounded-full w-24 h-24 items-center justify-center mb-4">
            <Text className="text-5xl">👤</Text>
          </View>

          {/* User Details */}
          <Text className="text-2xl font-black text-foreground mb-1">
            {user?.username || 'User'}
          </Text>
          <Text className="text-muted-foreground mb-4">
            {user?.email || 'email@example.com'}
          </Text>

          {/* Stats */}
          <View className="flex-row space-x-6 mt-4">
            <View className="items-center">
              <Text className="text-2xl font-black text-primary">0</Text>
              <Text className="text-muted-foreground text-sm">Courses</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-black text-secondary">0</Text>
              <Text className="text-muted-foreground text-sm">Lessons</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-black text-yellow-500">0</Text>
              <Text className="text-muted-foreground text-sm">XP</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="space-y-3 mb-6">
          <Pressable className="bg-card rounded-2xl p-4 border-2 border-border flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">📚</Text>
              <Text className="text-foreground font-semibold">My Courses</Text>
            </View>
            <Text className="text-muted-foreground">→</Text>
          </Pressable>

          <Pressable className="bg-card rounded-2xl p-4 border-2 border-border flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">⚙️</Text>
              <Text className="text-foreground font-semibold">Settings</Text>
            </View>
            <Text className="text-muted-foreground">→</Text>
          </Pressable>

          <Pressable className="bg-card rounded-2xl p-4 border-2 border-border flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">❓</Text>
              <Text className="text-foreground font-semibold">Help & Support</Text>
            </View>
            <Text className="text-muted-foreground">→</Text>
          </Pressable>
        </View>

        {/* Logout Button */}
        <Pressable
          onPress={handleLogout}
          disabled={logout.isPending}
          className="bg-destructive rounded-3xl py-4 border-4 border-red-600"
        >
          <Text className="text-center text-white font-black text-lg uppercase tracking-wide">
            {logout.isPending ? 'Logging out...' : 'Logout'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
