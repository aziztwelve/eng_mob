import React, { useState } from 'react';
import { Modal, Pressable, Text, View, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { X } from 'lucide-react-native';

import { useCreateFlashcard } from '@/hooks/use-flashcards';
import { useTranslation } from 'react-i18next';

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

  const { t } = useTranslation();
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
              <Text className="text-foreground font-black text-2xl">{t('cards.add_title')}</Text>
              <Pressable onPress={onDismiss} className="p-2">
                <X size={24} color="#999" />
              </Pressable>
            </View>

            {/* Word input */}
            <View className="gap-2">
              <Text className="text-foreground font-bold">{t('cards.add_word')} *</Text>
              <TextInput
                value={word}
                onChangeText={setWord}
                placeholder={t('cards.word_ph')}
                placeholderTextColor="#999"
                className="bg-card border-2 border-border rounded-2xl p-4 text-foreground font-medium"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Translation input */}
            <View className="gap-2">
              <Text className="text-foreground font-bold">{t('cards.add_translation')} *</Text>
              <TextInput
                value={translation}
                onChangeText={setTranslation}
                placeholder={t('cards.translation_ph')}
                placeholderTextColor="#999"
                className="bg-card border-2 border-border rounded-2xl p-4 text-foreground font-medium"
              />
            </View>

            {/* Optional fields toggle */}
            {!showOptional && (
              <Pressable onPress={() => setShowOptional(true)}>
                <Text className="text-primary font-bold text-center">
                  {t('cards.add_optional')}
                </Text>
              </Pressable>
            )}

            {showOptional && (
              <>
                {/* Definition input */}
                <View className="gap-2">
                  <Text className="text-foreground font-bold">{t('cards.add_def2')}</Text>
                  <TextInput
                    value={definition}
                    onChangeText={setDefinition}
                    placeholder={t('cards.def_ph')}
                    placeholderTextColor="#999"
                    className="bg-card border-2 border-border rounded-2xl p-4 text-foreground font-medium"
                    multiline
                    numberOfLines={2}
                  />
                </View>

                {/* Example input */}
                <View className="gap-2">
                  <Text className="text-foreground font-bold">{t('cards.add_example')}</Text>
                  <TextInput
                    value={example}
                    onChangeText={setExample}
                    placeholder={t('cards.example_ph')}
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
                <Text className="text-white font-bold text-lg">{t('cards.add')}</Text>
              )}
            </Pressable>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
