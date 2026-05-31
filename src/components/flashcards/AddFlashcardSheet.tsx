import React, { useState } from 'react';
import { Modal, Pressable, Text, View, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { X } from 'lucide-react-native';

import { useCreateFlashcard } from '@/hooks/use-flashcards';

/**
 * <AddFlashcardSheet> — bottom sheet для добавления новой flashcard.
 *
 * Поля: word (обязательно), translation (обязательно), definition (опционально),
 * example_sentence (опционально).
 *
 * language/target_language пока хардкодим (en/ru) — TODO: брать из user profile.
 */
export interface AddFlashcardSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

export function AddFlashcardSheet({ visible, onDismiss }: AddFlashcardSheetProps) {
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [definition, setDefinition] = useState('');
  const [example, setExample] = useState('');
  const [showOptional, setShowOptional] = useState(false);

  const createMutation = useCreateFlashcard();

  const handleSubmit = async () => {
    if (!word.trim() || !translation.trim()) return;

    try {
      await createMutation.mutateAsync({
        word: word.trim(),
        translation: translation.trim(),
        language: 'en',
        target_language: 'ru',
        definition: definition.trim() || undefined,
        example_sentence: example.trim() || undefined,
      });
      // Reset form
      setWord('');
      setTranslation('');
      setDefinition('');
      setExample('');
      setShowOptional(false);
      onDismiss();
    } catch (error) {
      console.error('Failed to create flashcard:', error);
    }
  };

  const canSubmit = word.trim() && translation.trim() && !createMutation.isPending;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View entering={FadeIn.duration(180)} className="flex-1 justify-end bg-black/60">
        <Pressable className="absolute inset-0" onPress={onDismiss} />
        <Animated.View
          entering={SlideInDown.duration(280)}
          className="bg-background rounded-t-3xl border-t-2 border-border max-h-[85%]"
        >
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            {/* Header */}
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground font-black text-2xl">Добавить слово</Text>
              <Pressable onPress={onDismiss} className="p-2">
                <X size={24} color="#999" />
              </Pressable>
            </View>

            {/* Word input */}
            <View className="gap-2">
              <Text className="text-foreground font-bold">Слово *</Text>
              <TextInput
                value={word}
                onChangeText={setWord}
                placeholder="Например: hello"
                placeholderTextColor="#999"
                className="bg-card border-2 border-border rounded-2xl p-4 text-foreground font-medium"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Translation input */}
            <View className="gap-2">
              <Text className="text-foreground font-bold">Перевод *</Text>
              <TextInput
                value={translation}
                onChangeText={setTranslation}
                placeholder="Например: привет"
                placeholderTextColor="#999"
                className="bg-card border-2 border-border rounded-2xl p-4 text-foreground font-medium"
              />
            </View>

            {/* Optional fields toggle */}
            {!showOptional && (
              <Pressable onPress={() => setShowOptional(true)}>
                <Text className="text-primary font-bold text-center">
                  + Добавить определение и пример
                </Text>
              </Pressable>
            )}

            {showOptional && (
              <>
                {/* Definition input */}
                <View className="gap-2">
                  <Text className="text-foreground font-bold">Определение</Text>
                  <TextInput
                    value={definition}
                    onChangeText={setDefinition}
                    placeholder="Краткое объяснение"
                    placeholderTextColor="#999"
                    className="bg-card border-2 border-border rounded-2xl p-4 text-foreground font-medium"
                    multiline
                    numberOfLines={2}
                  />
                </View>

                {/* Example input */}
                <View className="gap-2">
                  <Text className="text-foreground font-bold">Пример</Text>
                  <TextInput
                    value={example}
                    onChangeText={setExample}
                    placeholder="Предложение с этим словом"
                    placeholderTextColor="#999"
                    className="bg-card border-2 border-border rounded-2xl p-4 text-foreground font-medium"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </>
            )}

            {/* Submit button */}
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              className={`rounded-2xl p-4 items-center ${
                canSubmit ? 'bg-primary active:opacity-80' : 'bg-muted'
              }`}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Добавить</Text>
              )}
            </Pressable>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
