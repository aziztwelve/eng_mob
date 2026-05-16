import React, { useCallback, useRef } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  measure,
  runOnJS,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/**
 * Phase 2.5 — DnD word bank, общий для translate и tap_words.
 *
 * UX:
 *  - Tap по слову банка → добавить в answer area (append).
 *  - Tap по слову в answer area → вернуть в банк.
 *  - Long-drag (>8px) из банка в answer → вставить по позиции drop'а.
 *  - Long-drag из answer в банк → убрать.
 *  - Long-drag внутри answer → reorder с insertion-index по позиции.
 *
 * Реализация:
 *  - Каждое слово — `Gesture.Race(Tap, Pan)` с минимальной дистанцией 8px,
 *    чтобы быстрый тап всегда работал.
 *  - Во время drag меняем только SharedValues (transform), не React-state —
 *    другие слова не re-flow'ятся, drop позиция стабильна.
 *  - Hit-test зон через `measure()` AnimatedRef'ов в worklet.
 *  - Insert-at-index считаем по `onLayout` детей answer area (relative).
 */

type Zone = 'bank' | 'answer';

interface DraggableWordBankProps {
  bank: string[];
  picked: number[];
  onChange: (next: number[]) => void;
  disabled?: boolean;
  emptyHint?: string;
}

export function DraggableWordBank({
  bank,
  picked,
  onChange,
  disabled = false,
  emptyHint = 'Нажми или перетащи слова сюда',
}: DraggableWordBankProps) {
  const answerRef = useAnimatedRef<Animated.View>();
  const bankRef = useAnimatedRef<Animated.View>();

  // Layout-rects детей answer area (relative к answer area), bank-index → rect.
  // Используется для определения insertion-index при drop'е в answer.
  const answerLayouts = useRef<Map<number, Rect>>(new Map());

  const setAnswerLayout = useCallback((bankIndex: number, rect: Rect | null) => {
    if (rect) answerLayouts.current.set(bankIndex, rect);
    else answerLayouts.current.delete(bankIndex);
  }, []);

  const handleDrop = useCallback(
    (bankIndex: number, from: Zone, zone: Zone | null, relX: number, relY: number) => {
      if (!zone) return;

      // bank → answer: insert at target index
      if (from === 'bank' && zone === 'answer') {
        if (picked.includes(bankIndex)) return;
        const targetIdx = computeInsertIndex(picked, answerLayouts.current, relX, relY);
        const next = [...picked];
        next.splice(targetIdx, 0, bankIndex);
        onChange(next);
        return;
      }

      // answer → bank: remove
      if (from === 'answer' && zone === 'bank') {
        onChange(picked.filter((i) => i !== bankIndex));
        return;
      }

      // answer → answer: reorder
      if (from === 'answer' && zone === 'answer') {
        const without = picked.filter((i) => i !== bankIndex);
        const targetIdx = computeInsertIndex(without, answerLayouts.current, relX, relY);
        const next = [...without];
        next.splice(targetIdx, 0, bankIndex);
        // skip no-op moves
        if (arraysEqual(next, picked)) return;
        onChange(next);
        return;
      }
      // bank → bank: no-op
    },
    [picked, onChange],
  );

  const handleTap = useCallback(
    (bankIndex: number, from: Zone) => {
      if (from === 'bank') {
        if (!picked.includes(bankIndex)) onChange([...picked, bankIndex]);
      } else {
        onChange(picked.filter((i) => i !== bankIndex));
      }
    },
    [picked, onChange],
  );

  const available = bank.map((_, i) => i).filter((i) => !picked.includes(i));

  return (
    <View>
      {/* Answer area (top) */}
      <Animated.View
        ref={answerRef}
        className="min-h-[80px] rounded-2xl border-2 border-dashed border-border bg-muted/20 p-3 mb-4 flex-row flex-wrap gap-2"
      >
        {picked.length === 0 ? (
          <Text className="text-muted-foreground text-sm font-medium m-auto">
            {emptyHint}
          </Text>
        ) : (
          picked.map((bankIndex) => (
            <DraggableWord
              key={`a-${bankIndex}`}
              label={bank[bankIndex]}
              from="answer"
              answerRef={answerRef}
              bankRef={bankRef}
              disabled={disabled}
              onTap={() => handleTap(bankIndex, 'answer')}
              onDrop={(zone, relX, relY) =>
                handleDrop(bankIndex, 'answer', zone, relX, relY)
              }
              onAnswerLayout={(rect) => setAnswerLayout(bankIndex, rect)}
            />
          ))
        )}
      </Animated.View>

      {/* Bank (bottom) */}
      <Animated.View
        ref={bankRef}
        className="flex-row flex-wrap gap-2 mb-5"
      >
        {available.map((bankIndex) => (
          <DraggableWord
            key={`b-${bankIndex}`}
            label={bank[bankIndex]}
            from="bank"
            answerRef={answerRef}
            bankRef={bankRef}
            disabled={disabled}
            onTap={() => handleTap(bankIndex, 'bank')}
            onDrop={(zone, relX, relY) =>
              handleDrop(bankIndex, 'bank', zone, relX, relY)
            }
          />
        ))}
      </Animated.View>
    </View>
  );
}

// ---- DraggableWord -----------------------------------------------------

type AnimatedRefView = ReturnType<typeof useAnimatedRef<Animated.View>>;
type Rect = { x: number; y: number; w: number; h: number };

interface DraggableWordProps {
  label: string;
  from: Zone;
  answerRef: AnimatedRefView;
  bankRef: AnimatedRefView;
  disabled: boolean;
  onTap: () => void;
  onDrop: (zone: Zone | null, relX: number, relY: number) => void;
  /** Только для слов в answer area — родитель собирает layout-карту для insertion-index. */
  onAnswerLayout?: (rect: Rect) => void;
}

function DraggableWord({
  label,
  from,
  answerRef,
  bankRef,
  disabled,
  onTap,
  onDrop,
  onAnswerLayout,
}: DraggableWordProps) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const elev = useSharedValue(0);
  const dragging = useSharedValue(0); // 0 | 1, для z-index

  const handleLayout = (e: LayoutChangeEvent) => {
    if (!onAnswerLayout) return;
    const { x, y, width, height } = e.nativeEvent.layout;
    onAnswerLayout({ x, y, w: width, h: height });
  };

  const tap = Gesture.Tap()
    .enabled(!disabled)
    .maxDistance(8)
    .onEnd((_, success) => {
      if (success) runOnJS(onTap)();
    });

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(8)
    .onStart(() => {
      scale.value = withTiming(1.08, { duration: 100 });
      elev.value = 8;
      dragging.value = 1;
    })
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
    })
    .onEnd((e) => {
      const a = measure(answerRef);
      const b = measure(bankRef);
      let zone: Zone | null = null;
      let relX = 0;
      let relY = 0;
      if (
        a &&
        e.absoluteX >= a.pageX &&
        e.absoluteX <= a.pageX + a.width &&
        e.absoluteY >= a.pageY &&
        e.absoluteY <= a.pageY + a.height
      ) {
        zone = 'answer';
        relX = e.absoluteX - a.pageX;
        relY = e.absoluteY - a.pageY;
      } else if (
        b &&
        e.absoluteX >= b.pageX &&
        e.absoluteX <= b.pageX + b.width &&
        e.absoluteY >= b.pageY &&
        e.absoluteY <= b.pageY + b.height
      ) {
        zone = 'bank';
        relX = e.absoluteX - b.pageX;
        relY = e.absoluteY - b.pageY;
      }
      runOnJS(onDrop)(zone, relX, relY);
      tx.value = withSpring(0, { damping: 18, stiffness: 250 });
      ty.value = withSpring(0, { damping: 18, stiffness: 250 });
      scale.value = withTiming(1, { duration: 150 });
      elev.value = withTiming(0, { duration: 150 });
      dragging.value = 0;
    });

  const composed = Gesture.Race(tap, pan);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
    elevation: elev.value,
    zIndex: dragging.value ? 100 : 1,
    shadowOpacity: dragging.value ? 0.25 : 0,
    shadowRadius: dragging.value ? 6 : 0,
    shadowOffset: { width: 0, height: 2 },
    shadowColor: '#000',
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        onLayout={handleLayout}
        style={style}
        className="px-3 py-2 rounded-xl border-2 bg-card"
      >
        <Text className="font-bold text-foreground">{label}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

// ---- helpers -----------------------------------------------------------

/**
 * Найти индекс вставки в picked-массиве по drop-позиции внутри answer area.
 * Считаем reading order: сначала по строкам (Y), затем по X.
 */
function computeInsertIndex(
  picked: number[],
  layouts: Map<number, Rect>,
  dropX: number,
  dropY: number,
): number {
  for (let i = 0; i < picked.length; i++) {
    const r = layouts.get(picked[i]);
    if (!r) continue;
    // Строка выше drop-точки — однозначно вставляем перед.
    if (dropY < r.y) return i;
    // Та же строка по Y, drop X левее центра — вставляем перед.
    const sameRow = dropY >= r.y && dropY <= r.y + r.h;
    const cx = r.x + r.w / 2;
    if (sameRow && dropX < cx) return i;
  }
  return picked.length;
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
