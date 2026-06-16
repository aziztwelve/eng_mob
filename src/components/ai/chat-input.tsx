import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Send, Volume2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { glass, CTA } from '@/components/sunset';

export function ChatInput({
  onSend,
  loading = false,
  placeholder = 'Напишите сообщение…',
  showAudioToggle = true,
}: {
  onSend: (content: string, wantAudio: boolean) => void | Promise<void>;
  loading?: boolean;
  placeholder?: string;
  showAudioToggle?: boolean;
}) {
  const [text, setText] = useState('');
  const [wantAudio, setWantAudio] = useState(false);
  // Локальный ref — блокирует повторный тап до завершения отправки
  const submittingRef = useRef(false);

  const submit = async () => {
    if (submittingRef.current || loading) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    submittingRef.current = true;
    setText('');
    try {
      await onSend(trimmed, wantAudio);
    } finally {
      submittingRef.current = false;
    }
  };

  const canSubmit = text.trim().length > 0 && !loading;

  return (
    <View style={[s.wrap, glass]}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.35)"
        editable={!loading}
        multiline
        numberOfLines={1}
        style={s.input}
      />

      {showAudioToggle && (
        <Pressable
          onPress={() => setWantAudio((v) => !v)}
          disabled={loading}
          style={[s.iconBtn, wantAudio ? s.iconBtnActive : glass]}
          accessibilityLabel={wantAudio ? 'Audio reply on' : 'Audio reply off'}
        >
          <Volume2 size={17} color={wantAudio ? '#fff' : 'rgba(255,255,255,0.55)'} />
        </Pressable>
      )}

      <Pressable onPress={submit} disabled={!canSubmit || loading} style={s.sendWrap}>
        <LinearGradient
          colors={canSubmit ? CTA : ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.12)']}
          style={s.sendBtn}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Send size={17} color={canSubmit ? '#fff' : 'rgba(255,255,255,0.4)'} />
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 22,
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 6,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    paddingHorizontal: 10,
    paddingVertical: 9,
    maxHeight: 120,
    minHeight: 40,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: 'rgba(168,36,63,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(168,36,63,0.4)',
  },
  sendWrap: { borderRadius: 14, overflow: 'hidden' },
  sendBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
});
