import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'phosphor-react-native';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { SKY } from './sky-lesson-header';
import { SkyStepLayout } from './sky-ui';
import { parseStepContent, type StepComponentProps } from './step-types';
import type { MatchPairsContent } from '@/types/api';

/**
 * Match Pairs: две колонки, перемешанные. Tap → tap → проверка локально.
 * Все собраны → submit. Оформление: Game Play (Figma 246:15988), вариант «Маскот».
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

  const renderCell = (idx: number, side: 'L' | 'R', text: string) => {
    const isMatched = matched.includes(idx);
    const isSelected = side === 'L' ? selectedL === idx : selectedR === idx;
    const isWrong = wrongFlash && isSelected;

    let bg = '#FFFFFF';
    let border = '#DDE3E8';
    let shadow = '#D3DAE0';
    let dot = '#EEF2F5';
    if (isSelected) { bg = '#EAF8FF'; border = SKY.blue; shadow = SKY.blue; dot = SKY.blue; }
    if (isWrong) { bg = '#FFECEC'; border = SKY.red; shadow = SKY.red; dot = SKY.red; }
    if (isMatched) { bg = '#E9FBEF'; border = SKY.green; shadow = SKY.green; dot = SKY.green; }

    return (
      <Pressable
        key={`${side}-${idx}`}
        disabled={isMatched || state.kind !== 'idle'}
        onPress={() => (side === 'L' ? setSelectedL(idx) : setSelectedR(idx))}
        style={{
          minHeight: 48,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 6,
          paddingLeft: 8,
          paddingRight: 10,
          borderRadius: 14,
          backgroundColor: bg,
          borderWidth: 1.5,
          borderColor: border,
          borderBottomWidth: 4,
          borderBottomColor: shadow,
          opacity: isMatched ? 0.7 : 1,
        }}
      >
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: dot, alignItems: 'center', justifyContent: 'center' }}>
          {isMatched ? <Check size={12} weight="bold" color="#FFFFFF" /> : isWrong ? <X size={12} weight="bold" color="#FFFFFF" /> : null}
        </View>
        <Text style={{ flex: 1, fontFamily: 'Nunito_800ExtraBold', fontSize: 14, lineHeight: 17, color: SKY.ink }}>{text}</Text>
      </Pressable>
    );
  };

  const colLabel = { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, letterSpacing: 0.9, textTransform: 'uppercase', color: SKY.blueDark, paddingHorizontal: 4 } as const;

  return (
    <SkyStepLayout
      footer={
        <FeedbackBar
          variant="sky"
          state={state}
          canSubmit={allMatched}
          onSubmit={handleSubmit}
          onContinue={onContinue}
          isLast={isLast}
          submitLabel={t('lesson.feedback.done')}
        />
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
        {pairs.map((_, i) => (
          <View
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: i < matched.length ? SKY.green : '#FFFFFF',
              borderWidth: 1.5,
              borderColor: i < matched.length ? SKY.green : '#B9DDF0',
            }}
          />
        ))}
        <Text style={{ marginLeft: 6, fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: SKY.muted }}>
          {matched.length}/{pairs.length}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 14, marginBottom: 20 }}>
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={colLabel}>{t('lesson.match_words')}</Text>
          {pairs.map((p, i) => renderCell(i, 'L', p.left))}
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={colLabel}>{t('lesson.match_translations')}</Text>
          {rightOrder.map((i) => renderCell(i, 'R', pairs[i].right))}
        </View>
      </View>
    </SkyStepLayout>
  );
}
