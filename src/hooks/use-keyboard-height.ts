import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// Android runs edge-to-edge, so `adjustResize` and KeyboardAvoidingView no
// longer shrink the window; screens must lift their content by the keyboard
// height themselves. iOS is handled by KeyboardAvoidingView, so this stays 0.
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', (e) => setHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}
