import React from 'react';
import { KeyboardAvoidingView, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';

// Screen-level wrapper: keeps the content (and bottom buttons) above the
// keyboard on both platforms. Use it as the root of any screen with inputs.
export function KeyboardLift({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const keyboardHeight = useKeyboardHeight();
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style, keyboardHeight > 0 ? { paddingBottom: keyboardHeight } : null]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
