import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Defs, LinearGradient as SvgGradient, Stop, Circle } from 'react-native-svg';

/** Кольцо прогресса с золотым градиентом (как «Твой прогресс с AI»). */
export function ProgressRing({ pct, size = 66, stroke = 7 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  const cx = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFE16A" />
            <Stop offset="1" stopColor="#FF8A3D" />
          </SvgGradient>
        </Defs>
        <Circle cx={cx} cy={cx} r={r} stroke="rgba(255,255,255,0.16)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={cx}
          cy={cx}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </Svg>
      <Text style={s.ringText}>{pct}%</Text>
    </View>
  );
}

/** Мини-график активности: восходящая полилиния, масштабируется от pct. */
export function MiniChart({ pct }: { pct: number }) {
  const points = Array.from({ length: 6 }, (_, i) => {
    const x = 2 + i * 16;
    const y = 42 - (Math.max(0, Math.min(100, pct)) / 100) * 37 * (i / 5);
    return `${x},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <View style={s.chartWrap}>
      <Svg width={84} height={46}>
        <Polyline
          points={points}
          fill="none"
          stroke="#FFD84A"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text style={s.chartStar}>⭐</Text>
    </View>
  );
}

const s = StyleSheet.create({
  ringText: { position: 'absolute', color: '#fff', fontSize: 16, fontWeight: '900' },
  chartWrap: { width: 84, height: 46, justifyContent: 'center' },
  chartStar: { position: 'absolute', right: -2, top: -6, fontSize: 14 },
});
