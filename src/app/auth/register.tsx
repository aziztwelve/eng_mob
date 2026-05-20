import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useRegister } from '@/hooks/use-auth';
import { useForm, Controller } from 'react-hook-form';
import { RegisterRequest } from '@/types/api';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useRegister();
  
  const { control, handleSubmit, formState: { errors }, watch } = useForm<RegisterRequest>({
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: RegisterRequest) => {
    register.mutate(data);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView 
        className="flex-1 bg-background"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
      >
        <View className="max-w-md w-full mx-auto">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-4xl font-black text-primary mb-2">
              LingoLearn
            </Text>
            <Text className="text-xl text-foreground font-bold">
              Create Account
            </Text>
            <Text className="text-muted-foreground mt-2">
              Start your language learning journey
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            {/* Username Input */}
            <View>
              <Text className="text-foreground font-semibold mb-2">Username</Text>
              <Controller
                control={control}
                name="username"
                rules={{
                  required: 'Username is required',
                  minLength: {
                    value: 3,
                    message: 'Username must be at least 3 characters',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-card border-2 border-border rounded-2xl px-4 py-3 text-foreground text-base"
                    placeholder="Choose a username"
                    placeholderTextColor="#666"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                    autoComplete="username"
                  />
                )}
              />
              {errors.username && (
                <Text className="text-destructive text-sm mt-1">
                  {errors.username.message}
                </Text>
              )}
            </View>

            {/* Email Input */}
            <View>
              <Text className="text-foreground font-semibold mb-2">Email</Text>
              <Controller
                control={control}
                name="email"
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-card border-2 border-border rounded-2xl px-4 py-3 text-foreground text-base"
                    placeholder="your@email.com"
                    placeholderTextColor="#666"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                )}
              />
              {errors.email && (
                <Text className="text-destructive text-sm mt-1">
                  {errors.email.message}
                </Text>
              )}
            </View>

            {/* Password Input */}
            <View>
              <Text className="text-foreground font-semibold mb-2">Password</Text>
              <Controller
                control={control}
                name="password"
                rules={{
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-card border-2 border-border rounded-2xl px-4 py-3 text-foreground text-base"
                    placeholder="Create a password"
                    placeholderTextColor="#666"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password-new"
                  />
                )}
              />
              {errors.password && (
                <Text className="text-destructive text-sm mt-1">
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Register Button */}
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={register.isPending}
              className="bg-primary rounded-3xl py-4 mt-6 shadow-lg active:scale-95 transition-transform"
              style={{
                shadowColor: '#58cc02',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Text className="text-center text-primary-foreground font-black text-lg uppercase tracking-wide">
                {register.isPending ? 'Creating Account...' : 'Sign Up'}
              </Text>
            </Pressable>

            {/* Login Link */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-muted-foreground">
                Already have an account?{' '}
              </Text>
              <Link href="/auth/login" asChild>
                <Pressable>
                  <Text className="text-primary font-bold">Sign In</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
