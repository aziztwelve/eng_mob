import { Platform, TurboModuleRegistry } from 'react-native';
import Constants from 'expo-constants';
import { ApiClient } from './api-client';
import type { AuthResponse } from '@/types/api';

export type SocialProvider = 'google' | 'apple';
export type SocialAuthResponse = AuthResponse & { created: boolean };
export class SocialAuthCancelled extends Error {}

function clientId(name: 'googleWebClientId' | 'googleIosClientId'): string {
  const extra = Constants.expoConfig?.extra?.[name];
  const env = name === 'googleWebClientId' ? process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID : process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  return typeof extra === 'string' && extra.trim() ? extra.trim() : env?.trim() ?? '';
}

// A stale native build must still open the normal email login screen.
function googleSdk(): typeof import('@react-native-google-signin/google-signin') {
  if (!TurboModuleRegistry.get('RNGoogleSignin')) throw new Error('oauth_native_build_required');
  // Native SDK must be loaded lazily so an older build can still open email login.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@react-native-google-signin/google-signin');
}

export async function socialSignIn(provider: SocialProvider): Promise<SocialAuthResponse> {
  if (provider === 'apple' && Platform.OS !== 'ios') throw new Error('oauth_unavailable');
  if (provider === 'google') {
    const webClientId = clientId('googleWebClientId');
    const iosClientId = clientId('googleIosClientId');
    if (!webClientId || (Platform.OS === 'ios' && !iosClientId)) throw new Error('oauth_not_configured');
    const sdk = googleSdk();
    sdk.GoogleSignin.configure({ webClientId, iosClientId: iosClientId || undefined, offlineAccess: true });
    if (Platform.OS === 'android') await sdk.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const challenge = await ApiClient.post<{ challenge_id: string; nonce: string }>(`/auth/social/google/challenge`, {});
    try {
      // A fresh code is exchanged exactly once by our backend.
      await sdk.GoogleSignin.signOut();
      const result = await sdk.GoogleSignin.signIn();
      if (!sdk.isSuccessResponse(result)) throw new SocialAuthCancelled();
      if (!result.data.serverAuthCode) throw new Error('oauth_no_token');
      return await ApiClient.post<SocialAuthResponse>('/auth/social/google', { challenge_id: challenge.challenge_id, authorization_code: result.data.serverAuthCode });
    } catch (error) {
      if (sdk.isErrorWithCode(error) && (error.code === sdk.statusCodes.SIGN_IN_CANCELLED || error.code === sdk.statusCodes.IN_PROGRESS)) throw new SocialAuthCancelled();
      throw error;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const apple: typeof import('expo-apple-authentication') = require('expo-apple-authentication');
  if (!await apple.isAvailableAsync()) throw new Error('oauth_unavailable');
  const challenge = await ApiClient.post<{ challenge_id: string; nonce: string }>('/auth/social/apple/challenge', {});
  try {
    const credential = await apple.signInAsync({ requestedScopes: [apple.AppleAuthenticationScope.FULL_NAME, apple.AppleAuthenticationScope.EMAIL], nonce: challenge.nonce, state: challenge.challenge_id });
    if (!credential.identityToken || credential.state !== challenge.challenge_id) throw new Error('oauth_no_token');
    const display_name = credential.fullName ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ').slice(0, 80) : undefined;
    return await ApiClient.post<SocialAuthResponse>('/auth/social/apple', { challenge_id: challenge.challenge_id, identity_token: credential.identityToken, display_name });
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') throw new SocialAuthCancelled();
    throw error;
  }
}
