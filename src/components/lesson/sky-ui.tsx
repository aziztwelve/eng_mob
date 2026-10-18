import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Check, X } from 'phosphor-react-native';
import { SKY } from './sky-lesson-header';

// Shared building blocks for the Game Play steps (Figma 246:15988, light sky layout).

export type ChoiceState = 'idle' | 'selected' | 'correct' | 'wrong';

export function resolveChoice(
  selected: boolean,
  isCorrectOption: boolean,
  feedback: 'idle' | 'submitting' | 'correct' | 'wrong',
): ChoiceState {
  if (feedback === 'correct' && selected) return 'correct';
  if (feedback === 'wrong' && isCorrectOption) return 'correct';
  if (feedback === 'wrong' && selected) return 'wrong';
  return selected ? 'selected' : 'idle';
}

const LOOK: Record<ChoiceState, { bg: string; border: string; shadow: string; badge: string; badgeInk: string }> = {
  idle: { bg: '#FFFFFF', border: '#DDE3E8', shadow: '#D3DAE0', badge: '#EEF2F5', badgeInk: SKY.muted },
  selected: { bg: '#EAF8FF', border: SKY.blue, shadow: SKY.blue, badge: SKY.blue, badgeInk: '#FFFFFF' },
  correct: { bg: '#E9FBEF', border: SKY.green, shadow: SKY.green, badge: SKY.green, badgeInk: '#FFFFFF' },
  wrong: { bg: '#FFECEC', border: SKY.red, shadow: SKY.red, badge: SKY.red, badgeInk: '#FFFFFF' },
};

export const skyFont = {
  title: 'Nunito_900Black',
  strong: 'Nunito_800ExtraBold',
  bold: 'Nunito_700Bold',
  medium: 'Nunito_600SemiBold',
} as const;

/** Scrollable body with a pinned footer (Check / Continue). */
export function SkyStepLayout({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer ? <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>{footer}</View> : null}
    </View>
  );
}

export function SkyCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[st.card, style]}>{children}</View>;
}

/** Small uppercase label shown above a question (e.g. the step instruction). */
export function SkyLabel({ children }: { children: React.ReactNode }) {
  return <Text style={st.label}>{children}</Text>;
}

export function SkyOption({
  label,
  badge,
  state,
  disabled,
  onPress,
  right,
}: {
  label: string;
  badge?: string;
  state: ChoiceState;
  disabled?: boolean;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  const look = LOOK[state];
  return (
    <View
      style={[
        st.option,
        { backgroundColor: look.bg, borderColor: look.border, borderBottomColor: look.shadow },
      ]}
    >
      <Pressable disabled={disabled} onPress={onPress} style={st.optionMain}>
        <View style={[st.badge, { backgroundColor: look.badge }]}>
          {state === 'correct' ? (
            <Check size={14} weight="bold" color={look.badgeInk} />
          ) : state === 'wrong' ? (
            <X size={14} weight="bold" color={look.badgeInk} />
          ) : (
            <Text style={[st.badgeText, { color: look.badgeInk }]}>{badge ?? ''}</Text>
          )}
        </View>
        <Text style={st.optionText}>{label}</Text>
      </Pressable>
      {right}
    </View>
  );
}

/** Round blue audio button with a pressed-down edge. */
export function SkyIconButton({
  children,
  onPress,
  size = 56,
  tone = 'blue',
  label,
}: {
  children: React.ReactNode;
  onPress: () => void;
  size?: number;
  tone?: 'blue' | 'white';
  label?: string;
}) {
  const white = tone === 'white';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: white ? '#FFFFFF' : SKY.blue,
        borderWidth: white ? 1.5 : 0,
        borderColor: SKY.line,
        borderBottomWidth: 4,
        borderBottomColor: white ? SKY.card : SKY.blueDark,
      }}
    >
      {children}
    </Pressable>
  );
}

export function SkyInput(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#8A949B"
      {...props}
      style={[st.input, props.style]}
    />
  );
}

export function SkyMissing({ message }: { message: string }) {
  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontFamily: skyFont.bold, color: SKY.muted }}>{message}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: SKY.card,
    borderBottomWidth: 4,
    marginBottom: 16,
  },
  label: {
    fontFamily: skyFont.strong,
    fontSize: 12,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: SKY.blueDark,
    marginBottom: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderBottomWidth: 4,
  },
  optionMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14 },
  badge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: skyFont.title, fontSize: 13 },
  optionText: { flex: 1, fontFamily: skyFont.strong, fontSize: 16, lineHeight: 21, color: SKY.ink },
  input: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderBottomWidth: 4,
    borderColor: '#DDE3E8',
    borderBottomColor: '#D3DAE0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: skyFont.strong,
    fontSize: 16,
    color: SKY.ink,
  },
});
