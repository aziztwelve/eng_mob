import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useIsAuthenticated } from '@/hooks/use-auth';
import { AIApi, type PronunciationAudioInput } from '@/lib/ai-api';
import type {
  AIMessage,
  AskTutorRequest,
  AssessWritingRequest,
  ExplainMistakeRequest,
  GetConversationResponse,
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

/** Scrollable history, including conversations beyond the first page. */
export function useAIConversationHistory() {
  const { isAuthenticated } = useIsAuthenticated();
  return useInfiniteQuery({
    queryKey: [...AI_CONVERSATIONS_KEY, 'history'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => AIApi.listConversations({ limit: 30, offset: pageParam }),
    getNextPageParam: (lastPage, pages) => {
      const received = pages.reduce((count, page) => count + (page.conversations?.length ?? 0), 0);
      return lastPage.conversations?.length && received < lastPage.total ? received : undefined;
    },
    enabled: isAuthenticated,
    staleTime: 0,
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

type ConversationKey = readonly unknown[];

/** The user's own phrase is shown at once; the real data replaces it on refetch. */
function addPendingUserMessage(
  qc: ReturnType<typeof useQueryClient>,
  key: ConversationKey,
  conversationId: string,
  content: string,
) {
  const previous = qc.getQueryData<GetConversationResponse>(key);
  if (previous) {
    const optimistic: AIMessage = {
      id: `pending-${Date.now()}`,
      conversation_id: conversationId,
      role: 'MESSAGE_ROLE_USER',
      content,
      created_at: new Date().toISOString(),
    };
    qc.setQueryData<GetConversationResponse>(key, {
      ...previous,
      messages: [...(previous.messages ?? []), optimistic],
    });
  }
  return previous;
}

function invalidateAfterSend(qc: ReturnType<typeof useQueryClient>, key: ConversationKey) {
  qc.invalidateQueries({ queryKey: key });
  qc.invalidateQueries({ queryKey: AI_CONVERSATIONS_KEY });
  qc.invalidateQueries({ queryKey: AI_QUOTA_KEY });
}

/** Отправить user-сообщение. */
export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  const key = [...AI_CONVERSATIONS_KEY, conversationId];
  return useMutation({
    mutationFn: (req: SendMessageRequest) =>
      AIApi.sendMessage(conversationId, req),
    onMutate: async (req) => {
      await qc.cancelQueries({ queryKey: key });
      return { previous: addPendingUserMessage(qc, key, conversationId, req.content) };
    },
    onError: (_err, _req, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSuccess: () => invalidateAfterSend(qc, key),
  });
}

/**
 * Потоковая отправка (SSE): текст бота появляется в чате по мере прихода,
 * `onDelta` позволяет озвучивать предложения, не дожидаясь конца ответа.
 * В потоке нет перевода и поправок (см. комментарий в ai.proto).
 */
export function useSendMessageStream(conversationId: string) {
  const qc = useQueryClient();
  const key = [...AI_CONVERSATIONS_KEY, conversationId];
  return useMutation({
    mutationFn: async (vars: { content: string; onDelta?: (delta: string) => void; onAvatarEmotion?: (emotion: string) => void; freeTalkSession?: boolean }) => {
      const pendingId = `pending-assistant-${Date.now()}`;
      let acc = '';
      return AIApi.streamMessage(
        conversationId,
        { content: vars.content, want_audio: false, include_avatar_emotion: !!vars.onAvatarEmotion, free_talk_session: !!vars.freeTalkSession },
        (delta) => {
          acc += delta;
          qc.setQueryData<GetConversationResponse>(key, (prev) => {
            if (!prev) return prev;
            const reply: AIMessage = {
              id: pendingId,
              conversation_id: conversationId,
              role: 'MESSAGE_ROLE_ASSISTANT',
              content: acc,
              created_at: new Date().toISOString(),
            };
            const rest = (prev.messages ?? []).filter((m) => m.id !== pendingId);
            return { ...prev, messages: [...rest, reply] };
          });
          vars.onDelta?.(delta);
        },
        vars.onAvatarEmotion,
      );
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = addPendingUserMessage(qc, key, conversationId, vars.content);
      return { previous: prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSuccess: () => invalidateAfterSend(qc, key),
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

/**
 * STT — распознавание голоса в текст для ввода в чат (Google STT).
 * Не трогает квоту (это вспомогательный ввод, а не AI-ответ).
 */
export function useTranscribeAudio() {
  return useMutation({
    mutationFn: (input: {
      audio: PronunciationAudioInput;
      language?: string;
      encoding?: string;
      sample_rate?: number;
    }) => AIApi.transcribeAudio(input),
  });
}
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
