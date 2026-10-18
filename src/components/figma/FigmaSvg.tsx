import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useEffect, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { startupSvg } from '@/lib/startup-svg.generated';

const xmlCache = new Map<number, string>();
const pending = new Map<number, Promise<string>>();

function loadSvg(source: number): Promise<string> {
  const cached = startupSvg[source] ?? xmlCache.get(source);
  if (cached) return Promise.resolve(cached);
  const existing = pending.get(source);
  if (existing) return existing;
  const request = (async () => {
    const asset = Asset.fromModule(source);
    await asset.downloadAsync();
    const xml = await FileSystem.readAsStringAsync(asset.localUri ?? asset.uri);
    xmlCache.set(source, xml);
    return xml;
  })().finally(() => pending.delete(source));
  pending.set(source, request);
  return request;
}

type FigmaSvgProps = {
  source: number;
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Renders an SVG exported from Figma without adding an SVG transformer.
 * Startup SVGs are bundled as XML so the first screen needs no file reads or
 * asset downloads. Other SVGs share a cache and any in-flight file request.
 */
export function FigmaSvg({ source, width, height, style }: FigmaSvgProps) {
  const [loaded, setLoaded] = useState<{ source: number; xml: string } | null>(null);
  const xml = startupSvg[source] ?? xmlCache.get(source) ?? (loaded?.source === source ? loaded.xml : null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const content = await loadSvg(source);
        if (mounted) setLoaded({ source, xml: content });
      } catch (error) {
        if (__DEV__) console.warn('[figma-svg] unable to load asset', error);
      }
    };
    if (!startupSvg[source] && !xmlCache.has(source)) void load();
    return () => {
      mounted = false;
    };
  }, [source]);

  if (!xml) {
    return <View style={[{ width, height }, style]} />;
  }

  return <SvgXml xml={xml} width={width} height={height} style={style} />;
}
