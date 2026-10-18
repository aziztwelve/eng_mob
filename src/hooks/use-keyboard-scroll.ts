import { useCallback, useEffect, useRef } from 'react';
import { Keyboard, Platform, ScrollView, StatusBar, TextInput } from 'react-native';

/** Re-measure the focused field after KeyboardLift has resized the viewport. */
export function useKeyboardScroll() {
  const ref = useRef<ScrollView>(null);
  const shown = useRef(false);
  const frame = useRef<number | null>(null);
  const reveal = useCallback(() => {
    if (!shown.current) return;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const focused = TextInput.State.currentlyFocusedInput();
      if (!focused) return;
      // RN's helper assumes a full-screen ScrollView. Ours starts below the
      // safe area (and, on signup, the progress header), so include its origin.
      ref.current?.getNativeScrollRef()?.measureInWindow((_x, y) => {
        // Android measureInWindow excludes the status bar; keyboard screenY
        // includes it, so normalize both measurements to screen coordinates.
        const statusInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
        ref.current?.scrollResponderScrollNativeHandleToKeyboard(focused, y + statusInset + 24, true);
      });
    });
  }, []);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => { shown.current = true; reveal(); });
    const hide = Keyboard.addListener('keyboardDidHide', () => { shown.current = false; });
    return () => {
      show.remove(); hide.remove();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [reveal]);
  return { ref, reveal };
}
