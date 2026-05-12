import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useLogin } from '@/hooks/use-auth';
import { useForm, Controller } from 'react-hook-form';
import { LoginRequest } from '@/types/api';

export default function LoginScreen() {
  const router = useRouter();
  const login = useLogin();
  
  const { control, handleSubmit, formState: { errors } } = useForm<LoginRequest>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginRequest) => {
    login.mutate(data);
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
              Welcome back!
            </Text>
            <Text className="text-muted-foreground mt-2">
              Sign in to continue learning
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
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
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-card border-2 border-border rounded-2xl px-4 py-3 text-foreground text-base"
                    placeholder="Enter your password"
                    placeholderTextColor="#666"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password"
                  />
                )}
              />
              {errors.password && (
                <Text className="text-destructive text-sm mt-1">
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Login Button */}
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={login.isPending}
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
                {login.isPending ? 'Signing in...' : 'Sign In'}
              </Text>
            </Pressable>

            {/* Register Link */}
            <View className="flex-row justify-center mt-6">
              <Text className="text-muted-foreground">
                Don't have an account?{' '}
              </Text>
              <Link href="/auth/register" asChild>
                <Pressable>
                  <Text className="text-primary font-bold">Sign Up</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
