import { Redirect, useLocalSearchParams } from 'expo-router';
/** Old deep links have no UI and cannot reopen removed steps. */
export default function RetiredOnboardingLink() {
  const { retired } = useLocalSearchParams<{ retired: string[] }>();
  const name = retired?.[0];
  if (name === 'placement-test') return <Redirect href="/onboarding/level" />;
  if (name === 'daily-commit' || name === 'projection') return <Redirect href="/onboarding/reminder-time" />;
  return <Redirect href="/onboarding/signup" />;
}
