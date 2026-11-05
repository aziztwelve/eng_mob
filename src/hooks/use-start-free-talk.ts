import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useIsFocused } from '@react-navigation/native';

import { hasQuotaLeft } from '@/components/ai/quota-widget';
import { useAIQuota, useStartConversation } from '@/hooks/use-ai';
import { DEFAULT_TARGET_LANG } from '@/lib/ai-languages';

/** Explicit entry into Free Talk; the destination reserves the server timer. */
export function useStartFreeTalk() {
  const router = useRouter();
  const { t } = useTranslation();
  const quota = useAIQuota();
  const conversation = useStartConversation();
  const [isStarting, setStarting] = useState(false);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const focused = useRef(true);
  focused.current = useIsFocused();
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const start = async () => {
    if (inFlight.current || !focused.current) return;
    inFlight.current = true;
    setStarting(true);
    try {
      let available = quota.data;
      if (!available || quota.isError) {
        const result = await quota.refetch();
        if (result.isError || !result.data) throw result.error ?? new Error(t('common.load_failed'));
        available = result.data;
      }
      if (!hasQuotaLeft(available, 'chat')) throw new Error(t('ai.chat_limit_bar'));
      if (!mounted.current || !focused.current) return;
      const result = await conversation.mutateAsync({ scenario: 'free_chat', target_language: DEFAULT_TARGET_LANG });
      if (mounted.current && focused.current) {
        router.push({ pathname: '/free-talk/[id]', params: { id: result.conversation.id, autoStart: '1' } });
      }
    } catch (error) {
      if (mounted.current) Toast.show({ type: 'error', text1: t('ai.start_failed'), text2: error instanceof Error ? error.message : undefined });
    } finally {
      inFlight.current = false;
      if (mounted.current) setStarting(false);
    }
  };

  return { start, isStarting };
}
