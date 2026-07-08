import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import {
  FluentTheme,
  navigationConfig,
  ROUTE_TO_TAB_ID,
  type NavigationItem,
  type TabId,
} from '@/theme/Theme';

/**
 * FluentBottomTabs — кастомный нижний таб-бар в стиле Fluent:
 * glassmorphism-подложка, скруглённый верх,
 * золотой акцент активного пункта, lucide-иконки.
 *
 * Подключается как `tabBar` к expo-router <Tabs> (получает
 * BottomTabBarProps от @react-navigation/bottom-tabs), поэтому роутинг
 * остаётся file-based, а вид — полностью кастомный.
 *
 * Примечание про blur: настоящий backdrop-blur (FluentTheme.tabBar.blur)
 * требует expo-blur — это нативный модуль, для него нужен пересборка
 * dev-клиента/APK. Чтобы работать в текущей сборке без краша, подложка
 * сделана полупрозрачным цветом tabBarGlass (rgba(80,20,40,0.65)).
 * Когда expo-blur будет установлен и приложение пересобрано — достаточно
 * обернуть подложку в <BlurView intensity={20} tint="dark" />.
 */
export function FluentBottomTabs({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, tabBar, font } = FluentTheme;

  // id → конфиг (иконка/заголовок), чтобы не искать линейно на каждый таб.
  const configById = useMemo(
    () =>
      navigationConfig.reduce<Record<TabId, NavigationItem>>(
        (acc, item) => {
          acc[item.id] = item;
          return acc;
        },
        {} as Record<TabId, NavigationItem>,
      ),
    [],
  );

  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <View
      style={[
        styles.container,
        {
          height: tabBar.height + insets.bottom,
          paddingBottom: bottomInset,
          borderTopLeftRadius: tabBar.radiusTop,
          borderTopRightRadius: tabBar.radiusTop,
          backgroundColor: colors.tabBarGlass,
          borderTopColor: colors.cardBorder,
        },
      ]}
    >
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const tabId = ROUTE_TO_TAB_ID[route.name];
          // Скрытые/служебные маршруты (tracks, courses, home-*) не показываем.
          if (!tabId) return null;

          const item = configById[tabId];
          if (!item) return null;

          const focused = state.index === index;
          const color = focused ? colors.primary : colors.inactive;
          const Icon = item.icon;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: true, radius: 36 }}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={item.title}
              style={styles.item}
              hitSlop={6}
            >
              <Icon size={tabBar.iconSize} color={color} strokeWidth={focused ? 2.4 : 2} />
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  {
                    color,
                    fontSize: tabBar.labelSize,
                    fontWeight: focused ? font.activeWeight : font.inactiveWeight,
                  },
                ]}
              >
                {item.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    // overflow:hidden обрезает контент по скруглённым углам (важно при blur)
    overflow: 'hidden',
    paddingTop: 5,
    paddingHorizontal: 6,
    // лёгкая тень над баром (iOS) / приподнятость (Android)
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  label: {
    fontFamily: FluentTheme.font.family,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
