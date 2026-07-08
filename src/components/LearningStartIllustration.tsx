import React from 'react';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

type Props = {
  width?: number;
  height?: number;
};

export function LearningStartIllustration({ width = 150, height = 150 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 180 180" accessibilityLabel="Learning start illustration">
      <Defs>
        <SvgLinearGradient id="learnBg" x1="20" y1="20" x2="160" y2="160" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFE76A" />
          <Stop offset="0.52" stopColor="#FF9A4D" />
          <Stop offset="1" stopColor="#B72D5C" />
        </SvgLinearGradient>
        <SvgLinearGradient id="cardA" x1="44" y1="42" x2="132" y2="135" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#FFE8D7" />
        </SvgLinearGradient>
        <SvgLinearGradient id="cardB" x1="70" y1="34" x2="145" y2="116" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#E7FFF6" />
          <Stop offset="1" stopColor="#8CEEDB" />
        </SvgLinearGradient>
      </Defs>

      <Circle cx="90" cy="90" r="78" fill="url(#learnBg)" opacity="0.18" />
      <Circle cx="132" cy="45" r="15" fill="#FFE76A" opacity="0.75" />
      <Circle cx="39" cy="132" r="11" fill="#8CEEDB" opacity="0.75" />

      <G rotation="-9" origin="74 92">
        <Rect x="36" y="45" width="78" height="104" rx="17" fill="#2B1422" opacity="0.16" />
        <Rect x="32" y="40" width="78" height="104" rx="17" fill="url(#cardA)" />
        <Path d="M50 67h42M50 84h31M50 101h42" stroke="#B72D5C" strokeWidth="7" strokeLinecap="round" />
        <Circle cx="55" cy="124" r="10" fill="#FFB338" />
        <Path d="M71 125h24" stroke="#2B1422" strokeWidth="7" strokeLinecap="round" opacity="0.78" />
      </G>

      <G rotation="8" origin="114 83">
        <Rect x="77" y="34" width="74" height="94" rx="18" fill="#2B1422" opacity="0.14" />
        <Rect x="72" y="29" width="74" height="94" rx="18" fill="url(#cardB)" />
        <Path d="M94 57h31M94 74h22" stroke="#007D86" strokeWidth="7" strokeLinecap="round" />
        <Path d="M106 91l10 10 22-28" stroke="#0E7F5D" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </G>

      <Path
        d="M55 151c26-15 47-14 72 0"
        stroke="#FFFFFF"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.88"
      />
      <Path
        d="M132 139l12 11-16 5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.88"
      />
    </Svg>
  );
}
