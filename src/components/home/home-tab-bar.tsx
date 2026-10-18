import React from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { FigmaSvg } from '@/components/figma/FigmaSvg';

// Figma "Bottom App Bar" (node 429:36670) for the home screen. The app's tabs are
// Home, Practice, AI, League, Profile, so the five icons map to those routes in order.
const BASE = require('../../../assets/figma/home-map/nav-base.svg');
// Each tab has an active (blue #59C8FF) and an inactive (grey #464E53) icon, as in the design.
const ICONS = [
  { active: require('../../../assets/figma/home-map/nav-home-active.svg'), inactive: require('../../../assets/figma/home-map/nav-home-inactive.svg') },
  { active: require('../../../assets/figma/home-map/nav-fire-active.svg'), inactive: require('../../../assets/figma/home-map/nav-fire-inactive.svg') },
  { active: require('../../../assets/figma/home-map/nav-video-active.svg'), inactive: require('../../../assets/figma/home-map/nav-video-inactive.svg') },
  { active: require('../../../assets/figma/home-map/nav-podium-active.svg'), inactive: require('../../../assets/figma/home-map/nav-podium-inactive.svg') },
  { active: require('../../../assets/figma/home-map/nav-user-active.svg'), inactive: require('../../../assets/figma/home-map/nav-user-inactive.svg') },
];
const ROUTES = ['index', 'practice', 'ai', 'social', 'profile'];
const COMING_SOON_TAB_INDICES = new Set([2, 3]);

// Design geometry: bar 300x60, 6pt padding, 48pt tabs with 12pt gaps.
const TAB = 48;
const GAP = 12;
const PAD = 6;

export function HomeTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const S = Math.min(width, 600) / 375;
  // Tracks and lessons live under the Practice tab, so they keep the second icon active.
  const routeName = state.routes[state.index]?.name;
  const activeRoute = routeName === 'tracks' ? 'practice' : routeName;
  const activeIndex = ROUTES.indexOf(activeRoute);

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 14 * S, alignItems: 'center' }}>
      <View
        style={{
          width: 300 * S,
          height: 60 * S,
          flexDirection: 'row',
          alignItems: 'center',
          gap: GAP * S,
          paddingHorizontal: PAD * S,
          borderRadius: 100,
          borderWidth: 1.5,
          borderColor: 'rgba(0,0,0,0.12)',
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        {/* Highlight circle behind the active tab. */}
        {activeIndex >= 0 && <View style={{ position: 'absolute', left: (PAD + activeIndex * (TAB + GAP)) * S, top: 6 * S, width: TAB * S, height: TAB * S }}>
          <FigmaSvg source={BASE} width={TAB*S} height={TAB*S} />
        </View>}
        {ICONS.map((icon, i) => {
          const name = ROUTES[i];
          const focused = i === activeIndex;
          const isComingSoon = COMING_SOON_TAB_INDICES.has(i);
          return (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityLabel={t(`tabs.${["home","practice","ai","social","profile"][i]}`)}
              accessibilityState={{ selected: focused, disabled: isComingSoon }}
              onPress={() => {
                if (isComingSoon) return;
                const event = navigation.emit({ type: 'tabPress', target: state.routes.find(route => route.name === name)?.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(name as never);
              }}
              style={{ width: TAB*S, height: TAB*S, alignItems: 'center', justifyContent: 'center', opacity: isComingSoon ? 0.58 : 1 }}
            >
              {i === 3 ? <View style={{width:24*S,height:24*S}}>
                <FigmaSvg source={require('../../../assets/figma/home-map/nav-podium-star.svg')} width={10*S} height={10*S} style={{position:'absolute',left:7*S,top:0}}/>
                {[{x:2,y:15,h:8},{x:8,y:11,h:12},{x:14,y:15,h:8}].map((bar,j)=><View key={j} style={{position:'absolute',left:bar.x*S,top:bar.y*S,width:8*S,height:bar.h*S,borderTopLeftRadius:2*S,borderTopRightRadius:2*S,backgroundColor:focused?'#59C8FF':'#464E53'}}/>)}
              </View> : <FigmaSvg source={focused ? icon.active : icon.inactive} width={24*S} height={24*S} />}
              {isComingSoon && (
                <View
                  style={{
                    position: 'absolute',
                    top: -7 * S,
                    right: -7 * S,
                    minWidth: 42 * S,
                    height: 18 * S,
                    paddingHorizontal: 5 * S,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 9 * S,
                    borderWidth: 1,
                    borderColor: '#9DDEFA',
                    backgroundColor: '#E7F8FF',
                  }}
                >
                  <Text style={{ color: '#1597D1', fontSize: 8 * S, fontWeight: '800' }}>
                    {t('ai.soon')}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default HomeTabBar;
