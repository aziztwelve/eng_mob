// Existing project contacts; override with approved production values when needed.
export const PROFILE_LINKS = {
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@lingoiq.online',
  privacy: process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://lingoiq.online/privacy',
  terms: process.env.EXPO_PUBLIC_TERMS_URL || '',
};
