import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { ArrowCounterClockwise, Check, CaretRight, Clock, Lock, Play, type Icon as PhosphorIcon } from 'phosphor-react-native';

// "Explore Levels" layout (Figma node 408:10297, tracks.svg): a blue rail on the left with a dot
// per card, then the card: header row (icon, title, subtitle, arrow/lock) and a cover image.

export type RailState = 'done' | 'current' | 'locked';

const RAIL_W = 26;
const COVER_H = 188;

export function LevelCard({
  isFirst,
  isLast,
  state,
  Icon,
  tint,
  title,
  subtitle,
  cover,
  doneLabel,
  onPress,
}: {
  isFirst: boolean;
  isLast: boolean;
  state: RailState;
  Icon: PhosphorIcon;
  tint: string;
  title: string;
  subtitle: string;
  cover?: number;
  /** Localized "completed" label shown for a finished lesson. */
  doneLabel?: string;
  onPress?: () => void;
}) {
  const locked = state === 'locked';
  const done = state === 'done';
  const railColor = locked ? '#C9EDFF' : '#1AB3FF';
  return (
    <View style={{ flexDirection: 'row', marginBottom: 18 }}>
      {/* Rail: line behind the dots, dot at the card header. */}
      <View style={{ width: RAIL_W, alignItems: 'center' }}>
        <View
          style={{
            position: 'absolute',
            top: isFirst ? 14 : 0,
            bottom: isLast ? undefined : 0,
            height: isLast ? 14 : undefined,
            width: 4,
            borderRadius: 2,
            backgroundColor: railColor,
          }}
        />
        {done ? (
          <View style={{ marginTop: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: '#34C759', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={14} weight="bold" color="#FFFFFF" />
          </View>
        ) : (
          <View
            style={{
              marginTop: 14,
              width: locked ? 8 : 14,
              height: locked ? 8 : 14,
              borderRadius: 7,
              backgroundColor: '#FFFFFF',
              borderWidth: locked ? 0 : 3,
              borderColor: '#1AB3FF',
            }}
          />
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: locked }}
        disabled={locked || !onPress}
        onPress={onPress}
        style={{ flex: 1, marginLeft: 8, gap: 12, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 12, borderWidth: 1.5, borderColor: done ? '#BDEFCB' : '#C9EDFF' }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: tint,
            }}
          >
            <Icon size={22} color="#FFFFFF" weight="fill" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', fontSize: 16, color: '#171A1C' }} numberOfLines={1}>
              {title}
            </Text>
            <Text style={{ fontWeight: done ? '700' : '500', fontSize: 14, color: done ? '#1E7A3A' : locked ? '#5D686F' : '#1AB3FF' }} numberOfLines={1}>
              {done && doneLabel ? doneLabel : subtitle}
            </Text>
          </View>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: done ? '#E9FBEF' : locked ? '#E3E6E8' : '#DFF4FF',
            }}
          >
            {done ? <Check size={18} weight="bold" color="#34C759" /> : locked ? <Lock size={18} color="#5D686F" /> : <CaretRight size={18} color="#1AB3FF" />}
          </View>
        </View>

        {cover ? (
          <Image source={cover} style={{ width: '100%', height: COVER_H, borderRadius: 16 }} resizeMode="cover" />
        ) : (
          <View style={{ width: '100%', height: COVER_H, borderRadius: 16, backgroundColor: tint, opacity: 0.35 }} />
        )}
      </Pressable>
    </View>
  );
}

// Lesson card from Figma "Stories" (node 429:8892): cover on top, title, meta with a clock,
// and an action button on the right (blue "start", light "repeat", dark "locked").
export function StoryCard({
  cover,
  tint,
  title,
  meta,
  state,
  onPress,
}: {
  cover?: number;
  tint: string;
  title: string;
  meta: string;
  state: RailState;
  onPress?: () => void;
}) {
  const locked = state === 'locked';
  const done = state === 'done';
  const label = locked ? 'Закрыто' : done ? 'Повторить' : 'Начать';
  const btnBg = locked ? '#E3E6E8' : done ? '#DFF4FF' : '#59C8FF';
  const btnText = locked ? '#5D686F' : done ? '#1AB3FF' : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: locked }}
      disabled={locked || !onPress}
      onPress={onPress}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#C9EDFF',
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#C9EDFF',
        shadowOpacity: 1,
        shadowRadius: 0,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <View>
        {cover ? (
          <Image source={cover} style={{ width: '100%', height: 160 }} resizeMode="cover" />
        ) : (
          <View style={{ width: '100%', height: 160, backgroundColor: tint, opacity: 0.35 }} />
        )}
        {locked && (
          <View style={{ position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#171A1C' }}>
            <Lock size={12} color="#FFFFFF" />
            <Text style={{ fontWeight: '800', fontSize: 12, color: '#FFFFFF' }}>Закрыто</Text>
          </View>
        )}
        {done && (
          <View style={{ position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#DFF4FF' }}>
            <Text style={{ fontWeight: '800', fontSize: 12, color: '#1AB3FF' }}>Пройден</Text>
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontWeight: '700', fontSize: 16, color: '#171A1C' }} numberOfLines={2}>
            {title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Clock size={14} color="#1AB3FF" />
            <Text style={{ fontWeight: '500', fontSize: 13, color: '#1AB3FF' }} numberOfLines={1}>
              {meta}
            </Text>
          </View>
        </View>
        {!locked && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 14,
            height: 40,
            borderRadius: 12,
            backgroundColor: btnBg,
          }}
        >
          {locked ? <Lock size={16} color={btnText} /> : done ? <ArrowCounterClockwise size={16} color={btnText} /> : <Play size={16} color={btnText} weight="fill" />}
          <Text style={{ fontWeight: '700', fontSize: 14, color: btnText }}>{label}</Text>
        </View>
        )}
      </View>
    </Pressable>
  );
}



// Direction tile for the two-column grid (Variant 5 of the design canvas).
export function GoalGridCard({
  cover,
  tint,
  title,
  subtitle,
  available,
  onPress,
}: {
  cover?: number;
  tint: string;
  title: string;
  subtitle: string;
  available: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !available }}
      disabled={!available || !onPress}
      onPress={onPress}
      style={{
        flex: 1,
        gap: 8,
        padding: 10,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: available ? '#59C8FF' : '#C9EDFF',
        backgroundColor: '#FFFFFF',
        opacity: available ? 1 : 0.8,
      }}
    >
      <View style={{ height: 120, borderRadius: 12, overflow: 'hidden' }}>
        {cover ? (
          <Image source={cover} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ width: '100%', height: '100%', backgroundColor: tint, opacity: 0.35 }} />
        )}
        {!available && (
          <View style={{ position: 'absolute', top: 8, right: 8, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, backgroundColor: '#171A1C' }}>
            <Text style={{ fontWeight: '800', fontSize: 11, color: '#FFFFFF' }}>Скоро</Text>
          </View>
        )}
      </View>
      <Text style={{ fontWeight: '800', fontSize: 14, color: available ? '#171A1C' : '#5D686F' }} numberOfLines={2}>
        {title}
      </Text>
      <Text style={{ fontWeight: '600', fontSize: 12, color: available ? '#1AB3FF' : '#5D686F' }} numberOfLines={1}>
        {subtitle}
      </Text>
      {available && (
        <View style={{ height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#59C8FF' }}>
          <Text style={{ fontWeight: '800', fontSize: 13, color: '#FFFFFF' }}>Открыть</Text>
        </View>
      )}
    </Pressable>
  );
}
