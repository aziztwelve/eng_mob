import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { parseStepContent, type StepComponentProps } from './step-types';
import type { MatchPairsContent } from '@/types/api';

/**
 * Match Pairs: две колонки, перемешанные. Tap → tap → проверка локально.
 * Все собраны → submit.
 */
export function MatchPairsStep({ step, onSubmit, onContinue, isLast }: StepComponentProps) {
  const { t } = useTranslation();
  const content = parseStepContent<MatchPairsContent>(step);
  const pairs = content?.pairs ?? [];

  // Стабильный порядок для правой колонки (seed = step.id).
  const rightOrder = useMemo(() => {
    const order = pairs.map((_, i) => i);
    let seed = 0;
    for (const ch of step.id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const rng = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }, [step.id, pairs.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const [selectedL, setSelectedL] = useState<number | null>(null);
  const [selectedR, setSelectedR] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  useEffect(() => {
    if (selectedL === null || selectedR === null) return;
    if (selectedL === selectedR) {
      setMatched((m) => [...m, selectedL]);
      setSelectedL(null);
      setSelectedR(null);
    } else {
      setWrongFlash(true);
      const t = setTimeout(() => {
        setSelectedL(null);
        setSelectedR(null);
        setWrongFlash(false);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [selectedL, selectedR]);

  if (!content) {
    return (
      <View className="p-6">
        <Text className="text-muted-foreground">{t('lesson.parse_error')}</Text>
      </View>
    );
  }

  const allMatched = matched.length === pairs.length && pairs.length > 0;

  const handleSubmit = async () => {
    setState({ kind: 'submitting' });
    try {
      const mapping: Record<string, string> = {};
      pairs.forEach((p) => {
        mapping[p.left] = p.right;
      });
      const resp = await onSubmit({ pairs: mapping });
      setState(
        resp.is_correct
          ? { kind: 'correct', explanation: resp.explanation }
          : { kind: 'wrong', explanation: resp.explanation },
      );
    } catch (e) {
      console.error(e);
      setState({ kind: 'idle' });
    }
  };

  const Cell = ({ idx, side, text }: { idx: number; side: 'L' | 'R'; text: string }) => {
    const isMatched = matched.includes(idx);
    const isSelected = side === 'L' ? selectedL === idx : selectedR === idx;
    const isWrong = wrongFlash && isSelected;
    return (
      <Pressable
        disabled={isMatched || state.kind !== 'idle'}
        onPress={() => (side === 'L' ? setSelectedL(idx) : setSelectedR(idx))}
        className={`rounded-2xl border-2 px-3 py-4 mb-2 items-center ${
          isMatched
            ? 'border-emerald-500 bg-emerald-500/15 opacity-60'
            : isWrong
              ? 'border-red-500 bg-red-500/10'
              : isSelected
                ? 'border-[#FFDF5E] bg-[rgba(255,223,94,0.18)]'
                : 'border-[rgba(255,255,255,0.22)] bg-[rgba(255,255,255,0.12)]'
        }`}
      >
        <Text className="font-bold text-foreground">{text}</Text>
      </Pressable>
    );
  };

  return (
    <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="pb-4">
      {content.instruction && (
        <Text className="text-foreground font-bold text-base mb-4">{t('lesson.instruction.match_pairs')}</Text>
      )}
      <View className="flex-row gap-3 mb-5">
        <View className="flex-1">
          {pairs.map((p, i) => (
            <Cell key={`l-${i}`} idx={i} side="L" text={p.left} />
          ))}
        </View>
        <View className="flex-1">
          {rightOrder.map((i) => (
            <Cell key={`r-${i}`} idx={i} side="R" text={pairs[i].right} />
          ))}
        </View>
      </View>

      <FeedbackBar
        state={state}
        canSubmit={allMatched}
        onSubmit={handleSubmit}
        onContinue={onContinue}
        isLast={isLast}
        submitLabel={t('lesson.feedback.done')}
      />
    </ScrollView>
  );
}
