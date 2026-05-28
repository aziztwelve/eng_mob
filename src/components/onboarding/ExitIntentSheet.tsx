import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Mascot } from './Mascot';

/**
 * <ExitIntentSheet> — bottom-sheet "получи скидку 50%" при попытке закрыть paywall.
 *
 * Показывается через `<Modal transparent>` с overlay backdrop. Контент
 * слайдится снизу. Два CTA:
 *   - "Получить скидку" → onAcceptOffer (paywall_choice='special_offer').
 *   - "Нет, спасибо"    → onDismiss   (paywall_choice='dismissed').
 *
 * Любое решение ведёт на signup — sheet сам не закрывает paywall, просто
 * сообщает родителю.
 */
export interface ExitIntentSheetProps {
  visible: boolean;
  onAcceptOffer: () => void;
  onDismiss: () => void;
}

export function ExitIntentSheet({
  visible,
  onAcceptOffer,
  onDismiss,
}: ExitIntentSheetProps) {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Animated.View
        entering={FadeIn.duration(180)}
        className="flex-1 justify-end bg-black/60"
      >
        <Pressable
          className="absolute inset-0"
          onPress={onDismiss}
        />
        <Animated.View
          entering={SlideInDown.duration(280)}
          className="bg-background rounded-t-3xl border-t-2 border-border px-5 pt-5 pb-8 gap-4"
        >
          <View className="items-center">
            <Mascot pose="wink" size={120} />
          </View>

          <Text className="text-foreground font-black text-2xl text-center">
            {t('onboarding.paywall.exit_intent.title')}
          </Text>
          <Text className="text-muted-foreground font-medium text-base text-center">
            {t('onboarding.paywall.exit_intent.body')}
          </Text>

          <Pressable
            onPress={onAcceptOffer}
            className="rounded-2xl py-4 items-center bg-primary active:opacity-80 mt-2"
          >
            <Text className="text-primary-foreground font-black text-base">
              {t('onboarding.paywall.exit_intent.accept')}
            </Text>
          </Pressable>

          <Pressable
            onPress={onDismiss}
            className="py-2 items-center active:opacity-60"
          >
            <Text className="text-muted-foreground font-bold text-sm">
              {t('onboarding.paywall.exit_intent.dismiss')}
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
