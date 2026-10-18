import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowLeft, Check, CloudOff, RotateCcw, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { FigmaSvg } from '@/components/figma/FigmaSvg';
import { SkyBackground } from '@/components/lesson/sky-lesson-header';
import { KeyboardLift } from '@/components/keyboard-lift';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { wordbankAssets as assets } from './wordbank-assets';

export function BankText({ children, small = false }: { children: React.ReactNode; small?: boolean }) {
  return <Text className={small ? 'font-nunito-semibold text-[13px] leading-[19px] text-[#5D686F]' : 'font-nunito-semibold text-[16px] leading-[23px] text-[#171A1C]'}>{children}</Text>;
}
export function BankCard({ children }: { children: React.ReactNode }) {
  return <View className="gap-4 rounded-[24px] border border-b-4 border-[#E3E6E8] bg-white p-4">{children}</View>;
}
export function BankButton({ label, onPress, disabled = false, secondary = false, tone = 'blue', busy = false }: {
  label: string; onPress: () => void; disabled?: boolean; secondary?: boolean; tone?: 'blue' | 'green' | 'red'; busy?: boolean;
}) {
  return <Pressable
    accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, busy }} disabled={disabled || busy} onPress={onPress}
    className={`min-h-[52px] flex-row items-center justify-center gap-2 rounded-[16px] border border-b-4 px-4 py-3 active:opacity-80 ${disabled ? 'opacity-45' : ''} ${secondary ? 'border-[#D8E7EF] bg-white' : tone === 'green' ? 'border-[#239A42] bg-[#34C759]' : tone === 'red' ? 'border-[#BB353B] bg-[#E5484D]' : 'border-[#3E8CB2] bg-[#59C8FF]'}`}
  >
    {busy ? <ActivityIndicator color={secondary ? '#2FA8E6' : '#FFFFFF'} /> : null}
    <Text className={`text-center font-nunito-extrabold text-[16px] leading-[22px] ${secondary ? 'text-[#247FA8]' : 'text-white'}`}>{label}</Text>
  </Pressable>;
}
export function BankAudioButton({ onPress, busy, label }: { onPress: () => void; busy?: boolean; label: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={busy} onPress={onPress} className="h-12 w-12 items-center justify-center rounded-[14px] border-b-4 border-[#3E8CB2] bg-[#59C8FF] active:opacity-80">
    {busy ? <ActivityIndicator color="#FFFFFF" /> : <FigmaSvg source={assets.speaker} width={24} height={24} />}
  </Pressable>;
}

export function BankCoach({ question, compact = false }: { question?: string; compact?: boolean }) {
  return <View className={`overflow-hidden rounded-[22px] bg-[#DFF5FF] ${compact ? 'h-[188px]' : 'h-[230px]'}`}>
    <Image source={assets.coachBackground} className="absolute h-full w-full" resizeMode="cover" accessible={false} />
    {question ? <View className="z-10 mx-5 mt-3 self-center rounded-[16px] border border-[#DDE5E9] bg-white px-4 py-2">
      <Text className="text-center font-nunito-bold text-[17px] leading-[24px] text-[#171A1C]">{question}</Text>
    </View> : null}
    <Image source={assets.coach} className={`absolute bottom-0 self-center ${compact ? 'h-[104px] w-[138px]' : 'h-[165px] w-[220px]'}`} resizeMode="contain" accessible={false} />
  </View>;
}
export type BankFeedback = { kind: 'wrong' | 'correct'; answer?: string } | null;
export function BankFeedbackPanel({ feedback, pending, saveError, onRetry }: { feedback: BankFeedback; pending: boolean; saveError: boolean; onRetry: () => void }) {
  const { t } = useTranslation();
  if (!feedback && !pending && !saveError) return null;
  return <View accessibilityLiveRegion="polite" className={`gap-2 rounded-[20px] border px-4 py-3 ${feedback?.kind === 'wrong' || saveError ? 'border-[#F3BABC] bg-[#FFF0F0]' : feedback?.kind === 'correct' ? 'border-[#AFE4BC] bg-[#ECFFF2]' : 'border-[#C9EDFF] bg-[#F0FAFF]'}`}>
    <View className="flex-row items-center gap-2">
      {pending ? <CloudOff size={20} color="#247FA8" /> : feedback?.kind === 'correct' ? <Check size={20} color="#239A42" /> : <X size={20} color="#BB353B" />}
      <Text className="flex-1 font-nunito-bold text-[14px] leading-5 text-[#171A1C]">{pending ? t('practice.bank_player.pending_sync') : saveError ? t('practice.bank_player.save_error') : feedback?.kind === 'correct' ? t('practice.bank_player.correct') : t('practice.bank_player.try_again')}</Text>
    </View>
    {feedback?.kind === 'wrong' && feedback.answer ? <BankText small>{t('practice.bank_player.right_answer', { answer: feedback.answer })}</BankText> : null}
    {pending ? <BankButton label={t('practice.bank_player.retry_sync')} secondary onPress={onRetry} /> : null}
  </View>;
}
export function WordBankFrame({ step, title, onBack, children, bottomInset = 0 }: {
  step: number; title: string; onBack: () => void; children: React.ReactNode; bottomInset?: number;
}) {
  const { t } = useTranslation();
  const keyboardOpen = useKeyboardHeight() > 0;
  return <View className="flex-1 overflow-hidden bg-white">
    <SkyBackground />
    <View className="absolute left-[-70px] top-[-20px]" pointerEvents="none"><FigmaSvg source={assets.cloudLeft} width={200.388} height={96.511} /></View>
    <View className="absolute right-[-65px] top-[90px]" pointerEvents="none"><FigmaSvg source={assets.cloudRight} width={205.784} height={72.252} /></View>
    <View className="absolute right-[20px] top-[-15px]" pointerEvents="none"><FigmaSvg source={assets.cloudTop} width={143.853} height={54.754} /></View>
    <View className="flex-row items-center gap-3 px-4 pb-4 pt-3">
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('practice.bank_back')} className="h-12 w-12 items-center justify-center rounded-[14px] border border-b-4 border-[#E3E6E8] bg-white"><ArrowLeft size={23} color="#5D686F" /></Pressable>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 15, now: step > 15 ? 15 : Math.max(0, step - 1) }} className="h-[24px] flex-1 overflow-hidden rounded-full border border-[#C9EDFF] bg-white">
        <View className="h-full rounded-full bg-[#59C8FF]" style={{ width: `${step > 15 ? 100 : ((step - 1) / 15) * 100}%` }} />
      </View>
      <Text className="font-nunito-extrabold text-[13px] text-[#247FA8]">{Math.min(step, 15)}/15</Text>
    </View>
    <Text accessibilityRole="header" className="px-4 pb-3 font-nunito-extrabold text-[22px] leading-[29px] text-[#171A1C]">{title}</Text>
    <KeyboardLift>
      <ScrollView key={step} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerClassName="grow gap-4 px-4 pb-5" contentContainerStyle={{ paddingBottom: keyboardOpen ? 20 : Math.max(20, bottomInset + 12) }}>{children}</ScrollView>
    </KeyboardLift>
  </View>;
}
export function BankRetry({ onPress, label }: { onPress: () => void; label: string }) {
  return <Pressable onPress={onPress} accessibilityRole="button" className="min-h-11 flex-row items-center justify-center gap-2 rounded-[14px] border border-[#C9EDFF] bg-white px-3 py-2"><RotateCcw size={18} color="#247FA8" /><Text className="font-nunito-bold text-[14px] text-[#247FA8]">{label}</Text></Pressable>;
}
