import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { SKY } from './sky-lesson-header';

/**
 * Универсальная нижняя панель: Check (idle) или Correct/Wrong feedback.
 */
export type FeedbackState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'correct'; explanation?: string }
  | { kind: 'wrong'; explanation?: string; correctText?: string };

interface FeedbackBarProps {
  state: FeedbackState;
  canSubmit: boolean;
  onSubmit: () => void;
  onContinue: () => void;
  isLast?: boolean;
  /** Кастомный лейбл кнопки submit. По умолчанию — localized «Check». */
  submitLabel?: string;
  /** 'sky' — светлое оформление Game Play (Figma 246:15988). */
  variant?: 'neon' | 'sky';
}

export function FeedbackBar({
  state,
  canSubmit,
  onSubmit,
  onContinue,
  isLast,
  submitLabel,
  variant = 'sky',
}: FeedbackBarProps) {
  const { t } = useTranslation();
  if (variant === 'sky') {
    const done = state.kind === 'correct' || state.kind === 'wrong';
    const ok = state.kind === 'correct';
    if (done) {
      const ink = ok ? '#1E7A3A' : '#B4232A';
      return (
        <View style={{ borderRadius: 24, padding: 16, backgroundColor: ok ? '#E9FBEF' : '#FFECEC', borderWidth: 1.5, borderColor: ok ? '#BDEFCB' : '#FFC9CC' }}>
          <Text style={{ fontFamily: 'Nunito_900Black', fontSize: 22, color: ink }}>
            {ok ? t('lesson.feedback.correct') : t('lesson.feedback.incorrect')}
          </Text>
          {state.kind === 'wrong' && state.correctText ? (
            <Text style={{ fontFamily: 'Nunito_700Bold', fontSize: 14, color: ink, marginTop: 2 }}>
              {t('lesson.feedback.correct_answer')} {state.correctText}
            </Text>
          ) : null}
          {state.explanation ? (
            <Text style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: ink, marginTop: 2 }}>{state.explanation}</Text>
          ) : null}
          <Pressable onPress={onContinue} style={{ marginTop: 12, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: ok ? SKY.green : SKY.red, borderBottomWidth: 4, borderBottomColor: ok ? SKY.greenDark : '#B4232A' }}>
            <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#FFFFFF' }}>
              {isLast ? t('lesson.feedback.finish') : t('lesson.feedback.next')}
            </Text>
          </Pressable>
        </View>
      );
    }
    const off = !canSubmit || state.kind === 'submitting';
    return (
      <Pressable onPress={onSubmit} disabled={off} style={{ height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: off ? '#E3E8EC' : SKY.blue, borderBottomWidth: 4, borderBottomColor: off ? '#CDD4D9' : SKY.blueDark }}>
        <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: off ? '#8A949B' : '#FFFFFF' }}>
          {submitLabel ?? t('lesson.feedback.check')}
        </Text>
      </Pressable>
    );
  }
  if (state.kind === 'correct' || state.kind === 'wrong') {
    const correct = state.kind === 'correct';
    return (
      <View
        className={`rounded-2xl border-2 p-4 ${
          correct
            ? 'border-emerald-500 bg-emerald-500/15'
            : 'border-red-500 bg-red-500/10'
        }`}
      >
        <View className="flex-row items-start gap-3 mb-3">
          {correct ? (
            <CheckCircle2 size={24} color="#10b981" />
          ) : (
            <XCircle size={24} color="#ef4444" />
          )}
          <View className="flex-1">
            <Text className="font-black text-foreground text-base">
              {correct ? t('lesson.feedback.correct') : t('lesson.feedback.incorrect')}
            </Text>
            {!correct && state.correctText && (
              <Text className="text-sm font-bold text-foreground mt-1">
                {t('lesson.feedback.correct_answer')} {state.correctText}
              </Text>
            )}
            {state.explanation && (
              <Text className="text-xs text-muted-foreground font-medium mt-1">
                {state.explanation}
              </Text>
            )}
          </View>
        </View>
        <Pressable
          onPress={onContinue}
          className="bg-[#FFDF5E] rounded-2xl py-3 items-center"
        >
          <Text className="text-[#3D0A1A] font-black uppercase">
            {isLast ? t('lesson.feedback.finish') : `${t('lesson.feedback.next')} →`}
          </Text>
        </Pressable>
      </View>
    );
  }

  const disabled = !canSubmit || state.kind === 'submitting';
  return (
    <Pressable
      onPress={onSubmit}
      disabled={disabled}
      className={`rounded-2xl py-4 items-center ${
        disabled ? 'bg-[rgba(255,255,255,0.12)]' : 'bg-[#FFDF5E]'
      }`}
    >
      <Text
        className={`font-black uppercase ${
          disabled ? 'text-[rgba(255,255,255,0.6)]' : 'text-[#3D0A1A]'
        }`}
      >
        {submitLabel ?? t('lesson.feedback.check')}
      </Text>
    </Pressable>
  );
}
