import React, { useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { Send, Volume2 } from 'lucide-react-native';

/**
 * ChatInput — TextInput + send-button + want_audio toggle.
 *
 * Mirror eng_next2 ChatInput, но без Enter-to-send (на mobile это
 * стандартное Return — letting `multiline` поведение работать естественно).
 *
 * Send disabled когда строка пуста или loading=true.
 */
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

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setText('');
    await onSend(trimmed, wantAudio);
  };

  const canSubmit = text.trim().length > 0 && !loading;

  return (
    <View className="bg-card border-4 border-border rounded-3xl p-2 flex-row items-end gap-2">
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        editable={!loading}
        multiline
        numberOfLines={1}
        className="flex-1 text-foreground font-medium"
        style={{
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: '#fff',
          maxHeight: 120,
          minHeight: 44,
        }}
      />

      {showAudioToggle && (
        <Pressable
          onPress={() => setWantAudio((v) => !v)}
          disabled={loading}
          className={`h-11 w-11 rounded-2xl items-center justify-center ${
            wantAudio ? 'bg-primary' : 'bg-muted border-2 border-border'
          } active:opacity-80`}
          accessibilityLabel={wantAudio ? 'Audio reply on' : 'Audio reply off'}
        >
          <Volume2
            size={18}
            color={wantAudio ? '#1a1a1a' : '#9ca3af'}
          />
        </Pressable>
      )}

      <Pressable
        onPress={submit}
        disabled={!canSubmit}
        className={`h-11 px-4 rounded-2xl items-center justify-center flex-row gap-1 ${
          canSubmit ? 'bg-primary active:opacity-80' : 'bg-muted opacity-60'
        }`}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#1a1a1a" />
        ) : (
          <Send size={18} color={canSubmit ? '#1a1a1a' : '#9ca3af'} />
        )}
      </Pressable>
    </View>
  );
}
