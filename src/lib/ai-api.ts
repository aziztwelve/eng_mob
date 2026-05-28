import { Platform } from 'react-native';

import { ApiClient, handleUnauthorized } from './api-client';
import { AuthService } from './auth-service';
import type {
  AIQuotaStatus,
  AskTutorRequest,
  AskTutorResponse,
  AssessWritingRequest,
  AssessWritingResponse,
  CheckPronunciationResponse,
  ExplainMistakeRequest,
  ExplainMistakeResponse,
  GetConversationResponse,
  ListConversationsResponse,
  ListScenariosResponse,
  SendMessageRequest,
  SendMessageResponse,
  StartConversationRequest,
  StartConversationResponse,
} from '@/types/api';

/**
 * Phase 5: ai-service через gateway. Mirror eng_next2/src/lib/ai-api.ts.
 *
 * Все эндпоинты требуют auth. Pronunciation идёт мимо ApiClient
 * (multipart/form-data) — отдельный fetch с подстановкой Bearer-токена.
 */

function resolveApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081/api/v1';
  // На web / iOS подменяем Android-emulator alias 10.0.2.2 -> localhost.
  if (Platform.OS !== 'android' && raw.includes('10.0.2.2')) {
    return raw.replace('10.0.2.2', 'localhost');
  }
  return raw;
}

const API_BASE_URL = resolveApiBaseUrl();

/**
 * Параметры pronunciation-аудио для RN: file uri (из expo-av Recording),
 * MIME-type и имя файла.
 */
export interface PronunciationAudioInput {
  uri: string;
  /** Например, 'audio/m4a', 'audio/wav', 'audio/mp4'. */
  type: string;
  /** Например, 'recording.m4a'. */
  name: string;
}

export const AIApi = {
  // === Conversations ===
  startConversation: (req: StartConversationRequest) =>
    ApiClient.post<StartConversationResponse>('/ai/conversations', req),

  listConversations: (opts: { limit?: number; offset?: number } = {}) => {
    const qs = new URLSearchParams();
    if (opts.limit) qs.set('limit', String(opts.limit));
    if (opts.offset) qs.set('offset', String(opts.offset));
    const q = qs.toString();
    return ApiClient.get<ListConversationsResponse>(
      `/ai/conversations${q ? `?${q}` : ''}`,
    );
  },

  getConversation: (id: string) =>
    ApiClient.get<GetConversationResponse>(`/ai/conversations/${id}`),

  deleteConversation: (id: string) =>
    ApiClient.delete<unknown>(`/ai/conversations/${id}`),

  sendMessage: (id: string, req: SendMessageRequest) =>
    ApiClient.post<SendMessageResponse>(
      `/ai/conversations/${id}/messages`,
      req,
    ),

  listScenarios: (opts: { language?: string; user_level?: string } = {}) => {
    const qs = new URLSearchParams();
    if (opts.language) qs.set('language', opts.language);
    if (opts.user_level) qs.set('user_level', opts.user_level);
    const q = qs.toString();
    return ApiClient.get<ListScenariosResponse>(
      `/ai/scenarios${q ? `?${q}` : ''}`,
    );
  },

  // === Single-shot ===
  explainMistake: (req: ExplainMistakeRequest) =>
    ApiClient.post<ExplainMistakeResponse>('/ai/explain', req),

  assessWriting: (req: AssessWritingRequest) =>
    ApiClient.post<AssessWritingResponse>('/ai/writing/assess', req),

  askTutor: (req: AskTutorRequest) =>
    ApiClient.post<AskTutorResponse>('/ai/tutor', req),

  // === Pronunciation (multipart, RN: file uri вместо Blob) ===
  /**
   * RN-FormData принимает `{ uri, type, name }` для file-полей.
   * fetch автоматически проставит multipart-boundary, поэтому
   * Content-Type явно НЕ ставим.
   */
  async checkPronunciation(input: {
    audio: PronunciationAudioInput;
    target_text: string;
    language?: string;
    step_id?: string;
  }): Promise<CheckPronunciationResponse> {
    const fd = new FormData();
    // На native (iOS/Android) RN-FormData принимает file-объект
    // `{ uri, type, name }`. На вебе FormData ждёт настоящий Blob —
    // объект сериализуется в строку `[object Object]`. Поэтому web-флоу
    // отдельно: fetch'им Blob из object-URL (MediaRecorder отдаёт его).
    if (Platform.OS === 'web') {
      const blobResp = await fetch(input.audio.uri);
      const blob = await blobResp.blob();
      // Третий аргумент `append` — имя файла; gateway читает его в
      // multipart-header и парсит как FormFile.
      fd.append('audio', blob, input.audio.name);
    } else {
      fd.append('audio', {
        uri: input.audio.uri,
        type: input.audio.type,
        name: input.audio.name,
      } as unknown as Blob);
    }
    fd.append('target_text', input.target_text);
    if (input.language) fd.append('language', input.language);
    if (input.step_id) fd.append('step_id', input.step_id);

    const headers: Record<string, string> = {};
    const token = await AuthService.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/ai/pronunciation/check`, {
      method: 'POST',
      headers,
      body: fd,
    });

    if (!res.ok) {
      // Direct fetch обходит ApiClient.request, поэтому 401-redirect
      // подключаем здесь явно (см. api-client.ts:handleUnauthorized).
      if (res.status === 401) {
        await handleUnauthorized();
      }
      const text = await safeText(res);
      throw {
        message: text || `HTTP ${res.status}`,
        statusCode: res.status,
      };
    }
    return (await res.json()) as CheckPronunciationResponse;
  },

  // === Quota ===
  getQuota: () => ApiClient.get<AIQuotaStatus>('/ai/quota'),
};

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}
