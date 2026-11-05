import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { FREE_TALK_AVATARS } from '@/components/ai/avatar-picker';
import type { TalkPhase } from '@/hooks/use-free-talk';
import { avatarExpression, type AvatarExpression } from '@/lib/avatar-expression';

// Positions correspond to each original image, including its transparent padding.
const MOUTH_Y = [0.405, 0.426, 0.421, 0.427, 0.463, 0.381, 0.409, 0.380, 0.345, 0.419];

export function TalkingAvatar({ id, expanded, phase, text, speaking, label, emotion }: {
  id: number; expanded: boolean; phase: TalkPhase; text: string; speaking: boolean; label: string; emotion?: AvatarExpression | null;
}) {
  const mouth = useRef(new Animated.Value(0)).current;
  const expression = phase === 'thinking' ? 'thinking' : emotion ?? avatarExpression(text, phase);
  const [box, setBox] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!speaking) { mouth.stopAnimation(); mouth.setValue(0); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(mouth, { toValue: 1, duration: 155, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(mouth, { toValue: 0.15, duration: 155, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    animation.start();
    return () => { animation.stop(); mouth.setValue(0); };
  }, [mouth, speaking]);
  const source = FREE_TALK_AVATARS[id - 1] ?? FREE_TALK_AVATARS[0];
  const size = Image.resolveAssetSource(source);
  const boxWidth = box.width;
  const boxHeight = box.height;
  const imageWidth = Math.min(boxWidth, boxHeight * size.width / size.height);
  const imageHeight = imageWidth * size.height / size.width;
  const width = imageWidth * 0.17;
  const height = imageHeight * 0.044;
  const top = (boxHeight - imageHeight) / 2 + imageHeight * MOUTH_Y[id - 1] - height / 2;
  return <View className={expanded ? 'h-56 w-64' : 'h-36 w-48'} onLayout={event => { const { width, height } = event.nativeEvent.layout; setBox(current => current.width === width && current.height === height ? current : { width, height }); }} accessible accessibilityLabel={label}>
    <Image source={source} resizeMode="contain" className="h-full w-full" />
    {boxWidth > 0 && (speaking || expression !== 'neutral') && <View pointerEvents="none" style={{ position: 'absolute', left: (boxWidth - width) / 2, top, width, height }}>
      <Svg width="100%" height="100%" viewBox="0 0 100 40">
        <Ellipse cx="50" cy="20" rx="49" ry="20" fill="#101c29" />
        {!speaking && (expression === 'happy'
          ? <Path d="M 12 17 Q 50 43 88 17" fill="none" stroke="#27dcff" strokeWidth="7" strokeLinecap="round" />
          : <Path d="M 34 21 Q 50 15 66 21" fill="none" stroke="#27dcff" strokeWidth="6" strokeLinecap="round" />)}
      </Svg>
      {speaking && <Animated.View style={{ position: 'absolute', left: '25%', top: '22%', width: '50%', height: '56%', borderRadius: 50, borderWidth: 2, borderColor: '#27dcff', backgroundColor: '#07506b', transform: [{ scaleY: mouth.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) }] }} />}
    </View>}
  </View>;
}
