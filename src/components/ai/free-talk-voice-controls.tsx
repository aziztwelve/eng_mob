import React, { useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, Text, View } from 'react-native';
import { ArrowUp, ChevronLeft, ChevronRight, Keyboard, Lightbulb, LockKeyholeOpen, Mic, Send, Trash2, Volume2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import type { useFreeTalk } from '@/hooks/use-free-talk';

type Props = {
  talk: ReturnType<typeof useFreeTalk>;
  allowed: boolean;
  typing: boolean;
  onType: () => void;
  onInspire: () => void;
  onLockChange: (locked: boolean) => void;
};
const HOLD_MS = 200;
const SWIPE_DISTANCE = 60;
type GestureOutcome = 'send' | 'cancel' | 'lock';

/** Hold to talk; release to send, swipe left to discard, right to lock. */
export function FreeTalkVoiceControls(props: Props) {
  const { t } = useTranslation();
  const current = useRef(props);
  current.current = props;
  const [holding, setHolding] = useState(false);
  const [locked, setLocked] = useState(false);
  const [direction, setDirection] = useState<GestureOutcome>('send');
  const lockedRef = useRef(false);
  const beganLocked = useRef(false);
  const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPromise = useRef<Promise<boolean> | null>(null);
  const isMounted = useRef(true);
  const gestureActive = useRef(false);
  const setLockedBoth = (value: boolean) => {
    if (lockedRef.current === value) return;
    lockedRef.current = value;
    if (isMounted.current) { setLocked(value); current.current.onLockChange(value); }
  };
  const clearStartTimer = () => { if (startTimer.current) clearTimeout(startTimer.current); startTimer.current = null; };
  const finishGesture = async (outcome: GestureOutcome) => {
    clearStartTimer();
    gestureActive.current = false;
    if (isMounted.current) { setHolding(false); setDirection('send'); }
    if (beganLocked.current) {
      beganLocked.current = false;
      setLockedBoth(false);
      await current.current.talk.stopAndSend();
      return;
    }
    const pending = startPromise.current;
    startPromise.current = null;
    if (!pending) {
      if (outcome === 'send') Toast.show({ type: 'info', text1: t('freeTalk.hold_hint') });
      return;
    }
    if (outcome === 'lock') setLockedBoth(true);
    const started = await pending;
    if (!started || !isMounted.current) { setLockedBoth(false); return; }
    if (outcome === 'cancel') { setLockedBoth(false); await current.current.talk.cancelRecording(); }
    else if (outcome === 'send') await current.current.talk.stopAndSend();
  };
  const finishRef = useRef(finishGesture);
  finishRef.current = finishGesture;
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => {
      const { talk, allowed } = current.current;
      return allowed && (talk.phase === 'idle' || (lockedRef.current && talk.phase === 'listening'));
    },
    onMoveShouldSetPanResponder: () => false,
    onPanResponderGrant: () => {
      gestureActive.current = true;
      beganLocked.current = lockedRef.current;
      if (beganLocked.current) return;
      setHolding(true);
      startPromise.current = null;
      startTimer.current = setTimeout(() => {
        startTimer.current = null;
        if (gestureActive.current) startPromise.current = current.current.talk.start();
      }, HOLD_MS);
    },
    onPanResponderMove: (_event, state) => {
      if (beganLocked.current) return;
      setDirection(state.dx <= -SWIPE_DISTANCE ? 'cancel' : state.dx >= SWIPE_DISTANCE ? 'lock' : 'send');
    },
    onPanResponderRelease: (_event, state) => {
      const outcome = state.dx <= -SWIPE_DISTANCE ? 'cancel' : state.dx >= SWIPE_DISTANCE ? 'lock' : 'send';
      void finishRef.current(outcome);
    },
    // Losing a touch must never send an unintended recording.
    onPanResponderTerminate: () => { void finishRef.current('cancel'); },
    onPanResponderTerminationRequest: () => false,
  })).current;
  useEffect(() => {
    if (props.talk.phase === 'idle' && !gestureActive.current && !startPromise.current) setLockedBoth(false);
  }, [props.talk.phase]);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; clearStartTimer(); };
  }, []);

  const phase = props.talk.phase;
  const recording = phase === 'listening' || holding || locked;
  const disabled = !props.allowed || (!recording && phase !== 'idle');
  const cancel = () => { setLockedBoth(false); void props.talk.cancelRecording(); };
  const recordColor = recording ? '#2EC76A' : '#389AF8';
  return (
    <View className="flex-row items-center justify-around gap-4 pb-1">
      {recording ? (
        <Pressable onPress={cancel} disabled={!locked || phase !== 'listening'} accessibilityRole="button" accessibilityLabel={t('freeTalk.discard_recording')}
          className={`h-12 min-w-16 flex-row items-center justify-center gap-2 rounded-full border border-[#FFC8C6] bg-[#FFE7E4] px-3 ${direction === 'cancel' ? 'opacity-60' : ''}`}>
          <Trash2 size={22} color="#FA725D" /><ChevronLeft size={20} color="#FA725D" />
        </Pressable>
      ) : (
        <Pressable onPress={props.onType} disabled={phase !== 'idle'} accessibilityRole="button" accessibilityLabel={t(props.typing ? 'freeTalk.voice' : 'freeTalk.type')}
          className={`items-center gap-1 ${phase !== 'idle' ? 'opacity-40' : ''}`}>
          <View className="h-14 w-14 items-center justify-center rounded-full border border-[#C9EDFF] bg-[#EAF8FF]">{props.typing ? <Mic size={24} color="#2FA8E6" /> : <Keyboard size={24} color="#2FA8E6" />}</View>
          <Text className="font-nunito-bold text-xs text-[#247FA8]">{t(props.typing ? 'freeTalk.voice' : 'freeTalk.type')}</Text>
        </Pressable>
      )}
      <View {...pan.panHandlers} accessibilityRole="button" accessible accessibilityLabel={t(locked ? 'freeTalk.finish_recording' : 'freeTalk.hold_hint')}
        accessibilityState={{ disabled }} accessibilityActions={locked ? [{ name: 'activate', label: t('freeTalk.finish_recording') }, { name: 'escape', label: t('freeTalk.discard_recording') }] : [{ name: 'activate', label: t('freeTalk.voice') }]}
        onAccessibilityAction={event => {
          if (event.nativeEvent.actionName === 'escape') cancel();
          else if (lockedRef.current) { setLockedBoth(false); void current.current.talk.stopAndSend(); }
          else if (current.current.allowed && phase === 'idle') { setLockedBoth(true); void current.current.talk.start().then(ok => { if (!ok) setLockedBoth(false); }); }
        }}
        className={`h-24 w-24 items-center justify-center rounded-full ${disabled ? 'opacity-50' : ''}`}
        style={{ backgroundColor: recordColor }}>
        {locked ? <ArrowUp size={39} color="#FFFFFF" strokeWidth={3} />
          : phase === 'thinking' ? <Send size={34} color="#FFFFFF" />
          : phase === 'speaking' ? <Volume2 size={36} color="#FFFFFF" />
          : <Mic size={38} color="#FFFFFF" />}
      </View>
      {recording ? (
        locked ? <View className="h-12 min-w-16" /> : <View className={`h-12 min-w-16 flex-row items-center justify-center gap-2 rounded-full border border-[#C9EDFF] bg-[#EAF8FF] px-3 ${direction === 'lock' ? 'opacity-60' : ''}`}><ChevronRight size={20} color="#389AF8" /><LockKeyholeOpen size={21} color="#389AF8" /></View>
      ) : (
        <Pressable onPress={props.onInspire} disabled={disabled} accessibilityRole="button" accessibilityLabel={t('freeTalk.inspire')}
          className={`items-center gap-1 ${disabled ? 'opacity-40' : ''}`}>
          <View className="h-14 w-14 items-center justify-center rounded-full border border-[#C9EDFF] bg-[#EAF8FF]"><Lightbulb size={25} color="#2FA8E6" /></View>
          <Text className="font-nunito-bold text-xs text-[#247FA8]">{t('freeTalk.inspire')}</Text>
        </Pressable>
      )}
    </View>
  );
}
