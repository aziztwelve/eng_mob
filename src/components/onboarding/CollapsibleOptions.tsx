import React from 'react';
import { View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';

import { OptionCard, type OptionCardProps } from './OptionCard';

/**
 * <CollapsibleOptions> — список single-select опций с collapse-after-select.
 *
 * Поведение:
 *   - Если ничего не выбрано — показываем все опции.
 *   - После выбора — все НЕвыбранные опции анимированно скрываются (fade-out
 *     + layout transition), выбранная остаётся.
 *   - Reanimated v4 LinearTransition обеспечивает плавную перекомпоновку.
 *
 * Используется во всех шагах онбординга v3 типа single-select (goal / age /
 * level / daily-commit / pain / speaking / past / future / emotional / reminder).
 *
 * Контракт:
 *   - `options` — массив { value, ...OptionCardProps without selected/onPress }.
 *   - `value` — текущее выбранное значение (либо null).
 *   - `onChange(value)` — вызывается при tap'е на опцию.
 *
 * См. docs/tasks/mob/onboarding-v3-oki-style.md §3.5.
 */
export interface CollapsibleOption<V extends string | number>
  extends Omit<OptionCardProps, 'selected' | 'onPress'> {
  value: V;
}

export interface CollapsibleOptionsProps<V extends string | number> {
  options: CollapsibleOption<V>[];
  value: V | null;
  onChange: (value: V) => void;
  /** Если true — collapse не происходит, все опции остаются видимыми
   *  (для welcome-grid где single-select но collapse мешает). */
  showAllWhenSelected?: boolean;
}

export function CollapsibleOptions<V extends string | number>({
  options,
  value,
  onChange,
  showAllWhenSelected = false,
}: CollapsibleOptionsProps<V>) {
  return (
    <View style={{ gap: 12 }} accessibilityRole="radiogroup">
      {options.map((opt) => {
        const isSelected = opt.value === value;
        const shouldHide = value !== null && !isSelected && !showAllWhenSelected;
        if (shouldHide) return null;
        return (
          <Animated.View
            key={opt.value}
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(140)}
            layout={LinearTransition.duration(220)}
          >
            <OptionCard
              emoji={opt.emoji}
              title={opt.title}
              subtitle={opt.subtitle}
              trailing={opt.trailing}
              selected={isSelected}
              onPress={() => onChange(opt.value)}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}
