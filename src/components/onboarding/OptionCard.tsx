import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';

/**
 * <OptionCard> — карточка single-select опции в шагах онбординга v3.
 *
 * Pattern: emoji слева, bold title, optional subtitle, чекмарк справа при
 * selected. Visual style: rounded-2xl, border-4, hover/active opacity.
 *
 * Используется как row в <CollapsibleOptions> и напрямую в шагах
 * (welcome grid языков, paywall SKU).
 */
export interface OptionCardProps {
  emoji?: string;
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  /** Disable нужен для шагов где CTA активируется только после выбора и
   *  collapse-анимация ещё не отыграла. */
  disabled?: boolean;
  /** Аксессори справа (например, флаг страны в welcome-grid). */
  trailing?: React.ReactNode;
}

export function OptionCard({
  emoji,
  title,
  subtitle,
  selected,
  onPress,
  disabled,
  trailing,
}: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      className={`rounded-2xl border-4 px-4 py-3 flex-row items-center gap-3 ${
        selected
          ? 'border-primary bg-primary/10'
          : 'border-border bg-card'
      } ${disabled ? 'opacity-50' : 'active:opacity-80'}`}
    >
      {emoji ? (
        <View className="w-10 h-10 items-center justify-center">
          <Text style={{ fontSize: 28 }}>{emoji}</Text>
        </View>
      ) : null}
      <View className="flex-1">
        <Text
          className={`font-black text-base ${selected ? 'text-primary' : 'text-foreground'}`}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-muted-foreground font-medium text-sm mt-0.5">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {selected ? (
        <View className="w-6 h-6 items-center justify-center rounded-full bg-primary">
          <Check size={14} color="#0f0f15" strokeWidth={4} />
        </View>
      ) : null}
    </Pressable>
  );
}
