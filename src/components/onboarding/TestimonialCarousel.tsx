import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Dimensions } from 'react-native';
import { Star } from 'lucide-react-native';

import {
  testimonialsForGoal,
  localizedQuote,
  localizedBadge,
  type TestimonialGoal,
  type Testimonial,
} from '@/lib/testimonials';
import type { UiLanguage } from '@/lib/supported-languages';

/**
 * <TestimonialCarousel> — auto-playing carousel с прогресс-индикатором.
 *
 * - 4 testimonials отбирает `testimonialsForGoal(goal, 4)`.
 * - Auto-advance каждые 4.5 сек (paused если `paused`).
 * - Pagination dots внизу.
 *
 * Используется в `app/onboarding/building.tsx`.
 */

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ADVANCE_MS = 4500;

export interface TestimonialCarouselProps {
  goal: TestimonialGoal | null;
  uiLang?: UiLanguage;
}

export function TestimonialCarousel({
  goal,
  uiLang = 'ru',
}: TestimonialCarouselProps) {
  const items: Testimonial[] = testimonialsForGoal(goal, 4);
  const [index, setIndex] = useState(0);
  const flatRef = useRef<FlatList<Testimonial>>(null);

  // Внутренний padding от сторон ScrollView спека — 20. Карточка занимает
  // ширину SCREEN_WIDTH - 40 (см. paddingHorizontal в OnboardingShell).
  const cardWidth = SCREEN_WIDTH - 40;

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => {
      setIndex((cur) => {
        const next = (cur + 1) % items.length;
        flatRef.current?.scrollToOffset({
          offset: next * cardWidth,
          animated: true,
        });
        return next;
      });
    }, ADVANCE_MS);
    return () => clearInterval(t);
  }, [items.length, cardWidth]);

  if (items.length === 0) return null;

  return (
    <View className="gap-3">
      <FlatList
        ref={flatRef}
        data={items}
        keyExtractor={(t) => t.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
          setIndex(i);
        }}
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <TestimonialCard item={item} uiLang={uiLang} />
          </View>
        )}
      />

      {/* Dots */}
      <View className="flex-row items-center justify-center gap-2">
        {items.map((_, i) => (
          <View
            key={i}
            className={`h-2 rounded-full ${
              i === index ? 'bg-primary w-6' : 'bg-muted w-2'
            }`}
          />
        ))}
      </View>
    </View>
  );
}

interface TestimonialCardProps {
  item: Testimonial;
  uiLang: UiLanguage;
}

function TestimonialCard({ item, uiLang }: TestimonialCardProps) {
  const quote = localizedQuote(item, uiLang);
  const badge = localizedBadge(item, uiLang);

  return (
    <View className="bg-card border-2 border-border rounded-2xl p-4 gap-3 mx-1">
      <View className="flex-row items-center gap-3">
        <View className="w-12 h-12 rounded-full bg-muted items-center justify-center">
          <Text className="text-2xl">{item.avatarEmoji}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-black text-base">
            {item.name}, {item.age}
          </Text>
          <Text className="text-primary font-bold text-xs">
            {badge}
          </Text>
        </View>
        <View className="flex-row gap-0.5">
          {Array.from({ length: item.stars }).map((_, i) => (
            <Star key={i} size={14} color="#facc15" fill="#facc15" />
          ))}
        </View>
      </View>
      <Text className="text-foreground font-medium text-sm leading-relaxed">
        «{quote}»
      </Text>
    </View>
  );
}
