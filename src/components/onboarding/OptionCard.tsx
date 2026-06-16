import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { neon } from '@/components/neon-screen';

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
      style={{
        borderRadius: 20,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? neon.primary : neon.border,
        backgroundColor: selected ? 'rgba(46,236,200,0.10)' : neon.surface,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        opacity: disabled ? 0.5 : 1,
        shadowColor: neon.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: selected ? 0.24 : 0,
        shadowRadius: 16,
      }}
    >
      {emoji ? (
        <View style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <Text style={{ fontSize: 28 }}>{emoji}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: selected ? neon.primary : neon.text, fontWeight: '900', fontSize: 16 }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: neon.muted, fontWeight: '600', fontSize: 14, marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {selected ? (
        <View style={{ width: 26, height: 26, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: neon.primary }}>
          <Check size={14} color={neon.ink} strokeWidth={4} />
        </View>
      ) : null}
    </Pressable>
  );
}
