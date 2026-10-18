import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useTracks } from '@/hooks/use-tracks';
import { useOnboardingState } from '@/hooks/use-onboarding';
import { SKY } from '@/components/lesson/sky-lesson-header';
import { skyFont } from '@/components/lesson/sky-ui';
import { SkyPanel } from './practice-ui';

// "Level grid" variant: CEFR levels as two-column cards with a colored level letter,
// the track count and an "Open" button, plus a bear card at the end.
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
const COLORS: Record<string, string> = {
  A1: '#59C8FF',
  A2: '#FFB338',
  B1: '#34C759',
  B2: '#B68DEB',
  C1: '#EE95C5',
};

/** Русская плюрализация «N трек(а/ов)». */
function nTracksKey(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'practice.n_tracks_1';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'practice.n_tracks_2';
  return 'practice.n_tracks_5';
}

function Bear() {
  return (
    <Svg width={46} height={50} viewBox="0 0 96 104">
      <Circle cx={22} cy={26} r={12} fill="#E8833A" />
      <Circle cx={74} cy={26} r={12} fill="#E8833A" />
      <Circle cx={22} cy={26} r={6} fill="#B8651F" />
      <Circle cx={74} cy={26} r={6} fill="#B8651F" />
      <Ellipse cx={48} cy={62} rx={40} ry={38} fill="#FF8A2B" />
      <Ellipse cx={48} cy={76} rx={20} ry={15} fill="#FFC9A0" />
      <Circle cx={34} cy={54} r={6} fill="#171A1C" />
      <Circle cx={62} cy={54} r={6} fill="#171A1C" />
      <Circle cx={36} cy={52} r={2} fill="#FFFFFF" />
      <Circle cx={64} cy={52} r={2} fill="#FFFFFF" />
      <Ellipse cx={48} cy={68} rx={8} ry={5.5} fill="#171A1C" />
      <Path d="M40 80q8 7 16 0" fill="none" stroke="#171A1C" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

export function TracksTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const onboarding = useOnboardingState();
  const language = onboarding.data?.target_language || undefined;
  const { data, isLoading } = useTracks({ language, limit: 500 });
  const tracks = data?.tracks ?? [];

  if (isLoading) {
    return <ActivityIndicator color={SKY.blue} style={{ marginVertical: 32 }} />;
  }
  if (tracks.length === 0) {
    return (
      <SkyPanel style={st.empty}>
        <Text style={st.emptyText}>{t('practice.no_tracks_level')}</Text>
      </SkyPanel>
    );
  }

  const countByLevel = new Map<string, number>();
  tracks.forEach((track) => {
    const lvl = (track.level ?? '').toUpperCase();
    if (lvl) countByLevel.set(lvl, (countByLevel.get(lvl) ?? 0) + 1);
  });

  return (
    <View style={{ marginTop: 18 }}>
      <Text style={st.title}>{t('practice.levels_tracks')}</Text>
      <View style={st.grid}>
        {LEVELS.map((lvl) => {
          const count = countByLevel.get(lvl) ?? 0;
          const open = count > 0;
          return (
            <Pressable
              key={lvl}
              disabled={!open}
              onPress={() => router.push(`/tracks?level=${lvl}` as never)}
              accessibilityRole="button"
              accessibilityState={{ disabled: !open }}
              style={st.cell}
            >
              <SkyPanel style={[st.card, !open && { opacity: 0.7 }]}>
                <Text style={[st.level, { color: open ? COLORS[lvl] : '#B8C4CC' }]}>{lvl}</Text>
                <Text style={st.name} numberOfLines={1}>{t(`tracks.level_titles.${lvl}` as never)}</Text>
                <Text style={st.count}>{open ? t(nTracksKey(count), { count }) : t('practice.tracks_closed')}</Text>
                <View style={[st.open, !open && st.openOff]}>
                  <Text style={[st.openText, !open && { color: '#8A949B' }]}>{t('practice.open_btn')}</Text>
                </View>
              </SkyPanel>
            </Pressable>
          );
        })}
        <View style={st.cell}>
          <SkyPanel style={[st.card, st.bearCard]}>
            <Bear />
            <Text style={st.bearText}>{t('practice.keep_learning')}</Text>
          </SkyPanel>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  title: { fontFamily: skyFont.title, fontSize: 22, color: SKY.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  cell: { width: '47.8%', flexGrow: 1 },
  card: { padding: 14 },
  level: { fontFamily: skyFont.title, fontSize: 36 },
  name: { fontFamily: skyFont.title, fontSize: 15, color: SKY.ink },
  count: { fontFamily: skyFont.bold, fontSize: 12, color: SKY.muted, marginTop: 2 },
  open: { height: 38, borderRadius: 14, marginTop: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: SKY.blue, borderBottomWidth: 4, borderBottomColor: SKY.blueDark },
  openOff: { backgroundColor: '#E6ECF0', borderBottomColor: '#CDD4D9' },
  openText: { fontFamily: skyFont.strong, fontSize: 14, color: '#FFFFFF' },
  bearCard: { flex: 1, backgroundColor: '#EAF8FF', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 146 },
  bearText: { fontFamily: skyFont.title, fontSize: 14, lineHeight: 18, color: SKY.ink, textAlign: 'center' },
  empty: { alignItems: 'center', padding: 24, marginTop: 20 },
  emptyText: { fontFamily: skyFont.bold, fontSize: 15, color: SKY.muted, textAlign: 'center' },
});
