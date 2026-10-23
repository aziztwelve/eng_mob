import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export function ProfileButton({ label, onPress, disabled = false, block = false }: {
  label: string; onPress: () => void; disabled?: boolean; block?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      className={`min-h-12 items-center justify-center rounded-2xl bg-mieo-primary px-5 py-3 ${block ? 'w-full' : ''} ${disabled ? 'opacity-50' : 'active:opacity-80'}`}>
      <Text className="font-nunito-extrabold text-base text-mieo-heading text-center">{label}</Text>
    </Pressable>
  );
}

export function ProfileTabs({ tabs, active, onChange }: {
  tabs: { key: string; label: string }[]; active: string; onChange: (key: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {tabs.map(tab => (
        <Pressable key={tab.key} accessibilityRole="tab" accessibilityState={{ selected: tab.key === active }} onPress={() => onChange(tab.key)}
          className={`min-h-11 justify-center rounded-xl border px-4 py-2 ${tab.key === active ? 'border-mieo-primary bg-mieo-sky' : 'border-mieo-stroke bg-mieo-surface'}`}>
          <Text className="font-nunito-extrabold text-sm text-mieo-heading">{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ProfileQueryError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View accessibilityRole="alert" className="gap-3 rounded-2xl border border-mieo-stroke bg-mieo-surface p-4">
      <Text className="font-nunito-semibold text-sm text-mieo-error-text">{t('common.load_failed')}</Text>
      <ProfileButton label={t('practice.retry')} onPress={onRetry} />
    </View>
  );
}
