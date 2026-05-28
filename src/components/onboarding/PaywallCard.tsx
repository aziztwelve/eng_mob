import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

/**
 * <PaywallCard> — SKU-карточка (annual / monthly) на paywall-экране.
 *
 * Selected state: рамка primary + чекбокс. Unselected — тонкая border + пустой кружок.
 */
export interface PaywallCardProps {
  title: string;
  monthlyPrice: string;
  totalPrice: string;
  badge?: string;
  saving?: string;
  selected: boolean;
  onPress: () => void;
}

export function PaywallCard({
  title,
  monthlyPrice,
  totalPrice,
  badge,
  saving,
  selected,
  onPress,
}: PaywallCardProps) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-2xl border-2 p-4 active:opacity-90 ${
        selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
      }`}
    >
      {badge ? (
        <View className="absolute -top-3 left-4 px-2 py-0.5 rounded-full bg-primary">
          <Text className="text-primary-foreground font-black text-xs uppercase">
            {badge}
          </Text>
        </View>
      ) : null}

      <View className="flex-row items-center gap-3">
        {/* Selection circle */}
        <View
          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
            selected ? 'border-primary bg-primary' : 'border-border bg-transparent'
          }`}
        >
          {selected ? <Check size={14} color="#ffffff" strokeWidth={3} /> : null}
        </View>

        {/* Title + saving */}
        <View className="flex-1">
          <Text className="text-foreground font-black text-base">{title}</Text>
          {saving ? (
            <Text className="text-primary font-bold text-xs mt-0.5">
              {saving}
            </Text>
          ) : null}
        </View>

        {/* Price */}
        <View className="items-end">
          <Text className="text-foreground font-black text-base">
            {monthlyPrice}
          </Text>
          <Text className="text-muted-foreground font-medium text-xs">
            {t('onboarding.paywall.sku.per_month', { total: totalPrice })}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
