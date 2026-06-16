import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { neon } from '@/components/neon-screen';

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
      style={{
        borderRadius: 20,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? neon.primary : neon.border,
        backgroundColor: selected ? 'rgba(46,236,200,0.10)' : neon.surface,
        padding: 16,
        shadowColor: neon.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: selected ? 0.24 : 0,
        shadowRadius: 16,
      }}
    >
      {badge ? (
        <View style={{ position: 'absolute', top: -12, left: 16, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: neon.primary }}>
          <Text style={{ color: neon.ink, fontWeight: '900', fontSize: 12, textTransform: 'uppercase' }}>
            {badge}
          </Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Selection circle */}
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            borderWidth: 2,
            borderColor: selected ? neon.primary : neon.border,
            backgroundColor: selected ? neon.primary : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected ? <Check size={14} color={neon.ink} strokeWidth={3} /> : null}
        </View>

        {/* Title + saving */}
        <View style={{ flex: 1 }}>
          <Text style={{ color: neon.text, fontWeight: '900', fontSize: 16 }}>{title}</Text>
          {saving ? (
            <Text style={{ color: neon.primary, fontWeight: '800', fontSize: 12, marginTop: 2 }}>
              {saving}
            </Text>
          ) : null}
        </View>

        {/* Price */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: neon.text, fontWeight: '900', fontSize: 16 }}>
            {monthlyPrice}
          </Text>
          <Text style={{ color: neon.muted, fontWeight: '600', fontSize: 12 }}>
            {t('onboarding.paywall.sku.per_month', { total: totalPrice })}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
