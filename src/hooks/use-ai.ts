import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useIsAuthenticated } from '@/hooks/use-auth';
import { AIApi, type PronunciationAudioInput } from '@/lib/ai-api';
import type {
  AskTutorRequest,
  AssessWritingRequest,
  ExplainMistakeRequest,
  SendMessageRequest,
  StartConversationRequest,
} from '@/types/api';

// === Query keys ===
export const AI_QUOTA_KEY = ['ai', 'quota'] as const;
export const AI_CONVERSATIONS_KEY = ['ai', 'conversations'] as const;
export const AI_SCENARIOS_KEY = ['ai', 'scenarios'] as const;

/** Quota status — обновляется после chat/writing/voice вызовов. */
export function useAIQuota() {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: AI_QUOTA_KEY,
    queryFn: () => AIApi.getQuota(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

/** Список конверсаций пользователя. */
export function useAIConversations(
  opts: { limit?: number; offset?: number } = {},
) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [...AI_CONVERSATIONS_KEY, opts.limit ?? 20, opts.offset ?? 0],
    queryFn: () => AIApi.listConversations(opts),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

/** Конверсация + все сообщения. */
export function useAIConversation(id: string | undefined) {
  const { isAuthenticated } = useIsAuthenticated();
  return useQuery({
    queryKey: [...AI_CONVERSATIONS_KEY, id],
    queryFn: () => AIApi.getConversation(id!),
    enabled: isAuthenticated && !!id,
    staleTime: 0, // всегда свежие сообщения после возврата на страницу
  });
}

/** Каталог roleplay-сценариев (статика бэкенда). Долгий кэш. */
export function useAIScenarios(
  opts: { language?: string; user_level?: string } = {},
) {
  return useQuery({
    queryKey: [
      ...AI_SCENARIOS_KEY,
      opts.language ?? '',
      opts.user_level ?? '',
    ],
    queryFn: () => AIApi.listScenarios(opts),
    staleTime: 5 * 60 * 1000,
  });
}

/** Старт новой конверсации. После успеха инвалидируем list + quota. */
export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: StartConversationRequest) =>
      AIApi.startConversation(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AI_CONVERSATIONS_KEY });
      qc.invalidateQueries({ queryKey: AI_QUOTA_KEY });
    },
  });
}

/** Отправить user-сообщение. */
export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: SendMessageRequest) =>
      AIApi.sendMessage(conversationId, req),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: [...AI_CONVERSATIONS_KEY, conversationId],
      });
      qc.invalidateQueries({ queryKey: AI_CONVERSATIONS_KEY });
      qc.invalidateQueries({ queryKey: AI_QUOTA_KEY });
    },
  });
}

/** Удалить конверсацию (soft-delete на бэке). */
export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AIApi.deleteConversation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AI_CONVERSATIONS_KEY });
    },
  });
}

/** Объяснение ошибки (с кэшированием на бэке по step_id+md5(answer)). */
export function useExplainMistake() {
  return useMutation({
    mutationFn: (req: ExplainMistakeRequest) => AIApi.explainMistake(req),
  });
}

/** Writing assessment. */
export function useAssessWriting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: AssessWritingRequest) => AIApi.assessWriting(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AI_QUOTA_KEY });
    },
  });
}

/** Tutor — однократный Q&A. */
export function useAskTutor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: AskTutorRequest) => AIApi.askTutor(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AI_QUOTA_KEY });
    },
  });
}

/** Pronunciation check (multipart). */
export function useCheckPronunciation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      audio: PronunciationAudioInput;
      target_text: string;
      language?: string;
      step_id?: string;
    }) => AIApi.checkPronunciation(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AI_QUOTA_KEY });
    },
  });
}
