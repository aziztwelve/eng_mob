import React from 'react';
import { Pressable, Text, View } from 'react-native';

import type { AILangOption } from '@/lib/ai-languages';

/**
 * Горизонтальный wrap-набор pill'ов для выбора языка в AI-табах.
 * Поддерживает `disabled` опции (с пометкой «Скоро»).
 *
 * Размеры:
 *   - `compact` (default) — короткий код (`EN`), для tutor/writing/pronunciation/roleplay.
 *   - `full` — полная подпись (`English`), для chat hub.
 */
export function LangPills({
  options,
  value,
  onChange,
  variant = 'compact',
}: {
  options: readonly AILangOption[];
  value: string;
  onChange: (v: string) => void;
  variant?: 'compact' | 'full';
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.value;
        const isDisabled = !!o.disabled;
        const label = variant === 'full' ? o.label : o.short;
        return (
          <Pressable
            key={o.value}
            onPress={() => !isDisabled && onChange(o.value)}
            disabled={isDisabled}
            className={`rounded-2xl px-3 py-2 border-2 flex-row items-center gap-1.5 ${
              isDisabled
                ? 'bg-muted border-border opacity-50'
                : active
                  ? 'bg-primary border-primary'
                  : 'bg-card border-border'
            } ${isDisabled ? '' : 'active:opacity-80'}`}
          >
            <Text
              className={`font-bold text-sm ${
                active && !isDisabled
                  ? 'text-primary-foreground'
                  : 'text-foreground'
              }`}
            >
              {label}
            </Text>
            {isDisabled && (
              <Text className="text-muted-foreground font-bold text-[10px] uppercase">
                Скоро
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
