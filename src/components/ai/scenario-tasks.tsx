import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, ChevronDown, ChevronUp, ListChecks, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CTA, glass } from '@/components/sunset';
import type { AIScenario } from '@/types/api';

/**
 * Collapsible task list shown above the chat of a roleplay scene.
 * `done` holds the indexes of finished tasks; until the backend reports
 * completion it stays empty and the panel only shows what the user has to do.
 */
export function ScenarioTasksPanel({
  tasks,
  done = [],
}: {
  tasks: string[];
  done?: number[];
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (tasks.length === 0) return null;

  const doneSet = new Set(done);
  const completed = tasks.filter((_, i) => doneSet.has(i)).length;

  return (
    <View style={[s.panel, glass]}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={s.panelHead}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <ListChecks size={16} color="#34C759" />
        <Text style={s.panelTitle}>
          {t('ai.tasks_progress', { done: completed, total: tasks.length })}
        </Text>
        {open ? <ChevronUp size={16} color="#5D686F" /> : <ChevronDown size={16} color="#5D686F" />}
      </Pressable>
      {open ? (
        <View style={s.taskList}>
          {tasks.map((task, i) => (
            <TaskRow key={`${i}-${task}`} text={task} done={doneSet.has(i)} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function TaskRow({ text, done }: { text: string; done: boolean }) {
  return (
    <View style={s.taskRow}>
      <View style={[s.check, done && s.checkDone]}>
        {done ? <Check size={12} color="#fff" strokeWidth={3} /> : null}
      </View>
      <Text style={[s.taskText, done && s.taskTextDone]}>{text}</Text>
    </View>
  );
}

/**
 * Scene intro: the situation and the tasks, with a button that starts the chat.
 * Shown before a conversation is created so the user knows what to do.
 */
export function ScenarioIntroSheet({
  scenario,
  loading = false,
  onClose,
  onStart,
}: {
  scenario: AIScenario | null;
  loading?: boolean;
  onClose: () => void;
  onStart: (scenarioId: string) => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  if (!scenario) return null;
  const tasks = scenario.success_criteria ?? [];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={[glass, s.sheet, { paddingBottom: 20 + insets.bottom }]}>
          <View style={s.sheetHead}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.sheetTitle} numberOfLines={2}>{scenario.title}</Text>
              {scenario.user_level ? <Text style={s.sheetLevel}>{scenario.user_level}</Text> : null}
            </View>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
              <X size={20} color="#5D686F" />
            </Pressable>
          </View>

          {scenario.context || scenario.description ? (
            <View style={s.block}>
              <Text style={s.blockLabel}>{t('ai.scene_case')}</Text>
              <Text style={s.blockText}>{scenario.context || scenario.description}</Text>
            </View>
          ) : null}

          {tasks.length > 0 ? (
            <View style={s.block}>
              <Text style={s.blockLabel}>{t('ai.scene_tasks')}</Text>
              {tasks.map((task, i) => (
                <TaskRow key={`${i}-${task}`} text={task} done={false} />
              ))}
            </View>
          ) : null}

          <Pressable onPress={() => onStart(scenario.id)} disabled={loading} style={s.ctaWrap}>
            <LinearGradient
              colors={loading ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.12)'] : CTA}
              style={s.cta}
            >
              {loading
                ? <ActivityIndicator size="small" color="#5D686F" />
                : <Text style={s.ctaText}>{t('ai.scene_start')}</Text>}
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  panel: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 14, marginTop: 8 },
  panelHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  panelTitle: { flex: 1, color: '#171A1C', fontSize: 13, fontFamily: 'Nunito_800ExtraBold' },
  taskList: { marginTop: 8, gap: 8 },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  check: {
    width: 20, height: 20, borderRadius: 10, marginTop: 1,
    borderWidth: 2, borderColor: '#C9EDFF', alignItems: 'center', justifyContent: 'center',
  },
  checkDone: { backgroundColor: '#34C759', borderColor: '#34C759' },
  taskText: { flex: 1, color: '#5D686F', fontSize: 14, fontFamily: 'Nunito_600SemiBold', lineHeight: 19 },
  taskTextDone: { color: '#5D686F', textDecorationLine: 'line-through' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, gap: 16, backgroundColor: '#FFFFFF' },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  sheetTitle: { color: '#171A1C', fontSize: 20, fontFamily: 'Nunito_800ExtraBold' },
  sheetLevel: { color: '#1789BD', fontSize: 12, fontFamily: 'Nunito_800ExtraBold', marginTop: 3 },
  block: { gap: 8 },
  blockLabel: { color: '#59C8FF', fontSize: 12, fontFamily: 'Nunito_800ExtraBold', letterSpacing: 0.5, textTransform: 'uppercase' },
  blockText: { color: '#5D686F', fontSize: 15, fontFamily: 'Nunito_600SemiBold', lineHeight: 21 },
  ctaWrap: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  cta: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_800ExtraBold' },
});
