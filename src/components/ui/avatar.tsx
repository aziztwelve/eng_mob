import React from 'react';
import { Image, Text, View } from 'react-native';

/**
 * Маленький Avatar-атом: круг с фото из URL либо инициалы на цветном фоне.
 * Используется в leagues / friends. NativeWind-стили.
 *
 * Web-аналог — `components/ui/avatar` (shadcn). Здесь без Radix.
 */
export function Avatar({
  uri,
  name,
  size = 40,
  borderClassName = 'border-2 border-border',
}: {
  uri?: string | null;
  /** Источник для инициалов (full_name / username / fallback). */
  name?: string;
  size?: number;
  borderClassName?: string;
}) {
  const initials = computeInitials(name);
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={`items-center justify-center bg-muted overflow-hidden ${borderClassName}`}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      ) : (
        <Text
          className="text-foreground font-black"
          style={{ fontSize: Math.max(12, Math.round(size * 0.4)) }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

function computeInitials(name?: string) {
  if (!name) return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}
