import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookOpen } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { SKY } from '@/components/lesson/sky-lesson-header';
import { skyFont } from '@/components/lesson/sky-ui';
import { SkyPanel } from './practice-ui';

// "Coming soon" list variant: planned courses with a reminder switch each.
// The switch is stored on the device only (no backend subscription yet).
const STORAGE_KEY = 'course_notify_v1';

const COURSES = [
  { id: 'business', labelKey: 'practice.course_business', tint: '#FFF1D6' },
  { id: 'travel', labelKey: 'practice.course_travel', tint: '#E9FBEF' },
  { id: 'exams', labelKey: 'practice.course_exams', tint: '#F1E7FE' },
  { id: 'speaking', labelKey: 'practice.course_speaking', tint: '#FFE6F3' },
] as const;

function Switch({ on }: { on: boolean }) {
  return (
    <View style={[st.track, on && st.trackOn]}>
      <View style={[st.knob, on && st.knobOn]} />
    </View>
  );
}

export function CoursesTab() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setEnabled(JSON.parse(raw) as string[]);
      } catch {
        /* best-effort */
      }
    })();
  }, []);

  const toggle = (id: string) => {
    setEnabled((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  return (
    <View style={{ marginTop: 18 }}>
      <Text style={st.title}>{t('practice.courses_soon_title')}</Text>
      <Text style={st.hint}>{t('practice.courses_soon_hint')}</Text>
      <View style={{ gap: 10, marginTop: 14 }}>
        {COURSES.map((course) => {
          const on = enabled.includes(course.id);
          return (
            <Pressable key={course.id} onPress={() => toggle(course.id)} accessibilityRole="switch" accessibilityState={{ checked: on }}>
              <SkyPanel style={st.row}>
                <View style={[st.icon, { backgroundColor: course.tint }]}>
                  <BookOpen size={22} weight="bold" color={SKY.blueDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.name}>{t(course.labelKey as never)}</Text>
                  <View style={st.soon}>
                    <Text style={st.soonText}>{t('practice.soon_tag')}</Text>
                  </View>
                </View>
                <Switch on={on} />
              </SkyPanel>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  title: { fontFamily: skyFont.title, fontSize: 22, color: SKY.ink },
  hint: { fontFamily: skyFont.medium, fontSize: 14, lineHeight: 20, color: SKY.muted, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: skyFont.title, fontSize: 16, color: SKY.ink },
  soon: { alignSelf: 'flex-start', height: 22, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#FFF1D6', justifyContent: 'center', marginTop: 4 },
  soonText: { fontFamily: skyFont.strong, fontSize: 12, color: '#9A5B00' },
  track: { width: 46, height: 28, borderRadius: 14, backgroundColor: SKY.line, justifyContent: 'center' },
  trackOn: { backgroundColor: SKY.green },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', marginLeft: 3 },
  knobOn: { marginLeft: 21 },
});
