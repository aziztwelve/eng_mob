/**
 * Line icon set (Lucide-style paths, 24×24, stroke-based).
 * Единый визуальный язык для Vocabulary Bank и смежных экранов:
 * тонкая линия 1.9, скруглённые концы, цвет через props.color.
 */
import Svg, { Circle, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import type { ReactNode } from 'react';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

function Base({ size = 20, color = '#fff', strokeWidth = 1.9, children }: IconProps & { children: ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </Svg>
  );
}

export function IconSearch(p: IconProps) {
  return <Base {...p}><Circle cx={11} cy={11} r={7} /><Line x1={21} y1={21} x2={16.3} y2={16.3} /></Base>;
}

export function IconX(p: IconProps) {
  return <Base {...p}><Line x1={18} y1={6} x2={6} y2={18} /><Line x1={6} y1={6} x2={18} y2={18} /></Base>;
}

export function IconBookOpen(p: IconProps) {
  return <Base {...p}><Path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" /><Path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" /></Base>;
}

export function IconPlay(p: IconProps) {
  return (
    <Svg width={p.size ?? 20} height={p.size ?? 20} viewBox="0 0 24 24" fill={p.color ?? '#fff'} stroke="none">
      <Polygon points="6,4 20,12 6,20" />
    </Svg>
  );
}

export function IconCheck(p: IconProps) {
  return <Base {...p} strokeWidth={p.strokeWidth ?? 2.4}><Polyline points="20,6 9,17 4,12" /></Base>;
}

export function IconChevronRight(p: IconProps) {
  return <Base {...p}><Polyline points="9,18 15,12 9,6" /></Base>;
}

export function IconVolume(p: IconProps) {
  return (
    <Base {...p}>
      <Polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill={p.color ?? '#fff'} stroke="none" />
      <Path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <Path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </Base>
  );
}

export function IconSparkles(p: IconProps) {
  return (
    <Base {...p}>
      <Path d="M12 3l1.7 4.6L18.3 9.3 13.7 11 12 15.6 10.3 11 5.7 9.3l4.6-1.7z" />
      <Path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
    </Base>
  );
}

export function IconMic(p: IconProps) {
  return (
    <Base {...p}>
      <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <Line x1={12} y1={19} x2={12} y2={22} />
    </Base>
  );
}

export function IconLayers(p: IconProps) {
  return <Base {...p}><Polygon points="12,2 2,7 12,12 22,7" /><Polyline points="2,17 12,22 22,17" /><Polyline points="2,12 12,17 22,12" /></Base>;
}

export function IconPencil(p: IconProps) {
  return <Base {...p}><Path d="M12 20h9" /><Path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></Base>;
}

export function IconLink(p: IconProps) {
  return <Base {...p}><Path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><Path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></Base>;
}

export function IconMessage(p: IconProps) {
  return <Base {...p}><Path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></Base>;
}

export function IconImage(p: IconProps) {
  return <Base {...p}><Rect x={3} y={3} width={18} height={18} rx={3} /><Circle cx={8.5} cy={8.5} r={1.5} /><Polyline points="21,15 16,10 5,21" /></Base>;
}

export function IconHeadphones(p: IconProps) {
  return (
    <Base {...p}>
      <Path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
      <Path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </Base>
  );
}

export function IconEye(p: IconProps) {
  return <Base {...p}><Path d="M1 12s4-7.5 11-7.5S23 12 23 12s-4 7.5-11 7.5S1 12 1 12z" /><Circle cx={12} cy={12} r={3} /></Base>;
}

export function IconRefresh(p: IconProps) {
  return (
    <Base {...p}>
      <Path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
      <Path d="M21 3v5h-5" />
      <Path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
      <Path d="M3 21v-5h5" />
    </Base>
  );
}

export function IconTrophy(p: IconProps) {
  return (
    <Base {...p}>
      <Path d="M6 3h12v6a6 6 0 0 1-12 0z" />
      <Path d="M6 5H4a2 2 0 0 0 0 4h2" />
      <Path d="M18 5h2a2 2 0 0 1 0 4h-2" />
      <Path d="M12 15v3" />
      <Path d="M8 21h8" />
      <Path d="M8 21c0-2 1.5-3 4-3s4 1 4 3" />
    </Base>
  );
}

export function IconArrowRight(p: IconProps) {
  return <Base {...p}><Line x1={4} y1={12} x2={20} y2={12} /><Polyline points="13,5 20,12 13,19" /></Base>;
}

export function IconFlame(p: IconProps) {
  return (
    <Base {...p}>
      <Path d="M12 2c1 3-2 4.5-2 7a2 2 0 0 0 4 .5C15.5 11 17 12.6 17 15a5 5 0 0 1-10 0c0-2 1-3.4 2-4.5" />
      <Path d="M12 22a5 5 0 0 0 5-5" />
    </Base>
  );
}

export function IconHeart(p: IconProps) {
  return (
    <Base {...p}>
      <Path d="M12 21s-7.5-4.6-9.5-9A5.4 5.4 0 0 1 12 6.4 5.4 5.4 0 0 1 21.5 12c-2 4.4-9.5 9-9.5 9z" />
    </Base>
  );
}

export function IconGem(p: IconProps) {
  return (
    <Base {...p}>
      <Path d="M7 3h10l4 6-9 12L3 9z" />
      <Path d="M3 9h18" />
      <Path d="M7 3l5 6 5-6" />
      <Path d="M12 21l-5-12" />
      <Path d="M12 21l5-12" />
    </Base>
  );
}

export function IconGraduation(p: IconProps) {
  return (
    <Base {...p}>
      <Polygon points="12,4 22,9 12,14 2,9" />
      <Path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
    </Base>
  );
}
