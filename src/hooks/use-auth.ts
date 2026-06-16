import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClient, OnboardingApi } from '@/lib/api-client';
import { AuthService } from '@/lib/auth-service';
import { isOnboarded, mergeBackendState } from '@/lib/onboarding-storage';
import { ONBOARDING_KEY } from '@/hooks/use-onboarding';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from '@/types/api';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

// Auth API calls
const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await ApiClient.post<AuthResponse>(
      '/auth/login',
      credentials
    );
    return response;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await ApiClient.post<AuthResponse>('/auth/register', data);
    return response;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await ApiClient.get<User>('/auth/me');
    return response;
  },
};

// Login hook
export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      await AuthService.saveAuthResponse(data);
      queryClient.setQueryData(['currentUser'], data.user);
      // Подтягиваем серверный профиль онбординга в локальный кэш
      // (target_language/level/goal) — чтобы домашние экраны не были
      // пустыми. Best-effort, не блокирует вход.
      try {
        const remote = await OnboardingApi.getState();
        await mergeBackendState(remote);
        queryClient.invalidateQueries({ queryKey: ONBOARDING_KEY });
      } catch {
        // offline — не критично, догонит на следующем open
      }
      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
      });
      // Логин = возвращающийся пользователь (он уже регистрировался и
      // проходил онбординг). Ведём сразу в приложение; guest-gate в
      // (tabs) пропустит, т.к. токен не гостевой.
      router.replace('/(tabs)');
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Login failed',
        text2: error?.message || 'Please try again.',
      });
    },
  });
};

// Register hook
export const useRegister = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: async (data) => {
      await AuthService.saveAuthResponse(data);
      queryClient.setQueryData(['currentUser'], data.user);
      Toast.show({
        type: 'success',
        text1: 'Account created successfully!',
      });
      // Sprint 2: новый аккаунт = onboarding обязателен. На новом
      // устройстве флаг тоже сбросится (storage per-device).
      const onboarded = await isOnboarded();
      router.replace(onboarded ? '/(tabs)' : '/onboarding/welcome');
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Registration failed',
        text2: error?.message || 'Please try again.',
      });
    },
  });
};

// Logout hook
export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await AuthService.logout();
    },
    onSuccess: () => {
      queryClient.clear();
      router.replace('/auth/login');
      Toast.show({
        type: 'success',
        text1: 'Logged out successfully',
      });
    },
  });
};

// Current user hook
export const useCurrentUser = () => {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    // Подтягиваем актуальный профиль с backend (`GET /auth/me`), как только
    // знаем, что есть валидный токен. Логин дополнительно сидит кэш через
    // setQueryData(['currentUser']) — поэтому имя видно мгновенно, а на
    // холодном старте догружается реальными данными.
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
};

// Check if user is authenticated (async version)
export const useIsAuthenticated = () => {
  const [isAuth, setIsAuth] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    AuthService.isAuthenticated().then((result) => {
      setIsAuth(result);
      setIsLoading(false);
    });
  }, []);

  return { isAuthenticated: isAuth, isLoading };
};
