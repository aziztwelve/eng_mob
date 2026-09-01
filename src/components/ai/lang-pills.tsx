import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { glass } from '@/components/sunset';
import type { AILangOption } from '@/lib/ai-languages';

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
  const { t } = useTranslation();
  return (
    <View style={s.row}>
      {options.map((o) => {
        const active = value === o.value;
        const disabled = !!o.disabled;
        const label = variant === 'full' ? o.label : o.short;
        return (
          <Pressable
            key={o.value}
            onPress={() => !disabled && onChange(o.value)}
            disabled={disabled}
            style={[
              s.pill,
              active && !disabled ? s.pillActive : glass,
              disabled && s.pillDisabled,
            ]}
          >
            <Text style={[s.pillText, active && !disabled && s.pillTextActive]}>
              {label}
            </Text>
            {disabled && <Text style={s.soonText}>{t('ai.soon')}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 4 },
  pill: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 4 },
  pillActive: { backgroundColor: '#A8243F', borderWidth: 0 },
  pillDisabled: { opacity: 0.4 },
  pillText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700' },
  pillTextActive: { color: '#fff' },
  soonText: { color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
});
