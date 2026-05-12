import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function IndexScreen() {
  const router = useRouter();

  const handleSignIn = () => {
    console.log('Sign In clicked');
    router.push('/auth/login');
  };

  const handleSignUp = () => {
    console.log('Sign Up clicked');
    router.push('/auth/register');
  };

  return (
    <View className="flex-1 bg-background items-center justify-center p-6">
      {/* Logo/Brand */}
      <View className="items-center mb-12">
        <Text className="text-6xl mb-4">🌍</Text>
        <Text className="text-5xl font-black text-primary mb-2">
          LingoLearn
        </Text>
        <Text className="text-xl text-muted-foreground text-center">
          Master languages through interactive lessons
        </Text>
      </View>

      {/* Features */}
      <View className="w-full max-w-md mb-12 space-y-4">
        <View className="flex-row items-center">
          <Text className="text-3xl mr-3">🎯</Text>
          <Text className="text-foreground text-lg">
            Interactive video lessons
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-3xl mr-3">📝</Text>
          <Text className="text-foreground text-lg">
            Engaging quizzes
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-3xl mr-3">📊</Text>
          <Text className="text-foreground text-lg">
            Track your progress
          </Text>
        </View>
      </View>

      {/* CTA Buttons */}
      <View className="w-full max-w-md space-y-4">
        <TouchableOpacity
          onPress={handleSignIn}
          activeOpacity={0.8}
          className="bg-primary rounded-3xl py-4"
          style={{
            shadowColor: '#58cc02',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Text className="text-center text-primary-foreground font-black text-lg uppercase tracking-wide">
            Sign In
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSignUp}
          activeOpacity={0.8}
          className="bg-card border-4 border-primary rounded-3xl py-4"
        >
          <Text className="text-center text-primary font-black text-lg uppercase tracking-wide">
            Create Account
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text className="text-muted-foreground text-sm mt-12">
        Start learning today!
      </Text>
    </View>
  );
}
