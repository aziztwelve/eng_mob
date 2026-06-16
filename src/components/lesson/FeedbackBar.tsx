import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle } from 'lucide-react-native';

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
}

export function FeedbackBar({
  state,
  canSubmit,
  onSubmit,
  onContinue,
  isLast,
  submitLabel,
}: FeedbackBarProps) {
  const { t } = useTranslation();
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
