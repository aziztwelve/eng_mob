import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crown, MessageCircle, Sparkles } from 'lucide-react-native';

const copy = {
  ru: {
    title: 'Подписка', eyebrow: 'LINGOIQ PREMIUM', headline: 'Больше возможностей для английского',
    description: 'Подписка LingoIQ скоро появится. Мы сообщим подробности перед запуском.',
    price: 'Цена', terms: 'в месяц',
    access: 'Учитесь и практикуйтесь', accessDetail: 'Условия и возможности Premium будут объявлены перед запуском.',
    coming: 'Скоро', notice: 'Покупка пока недоступна. Оплата не будет списана.',
  },
  en: {
    title: 'Subscription', eyebrow: 'LINGOIQ PREMIUM', headline: 'More ways to learn English',
    description: 'LingoIQ Premium is coming soon. We’ll share the details before launch.',
    price: 'Price', terms: 'per month',
    access: 'Learn and practise', accessDetail: 'Premium features and terms will be announced before launch.',
    coming: 'Coming soon', notice: 'Purchases are not available yet. You will not be charged.',
  },
  kk: {
    title: 'Жазылым', eyebrow: 'LINGOIQ PREMIUM', headline: 'Ағылшын тілін үйренуге көбірек мүмкіндік',
    description: 'LingoIQ Premium жақында қолжетімді болады. Толық ақпаратты іске қосар алдында хабарлаймыз.',
    price: 'Бағасы', terms: 'айына',
    access: 'Үйреніңіз және жаттығыңыз', accessDetail: 'Premium мүмкіндіктері мен шарттары іске қосар алдында жарияланады.',
    coming: 'Жақында', notice: 'Сатып алу әзірге қолжетімсіз. Төлем алынбайды.',
  },
} as const;

export default function SubscriptionScreen() {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage?.slice(0, 2);
  const text = copy[lang === 'en' || lang === 'kk' ? lang : 'ru'];

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-mieo-bg">
      <Stack.Screen options={{ title: text.title }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="w-full max-w-[600px] self-center px-4 pt-5">
          <View className="items-center rounded-3xl bg-[#E8F8FF] px-6 py-8">
            <View className="h-16 w-16 items-center justify-center rounded-3xl bg-white">
              <Crown size={32} color="#149FE4" />
            </View>
            <Text className="mt-5 font-nunito-extrabold text-xs tracking-widest text-[#138CC7]">{text.eyebrow}</Text>
            <Text className="mt-2 text-center font-nunito-black text-[27px] leading-9 text-mieo-heading">{text.headline}</Text>
            <Text className="mt-3 text-center font-nunito-medium text-base leading-6 text-mieo-body">{text.description}</Text>
          </View>

          <View className="mt-5 rounded-3xl border-[1.5px] border-[#C9EDFF] bg-mieo-surface p-5">
            <View className="flex-row items-center justify-between">
              <Text className="font-nunito-extrabold text-base text-mieo-heading">{text.price}</Text>
              <Sparkles size={20} color="#1AB3FF" />
            </View>
            <Text className="mt-3 font-nunito-black text-4xl text-mieo-heading">$15.99</Text>
            <Text className="mt-1 font-nunito-medium text-sm text-mieo-body">{text.terms}</Text>
          </View>

          <View className="mt-4 flex-row items-start gap-3 rounded-3xl border border-mieo-stroke bg-mieo-surface p-5">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E8F8FF]"><MessageCircle size={21} color="#149FE4" /></View>
            <View className="flex-1">
              <Text className="font-nunito-extrabold text-base text-mieo-heading">{text.access}</Text>
              <Text className="mt-1 font-nunito-medium text-sm leading-5 text-mieo-body">{text.accessDetail}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <View className="w-full max-w-[600px] self-center px-4 pb-3 pt-2">
        <View accessibilityRole="button" accessibilityState={{ disabled: true }} className="min-h-[52px] items-center justify-center rounded-2xl bg-[#C5D9E1] px-4">
          <Text className="font-nunito-extrabold text-base text-white">{text.coming}</Text>
        </View>
        <Text className="mt-2 text-center font-nunito-medium text-xs leading-5 text-mieo-body">{text.notice}</Text>
      </View>
    </SafeAreaView>
  );
}
