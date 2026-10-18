import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { FigmaSvg } from '@/components/figma/FigmaSvg';

// Brand splash from Figma "Splash" (node 22:5). The illustration (sky, clouds, bear and plane)
// comes from assets/figma/home-map/splash-scene.svg, exported from the frame with the text,
// status bar and footer removed. The app name is LingoIQ instead of the design's "Mieo".
const DESIGN_W = 375;
const DESIGN_H = 812;
const FADE_MS = 180;
const splashScene = require('../../assets/figma/home-map/splash-scene.svg');

export function BrandSplash({ ready, fontsLoaded }: { ready: boolean; fontsLoaded: boolean }) {
  const [visible, setVisible] = useState(true);
  const opacity = React.useRef(new Animated.Value(1)).current;
  const { width } = useWindowDimensions();
  const S = Math.min(width, DESIGN_W) / DESIGN_W;

  useEffect(() => {
    if (!ready) return;
    // Let the ready application commit underneath before revealing it.
    let animationFrame: number;
    const firstFrame = requestAnimationFrame(() => {
      animationFrame = requestAnimationFrame(() => {
        Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true })
          .start(({ finished }) => { if (finished) setVisible(false); });
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(animationFrame);
      opacity.stopAnimation();
    };
  }, [ready, opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity }]} pointerEvents="none">
      <View style={{ width: DESIGN_W * S, height: DESIGN_H * S }}>
        <FigmaSvg source={splashScene} width={DESIGN_W * S} height={DESIGN_H * S} style={StyleSheet.absoluteFill} />
        {/* Title block at the design position (subtitle y 222, title y 238). */}
        <View style={{ position: 'absolute', left: 0, right: 0, top: 216 * S, alignItems: 'center' }}>
          <Text style={{ fontFamily: fontsLoaded ? 'Nunito_500Medium' : undefined, fontSize: 16 * S, letterSpacing: 0.5 * S, color: '#5D686F' }}>
            Learning with
          </Text>
          <Text style={{ fontFamily: fontsLoaded ? 'Nunito_900Black' : undefined, fontWeight: fontsLoaded ? undefined : '900', fontSize: 57 * S, letterSpacing: -0.25 * S, color: '#171A1C' }}>
            LingoIQ
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
});

export default BrandSplash;
