import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { BookOpen, Heart, MagnifyingGlass, MapTrifold, type Icon as PhosphorIcon } from 'phosphor-react-native';
import { IconFlame, IconGem, IconHeart } from '@/components/ui/icons';
import { SKY } from '@/components/lesson/sky-lesson-header';
import { skyFont } from '@/components/lesson/sky-ui';

// Shared pieces of the redesigned "Practice" page (Figma-based sky style):
// top stats pills and the icon tab row ("variant 5"), plus small card helpers.

export type PracticeTab = 'tracks' | 'courses' | 'words' | 'bank';

const TAB_ICONS: Record<PracticeTab, PhosphorIcon> = {
  tracks: MapTrifold,
  courses: BookOpen,
  words: Heart,
  bank: MagnifyingGlass,
};

export function StatPill({ children, value }: { children: React.ReactNode; value: string | number }) {
  return (
    <View style={st.pill}>
      {children}
      <Text style={st.pillText}>{value}</Text>
    </View>
  );
}

export function PracticeHeader({
  active,
  onChange,
  labels,
  streak,
  hearts,
  gems,
}: {
  active: PracticeTab;
  onChange: (tab: PracticeTab) => void;
  labels: Record<PracticeTab, string>;
  streak: string | number;
  hearts: string | number;
  gems: string | number;
}) {
  const tabs: PracticeTab[] = ['tracks', 'bank', 'words', 'courses'];
  return (
    <View>
      <View style={st.statsRow}>
        <StatPill value={streak}><IconFlame size={16} color="#FF8A2B" /></StatPill>
        <StatPill value={hearts}><IconHeart size={16} color="#E5484D" /></StatPill>
        <StatPill value={gems}><IconGem size={16} color={SKY.blue} /></StatPill>
      </View>
      <View style={st.tabRow} accessibilityRole="tablist">
        {tabs.map((tab) => {
          const on = tab === active;
          const Icon = TAB_ICONS[tab];
          return (
            <Pressable
              key={tab}
              onPress={() => onChange(tab)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={st.tabItem}
            >
              <View style={[st.tabIcon, on && st.tabIconOn]}>
                <Icon size={24} weight={on ? 'fill' : 'bold'} color={on ? '#FFFFFF' : SKY.blueDark} />
              </View>
              <Text numberOfLines={1} style={[st.tabLabel, on && st.tabLabelOn]}>{labels[tab]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** White card with the blue "pressed edge" used across the sky screens. */
export function SkyPanel({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[st.panel, style]}>{children}</View>;
}

export const practiceFont = skyFont;

const st = StyleSheet.create({
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: SKY.line,
  },
  pillText: { fontFamily: skyFont.strong, fontSize: 14, color: SKY.ink },
  tabRow: { flexDirection: 'row', marginTop: 14, gap: 8 },
  tabItem: { flex: 1, alignItems: 'center', gap: 6 },
  tabIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderBottomWidth: 4,
    borderColor: '#DDE3E8',
    borderBottomColor: '#D3DAE0',
  },
  tabIconOn: { backgroundColor: SKY.blue, borderColor: SKY.blue, borderBottomColor: SKY.blueDark },
  tabLabel: { fontFamily: skyFont.strong, fontSize: 12, color: SKY.muted },
  tabLabelOn: { fontFamily: skyFont.title, color: SKY.ink },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderBottomWidth: 4,
    borderColor: SKY.card,
  },
});
