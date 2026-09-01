import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

interface GoalRingProps {
  /** Сколько карточек уже повторено сегодня. */
  completed: number;
  /** Всего запланировано на сегодня (completed + осталось). */
  total: number;
  size?: number;
  stroke?: number;
  /** Цвет дуги прогресса. */
  color?: string;
}

/**
 * Круговой индикатор дневной цели «X из N» для хаба флешкарт.
 * Дуга стартует сверху (контейнер повёрнут на -90°), центр — счётчик.
 */
export function GoalRing({
  completed,
  total,
  size = 104,
  stroke = 11,
  color = '#FFD84A',
}: GoalRingProps) {
  const { t } = useTranslation();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min(1, completed / total) : completed > 0 ? 1 : 0;
  const dash = circumference * pct;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
          />
        </Svg>
      </View>

      <Text style={{ color: '#fff', fontSize: 25, fontWeight: '900' }}>
        {completed}
        <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>/{total}</Text>
      </Text>
      <Text
        style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 1,
          marginTop: 1,
        }}
      >
        {t('cards.today')}
      </Text>
    </View>
  );
}
