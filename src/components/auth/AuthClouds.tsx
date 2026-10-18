import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FigmaSvg } from '@/components/figma/FigmaSvg';

// Cloud decorations shared by the auth screens (Figma frames 364:14962 / 366:15264).
const cloudLeftTop = require('../../../assets/figma/mieo-login/118-364-14963-svg.svg');
const cloudRightTop = require('../../../assets/figma/mieo-login/120-364-14970-svg.svg');
const cloudLeftMid = require('../../../assets/figma/mieo-login/122-364-14977-svg.svg');
const cloudRightMid = require('../../../assets/figma/mieo-login/124-364-14985-svg.svg');
const cloudTop = require('../../../assets/figma/mieo-login/126-364-14992-svg.svg');
const cloudBottomRight = require('../../../assets/figma/mieo-login/128-364-14999-svg.svg');

export function AuthClouds() {
  // Absolute positions come from the Figma frame, so they stay inline.
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <FigmaSvg source={cloudLeftTop} width={200.4} height={96.5} style={styles.cloudLeftTop} />
      <FigmaSvg source={cloudRightTop} width={200.4} height={96.5} style={styles.cloudRightTop} />
      <FigmaSvg source={cloudLeftMid} width={205.8} height={72.3} style={styles.cloudLeftMid} />
      <FigmaSvg source={cloudRightMid} width={172.7} height={53.3} style={styles.cloudRightMid} />
      <FigmaSvg source={cloudTop} width={143.9} height={54.8} style={styles.cloudTop} />
      <FigmaSvg source={cloudBottomRight} width={143.9} height={54.8} style={styles.cloudBottomRight} />
    </View>
  );
}

const styles = StyleSheet.create({
  cloudLeftTop: { position: 'absolute', left: -85, top: -113 },
  cloudRightTop: { position: 'absolute', left: 155, top: -23 },
  cloudLeftMid: { position: 'absolute', left: -73, top: 21 },
  cloudRightMid: { position: 'absolute', left: 287, top: -85 },
  cloudTop: { position: 'absolute', left: 161, top: -140 },
  cloudBottomRight: { position: 'absolute', left: 281, top: 110 },
});
