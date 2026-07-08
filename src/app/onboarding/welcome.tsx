import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { LearningStartIllustration } from '@/components/LearningStartIllustration';
import { NeonScreen, neon, neonStyles } from '@/components/neon-screen';
import { usePatchOnboardingV3 } from '@/hooks/use-onboarding';
import { analytics } from '@/lib/analytics';
import { resetOnboarding } from '@/lib/onboarding-storage';
import { getCurrentLang, setUiLang, type UiLang } from '@/lib/i18n';
import { UI_LANGUAGES } from '@/lib/supported-languages';

/**
 * Welcome (шаг 1) — простой landing.
 *
 * UI:
 *   - Маскот + заголовок + подзаголовок.
 *   - CTA «Начать учиться» → onboarding/goal (target_language='en' по умолчанию).
 *   - «У меня уже есть аккаунт. Войти» → /auth/login.
 *   - В правом верхнем углу UI lang switcher (RU/EN/KK).
 *   - Внизу — сноска T&C/Privacy: tap по ссылкам открывает модалку.
 *
 * Выбор изучаемого языка (раньше тут был grid из 12+ языков) убран —
 * по умолчанию ставим English. Дальше юзер сможет добавить/переключить
 * язык через Home → «+ Добавить язык».
 */
export default function WelcomeScreen() {
  const { t, i18n } = useTranslation();
  const uiLang = getCurrentLang();
  const [submitting, setSubmitting] = useState(false);
  const [legalOpen, setLegalOpen] = useState<null | 'terms' | 'privacy'>(null);
  const patch = usePatchOnboardingV3();

  React.useEffect(() => {
    analytics.track('onboarding_started', { ui_lang: uiLang });
    analytics.track('onboarding_step_viewed', { step: 'welcome' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStart() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await resetOnboarding();
      await patch.mutateAsync({
        patch: {
          target_language: 'en',
          native_language: uiLang,
        },
        localExtra: { current_step: 'welcome' },
      });
      analytics.track('onboarding_step_completed', {
        step: 'welcome',
        target_language: 'en',
        ui_lang: uiLang,
      });
      router.push('/onboarding/goal');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <NeonScreen>
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Top bar: brand + UI lang switcher */}
      <View className="flex-row items-center justify-between px-5 pt-2">
        <Text style={[neonStyles.title, { fontSize: 24 }]}>
          {t('onboarding.welcome.brand')}
        </Text>
        <UiLangSwitcher
          value={uiLang}
          onChange={(code) => {
            void setUiLang(code);
          }}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 24 }}
      >
        <Animated.View entering={FadeIn.duration(280)} className="items-center mt-4">
          <LearningStartIllustration width={170} height={170} />
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.duration(320).delay(80)}
          style={[neonStyles.title, { textAlign: 'center', marginTop: 24 }]}
        >
          {t('onboarding.welcome.greeting_title')}
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(320).delay(140)}
          style={{ color: neon.muted, fontWeight: '600', fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 22 }}
        >
          {t('onboarding.welcome.tagline')}
        </Animated.Text>
      </ScrollView>

      {/* Sticky footer: CTA + login + legal */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8, gap: 8 }}>
        <Pressable
          onPress={() => void handleStart()}
          disabled={submitting}
          style={[neonStyles.cta, { backgroundColor: neon.ctaBg }, submitting && { opacity: 0.6, shadowOpacity: 0, backgroundColor: 'rgba(255,255,255,0.08)' }]}
          accessibilityRole="button"
        >
          <Text style={{ color: neon.text, fontWeight: '900', fontSize: 16 }}>
            {submitting ? t('onboarding.welcome.cta_submitting') : t('onboarding.welcome.cta')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/auth/login')}
          className="py-3 items-center active:opacity-70"
          accessibilityRole="link"
        >
          <Text style={[neonStyles.primaryText, { fontWeight: '800', fontSize: 14 }]}>
            {t('onboarding.welcome.signin_link')}
          </Text>
        </Pressable>

        <View className="flex-row flex-wrap justify-center px-2 mt-1">
          <Text style={{ color: neon.muted, fontSize: 12 }}>
            {t('onboarding.welcome.legal_prefix')}{' '}
          </Text>
          <Pressable onPress={() => setLegalOpen('terms')} hitSlop={6}>
            <Text style={{ color: neon.primary, fontWeight: '800', fontSize: 12, textDecorationLine: 'underline' }}>
              {t('onboarding.welcome.terms_link')}
            </Text>
          </Pressable>
          <Text style={{ color: neon.muted, fontSize: 12 }}>
            {' '}
            {t('onboarding.welcome.legal_and')}{' '}
          </Text>
          <Pressable onPress={() => setLegalOpen('privacy')} hitSlop={6}>
            <Text style={{ color: neon.primary, fontWeight: '800', fontSize: 12, textDecorationLine: 'underline' }}>
              {t('onboarding.welcome.privacy_link')}
            </Text>
          </Pressable>
        </View>
      </View>

      <LegalModal
        kind={legalOpen}
        onClose={() => setLegalOpen(null)}
      />

      {/* Force re-render on language change. */}
      <View accessibilityElementsHidden importantForAccessibility="no" style={{ display: 'none' }}>
        <Text>{i18n.language}</Text>
      </View>
    </SafeAreaView>
    </NeonScreen>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UiLangSwitcher({
  value,
  onChange,
}: {
  value: UiLang;
  onChange: (v: UiLang) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = UI_LANGUAGES.find((l) => l.code === value) ?? UI_LANGUAGES[0];
  return (
    <View>
      <Pressable
        onPress={() => setOpen(!open)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: neon.surface, borderWidth: 1, borderColor: neon.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}
        accessibilityRole="button"
      >
        <Text style={{ fontSize: 14 }}>{current.flag}</Text>
        <Text style={{ color: neon.text, fontWeight: '800', fontSize: 12, textTransform: 'uppercase' }}>
          {current.code}
        </Text>
      </Pressable>
      {open ? (
        <Animated.View
          entering={FadeIn.duration(140)}
          style={{ position: 'absolute', top: 36, right: 0, minWidth: 120, zIndex: 10, backgroundColor: '#141A24', borderWidth: 1, borderColor: neon.border, borderRadius: 16, paddingVertical: 4 }}
        >
          {UI_LANGUAGES.map((l) => (
            <Pressable
              key={l.code}
              onPress={() => {
                onChange(l.code as UiLang);
                setOpen(false);
              }}
              style={{ paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Text style={{ fontSize: 14 }}>{l.flag}</Text>
              <Text style={{ color: neon.text, fontWeight: '800', fontSize: 14 }}>{l.nameNative}</Text>
            </Pressable>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

function LegalModal({
  kind,
  onClose,
}: {
  kind: null | 'terms' | 'privacy';
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const visible = kind !== null;
  const titleKey =
    kind === 'terms'
      ? 'onboarding.welcome.terms_modal_title'
      : 'onboarding.welcome.privacy_modal_title';
  const bodyKey =
    kind === 'terms'
      ? 'onboarding.welcome.terms_modal_body'
      : 'onboarding.welcome.privacy_modal_body';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View
          style={{ maxHeight: '85%', backgroundColor: '#0A0D16', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderTopColor: neon.border }}
        >
          <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
            <Text style={{ color: neon.text, fontWeight: '900', fontSize: 20, flex: 1 }}>
              {visible ? t(titleKey) : ''}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              className="p-1 active:opacity-60"
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.common.done')}
            >
              <X size={22} color="#9ca3af" />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 8 }}
          >
            <Text style={{ color: neon.text, fontWeight: '500', fontSize: 14, lineHeight: 24 }}>
              {visible ? t(bodyKey) : ''}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
