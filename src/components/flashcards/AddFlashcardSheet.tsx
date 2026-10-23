import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Text, View, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { useCreateFlashcard } from '@/hooks/use-flashcards';
import { ALL_LANGUAGES, getLanguage } from '@/lib/supported-languages';
import { useOnboardingState } from '@/hooks/use-onboarding';
import { useTranslation } from 'react-i18next';

/**
 * <AddFlashcardSheet> — bottom sheet для добавления новой flashcard.
 *
 * Поля: word (обязательно), translation (обязательно), definition (опционально),
 * example_sentence (опционально).
 *
 * English source words; the translation language is visible and selectable.
 */
export interface AddFlashcardSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

export function AddFlashcardSheet({ visible, onDismiss }: AddFlashcardSheetProps) {
  const keyboardHeight = useKeyboardHeight();
  const insets = useSafeAreaInsets();

  const { t, i18n } = useTranslation();
  const uiLang = i18n.resolvedLanguage === 'ru' ? 'ru' : i18n.resolvedLanguage === 'kk' ? 'kk' : 'en';
  const onboarding = useOnboardingState();
  const [translationLanguage, setTranslationLanguage] = useState('ru');
  const [failed, setFailed] = useState(false);
  const saving = useRef(false);
  const languageTouched = useRef(false);
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [definition, setDefinition] = useState('');
  const [example, setExample] = useState('');
  const [showOptional, setShowOptional] = useState(false);

  const createMutation = useCreateFlashcard();
  useEffect(() => { if (visible) { languageTouched.current = false; setFailed(false); } }, [visible]);
  useEffect(() => {
    if (!visible || word || translation || languageTouched.current) return;
    const preferred = onboarding.data?.native_language;
    setTranslationLanguage(preferred && preferred !== 'en' && getLanguage(preferred) ? preferred : uiLang === 'kk' ? 'kk' : 'ru');
  }, [visible, onboarding.data?.native_language, uiLang, word, translation]);
  const dismiss = () => { if (!saving.current) onDismiss(); };

  const handleSubmit = async () => {
    if (!word.trim() || !translation.trim() || saving.current) return;
    saving.current = true;
    setFailed(false);

    try {
      await createMutation.mutateAsync({
        word: word.trim(),
        translation: translation.trim(),
        language: 'en',
        target_language: translationLanguage,
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
    } catch {
      setFailed(true);
    } finally {
      saving.current = false;
    }
  };

  const canSubmit = word.trim() && translation.trim() && !createMutation.isPending;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
      <Animated.View entering={FadeIn.duration(180)} className="flex-1 justify-end bg-black/60">
        <Pressable className="absolute inset-0" onPress={dismiss} />
        <Animated.View
          entering={SlideInDown.duration(280)}
          className="bg-white rounded-t-3xl border-t-2 border-[#C9EDFF] max-h-[85%]"
          style={{ marginBottom: keyboardHeight }}
        >
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 20 + insets.bottom, gap: 16 }}>
            {/* Header */}
            <View className="flex-row items-center justify-between">
              <Text className="text-[#171A1C] font-black text-2xl">{t('cards.add_title')}</Text>
              <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel={t('common.close')} disabled={createMutation.isPending} className="p-2">
                <X size={24} color="#999" />
              </Pressable>
            </View>

            {/* Word input */}
            <View className="gap-2">
              <Text className="text-[#171A1C] font-bold">{t('cards.add_word')} · {getLanguage('en')?.nameI18n[uiLang]} *</Text>
              <TextInput
                editable={!createMutation.isPending}
                value={word}
                onChangeText={setWord}
                placeholder={t('cards.word_ph')}
                placeholderTextColor="#999"
                className="bg-[#F5FBFF] border-2 border-[#C9EDFF] rounded-2xl p-4 text-[#171A1C] font-medium"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View className="gap-2">
              <Text className="font-nunito-bold text-[#171A1C]">{t('cards.translation_language')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {[getLanguage('ru')!, getLanguage('kk')!, ...ALL_LANGUAGES.filter(language => !['en', 'ru', 'kk'].includes(language.code))].map(language => <Pressable
                  key={language.code} disabled={createMutation.isPending} onPress={() => { languageTouched.current = true; setTranslationLanguage(language.code); }}
                  accessibilityRole="button" accessibilityState={{ selected: language.code === translationLanguage }}
                  className={`min-h-[44px] justify-center rounded-xl border px-3 py-2 ${language.code === translationLanguage ? 'border-[#59C8FF] bg-[#EAF8FF]' : 'border-[#C9EDFF] bg-white'}`}>
                    <Text className="font-nunito-bold text-[#247FA8]">{language.nameI18n[uiLang]}</Text>
                  </Pressable>)}
              </ScrollView>
            </View>

            {/* Translation input */}
            <View className="gap-2">
              <Text className="text-[#171A1C] font-bold">{t('cards.add_translation')} · {getLanguage(translationLanguage)?.nameI18n[uiLang]} *</Text>
              <TextInput
                editable={!createMutation.isPending}
                value={translation}
                onChangeText={setTranslation}
                placeholder={t('cards.translation_ph')}
                placeholderTextColor="#999"
                className="bg-[#F5FBFF] border-2 border-[#C9EDFF] rounded-2xl p-4 text-[#171A1C] font-medium"
              />
            </View>

            {/* Optional fields toggle */}
            {!showOptional && (
              <Pressable onPress={() => setShowOptional(true)}>
                <Text className="text-[#2FA8E6] font-bold text-center">
                  {t('cards.add_optional')}
                </Text>
              </Pressable>
            )}

            {showOptional && (
              <>
                {/* Definition input */}
                <View className="gap-2">
                  <Text className="text-[#171A1C] font-bold">{t('cards.add_def2')}</Text>
                  <TextInput
                    editable={!createMutation.isPending}
                    value={definition}
                    onChangeText={setDefinition}
                    placeholder={t('cards.def_ph')}
                    placeholderTextColor="#999"
                    className="bg-[#F5FBFF] border-2 border-[#C9EDFF] rounded-2xl p-4 text-[#171A1C] font-medium"
                    multiline
                    numberOfLines={2}
                  />
                </View>

                {/* Example input */}
                <View className="gap-2">
                  <Text className="text-[#171A1C] font-bold">{t('cards.add_example')}</Text>
                  <TextInput
                    editable={!createMutation.isPending}
                    value={example}
                    onChangeText={setExample}
                    placeholder={t('cards.example_ph')}
                    placeholderTextColor="#999"
                    className="bg-[#F5FBFF] border-2 border-[#C9EDFF] rounded-2xl p-4 text-[#171A1C] font-medium"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </>
            )}

            {failed ? <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" className="text-center font-nunito-bold text-[#B4232A]">{t('common.save_failed')}</Text> : null}
            {/* Submit button */}
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              className={`rounded-2xl p-4 items-center ${
                canSubmit ? 'bg-[#2FA8E6] active:opacity-80' : 'bg-[#C9EDFF]'
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
