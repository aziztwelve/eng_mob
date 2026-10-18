import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { socialSignIn, SocialAuthCancelled, type SocialProvider } from '@/lib/oauth';
import { AuthService } from '@/lib/auth-service';
import { ApiClient, OnboardingApi } from '@/lib/api-client';
import { mergeBackendState, patchOnboardingState, getOnboardingState } from '@/lib/onboarding-storage';
import { getCurrentLang } from '@/lib/i18n';
import { syncLocalOnboardingToBackend } from './use-onboarding';
import type { User } from '@/types/api';

export function useSocialLogin(origin: 'login' | 'onboarding') {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const running = useRef(false);
  const mutation = useMutation({
    mutationFn: async (provider: SocialProvider) => {
      try { return await socialSignIn(provider); }
      catch (error) { if (error instanceof SocialAuthCancelled) return null; throw error; }
    },
    onSuccess: async data => {
      if (!data) return;
      await AuthService.saveAuthResponse(data);
      await AuthService.setUser(null);
      // A different provider can select a different account on a shared phone.
      queryClient.removeQueries({ predicate: query => query.queryKey[0] !== 'social-login' });
      try {
        const user = await ApiClient.get<User>('/auth/me');
        await AuthService.setUser(user);
        queryClient.setQueryData(['currentUser'], user);
      } catch { /* the authenticated profile will retry on the destination */ }
      if (data.created && origin === 'onboarding') {
        await syncLocalOnboardingToBackend();
        router.replace('/(tabs)');
        return;
      }
      if (data.created) {
        const local = await getOnboardingState();
        await patchOnboardingState({ target_language: local.target_language ?? 'en', native_language: local.native_language ?? getCurrentLang(), current_step: 'goal' });
        Toast.show({ type: 'success', text1: t('auth.login.oauth_signed_in'), text2: t('auth.login.oauth_setup_learning') });
        router.replace('/onboarding/goal');
        return;
      }
      try {
        const state = await OnboardingApi.getState();
        await mergeBackendState(state);
      } catch { /* network retry remains available on destination */ }
      router.replace('/(tabs)');
    },
    onError: (error: Error) => {
      const key = error.message?.startsWith('oauth_') ? error.message : (error as Error & { statusCode?: number }).statusCode === 503 ? 'oauth_not_configured' : 'oauth_failed';
      Toast.show({ type: 'error', text1: t('auth.login.oauth_failed_title'), text2: t(`auth.login.${key}`) });
    },
  });
  return { ...mutation, start: (provider: SocialProvider) => {
    if (running.current) return;
    running.current = true;
    mutation.mutate(provider, { onSettled: () => { running.current = false; } });
  } };
}
