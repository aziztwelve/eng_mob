import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check, BriefcaseBusiness, ChartNoAxesColumnIncreasing, Plane, Target, MessagesSquare, GraduationCap, Headphones, UserRound, Sprout, Sun, Sunrise, Moon, CalendarDays, type LucideIcon } from 'lucide-react-native';

const ICONS: Record<string, LucideIcon> = {
  '💼': BriefcaseBusiness, '📈': ChartNoAxesColumnIncreasing, '✈️': Plane, '🎯': Target, '🗣️': MessagesSquare,
  '📚': GraduationCap, '🎧': Headphones, '👶': UserRound, '🎒': UserRound, '🎓': GraduationCap,
  '🧑‍💻': UserRound, '🧑‍🏫': UserRound, '👴': UserRound, '🌱': Sprout, '🌿': ChartNoAxesColumnIncreasing,
  '🌳': ChartNoAxesColumnIncreasing, '🌲': ChartNoAxesColumnIncreasing, '🏔️': ChartNoAxesColumnIncreasing,
  '🎈': Sprout, '🌅': Sunrise, '🌞': Sun, '🌙': Moon, '🎲': CalendarDays,
};
export interface OptionCardProps {
  emoji?: string; title: string; subtitle?: string; selected: boolean;
  onPress: () => void; disabled?: boolean; trailing?: React.ReactNode;
}
export function OptionCard({ emoji, title, subtitle, selected, onPress, disabled, trailing }: OptionCardProps) {
  const Icon = ICONS[emoji ?? ''] ?? UserRound;
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }} accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      className={`min-h-[76px] flex-row items-center gap-3 rounded-[20px] border-2 px-4 py-3 active:opacity-80 ${selected ? 'border-[#15B4FA] bg-[#E5F7FF]' : 'border-white bg-white/95'} ${disabled ? 'opacity-50' : ''}`}>
      <View className="h-9 w-9 items-center justify-center"><Icon size={27} color="#19A9E9" strokeWidth={2.3} /></View>
      <View className="flex-1">
        <Text className="font-nunito-extrabold text-base leading-5 text-[#142A35]">{title}</Text>
        {subtitle && <Text className="mt-1 font-nunito-medium text-[13px] leading-[17px] text-[#58788A]">{subtitle}</Text>}
      </View>
      {trailing}
      {selected && <View className="h-6 w-6 items-center justify-center rounded-full bg-[#12B4FB]"><Check size={15} color="white" strokeWidth={3} /></View>}
    </Pressable>
  );
}
