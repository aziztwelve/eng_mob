// Client IDs are public. Client secrets belong exclusively to the backend.
module.exports = ({ config }) => {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
  const plugins = (config.plugins || []).filter(p => (Array.isArray(p) ? p[0] : p) !== '@react-native-google-signin/google-signin');
  plugins.push(iosClientId ? ['@react-native-google-signin/google-signin', {
    iosUrlScheme: `com.googleusercontent.apps.${iosClientId.replace(/\.apps\.googleusercontent\.com$/, '')}`,
  }] : '@react-native-google-signin/google-signin');
  return { ...config, plugins, extra: { ...config.extra, googleWebClientId: webClientId, googleIosClientId: iosClientId } };
};
