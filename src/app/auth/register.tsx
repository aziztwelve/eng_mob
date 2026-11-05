import { Redirect } from 'expo-router';

/** Keep old registration links on the current signup flow. */
export default function RegisterLink() {
  return <Redirect href="/onboarding/signup" />;
}
