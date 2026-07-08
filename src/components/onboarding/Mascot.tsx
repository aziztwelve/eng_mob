import React from 'react';
import { Image, Text, View, type ImageSourcePropType } from 'react-native';
import { SvgXml } from 'react-native-svg';

import {
  MASCOT_EMOJI,
  MASCOT_PNG,
  MASCOT_SVG,
  hasMascotPng,
  type MascotPose,
} from '@/lib/mascot-manifest';

/**
 * <Mascot> — рендерит брендового маскота в одной из 4 поз.
 *
 * Стратегия (см. mascot-manifest.ts):
 *   1. Если зарегистрирован финальный PNG — рендерим <Image>.
 *   2. Иначе — inline SVG-плейсхолдер через <SvgXml>.
 *   3. Последний fallback — emoji в Text.
 *
 * Контракт:
 *   - `size` задаёт квадратный bounding-box (default 160).
 *   - `pose` определяет позу; по умолчанию 'idle'.
 *
 * Используется во всех reaction-интерстициалах и trust-экранах онбординга
 * v3 (см. docs/tasks/mob/onboarding-v3-oki-style.md §3.2, §3.6).
 */
export interface MascotProps {
  pose?: MascotPose;
  size?: number;
  /** Дополнительный NativeWind className на контейнер (margin/align). */
  className?: string;
}

export function Mascot({ pose = 'idle', size = 160, className }: MascotProps) {
  if (hasMascotPng(pose)) {
    return (
      <View className={className} style={{ width: size, height: size }}>
        <Image
          source={MASCOT_PNG[pose] as ImageSourcePropType}
          style={{ width: size, height: size }}
          resizeMode="contain"
          accessibilityLabel={`LingoIQ mascot — ${pose}`}
        />
      </View>
    );
  }

  // Try SVG; SvgXml на некоторых старых runtime'ах может бросить — оборачиваем.
  const xml = MASCOT_SVG[pose];
  if (xml) {
    try {
      return (
        <View className={className} style={{ width: size, height: size }}>
          <SvgXml xml={xml} width="100%" height="100%" />
        </View>
      );
    } catch {
      // fallthrough to emoji
    }
  }

  return (
    <View
      className={className}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontSize: size * 0.6 }} accessibilityLabel={`LingoIQ mascot — ${pose}`}>
        {MASCOT_EMOJI[pose]}
      </Text>
    </View>
  );
}
