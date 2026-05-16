import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthService } from '@/lib/auth-service';
import { isOnboarded } from '@/lib/onboarding-storage';

export default function IndexScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // Sprint 2: Global guard.
  // - Если есть валидная сессия (access token) и onboarding пройден →
  //   сразу в /(tabs).
  // - Если есть сессия, но onboarding не пройден → /onboarding/welcome.
  // - Без сессии — показываем sign-in/sign-up экран.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const authed = await AuthService.isAuthenticated();
      if (cancelled) return;
      if (!authed) {
        setChecking(false);
        return;
      }
      const onboarded = await isOnboarded();
      if (cancelled) return;
      router.replace(onboarded ? '/(tabs)' : '/onboarding/welcome');
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#58cc02" size="large" />
      </View>
    );
  }

  const handleSignIn = () => {
    console.log('Sign In clicked');
    try {
      router.push('/auth/login');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleSignUp = () => {
    console.log('Sign Up clicked');
    try {
      router.push('/auth/register');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo/Brand */}
      <View style={styles.header}>
        <Text style={styles.emoji}>🌍</Text>
        <Text style={styles.title}>LingoLearn</Text>
        <Text style={styles.subtitle}>
          Master languages through interactive lessons
        </Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <View style={styles.feature}>
          <Text style={styles.featureEmoji}>🎯</Text>
          <Text style={styles.featureText}>Interactive video lessons</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureEmoji}>📝</Text>
          <Text style={styles.featureText}>Engaging quizzes</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureEmoji}>📊</Text>
          <Text style={styles.featureText}>Track your progress</Text>
        </View>
      </View>

      {/* CTA Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          onPress={handleSignIn}
          activeOpacity={0.8}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>SIGN IN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSignUp}
          activeOpacity={0.8}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>CREATE ACCOUNT</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>Start learning today!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1b26',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#58cc02',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#b3b3b3',
    textAlign: 'center',
  },
  features: {
    width: '100%',
    maxWidth: 448,
    marginBottom: 48,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  featureText: {
    fontSize: 18,
    color: '#ffffff',
  },
  buttons: {
    width: '100%',
    maxWidth: 448,
  },
  primaryButton: {
    backgroundColor: '#58cc02',
    borderRadius: 48,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: '#58cc02',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 1.5,
  },
  secondaryButton: {
    backgroundColor: '#252736',
    borderRadius: 48,
    paddingVertical: 16,
    borderWidth: 4,
    borderColor: '#58cc02',
  },
  secondaryButtonText: {
    textAlign: 'center',
    color: '#58cc02',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 1.5,
  },
  footer: {
    color: '#b3b3b3',
    fontSize: 14,
    marginTop: 48,
  },
});
