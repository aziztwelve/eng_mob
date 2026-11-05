import { Platform } from 'react-native';
import { fetch as streamingFetch } from 'expo/fetch';

import { ApiClient, handleUnauthorized, tryRefreshTokens } from './api-client';
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
  SynthesizeTTSResponse,
  TranscribeAudioResponse,
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
 * Параметры pronunciation-аудио для RN: file uri (из expo-audio Recording),
 * MIME-type и имя файла.
 */
export interface PronunciationAudioInput {
  uri: string;
  /** Например, 'audio/m4a', 'audio/wav', 'audio/mp4'. */
  type: string;
  /** Например, 'recording.m4a'. */
  name: string;
}

/**
 * Multipart POST в обход ApiClient: подставляет Bearer, а при 401 один раз
 * обновляет токены (refresh) и повторяет запрос — иначе просроченный
 * access-токен разлогинивал пользователя при записи голоса.
 */
async function postMultipart(url: string, body: FormData): Promise<Response> {
  const send = async () => {
    const headers: Record<string, string> = {};
    const token = await AuthService.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { method: 'POST', headers, body });
  };
  let res = await send();
  if (res.status === 401 && (await tryRefreshTokens())) res = await send();
  return res;
}

/**
 * POST /ai/conversations/:id/stream (SSE). Events: user | delta | done | error.
 * RN's global fetch cannot read a body incrementally, expo/fetch can. On 401
 * the tokens are refreshed once, like in postMultipart.
 */
async function streamConversationMessage(
  conversationId: string,
  req: SendMessageRequest,
  onDelta: (delta: string) => void,
  onAvatarEmotion?: (emotion: string) => void,
): Promise<SendMessageResponse> {
  const url = `${API_BASE_URL}/ai/conversations/${encodeURIComponent(conversationId)}/stream`;
  const open = async () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };
    const token = await AuthService.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return streamingFetch(url, { method: 'POST', headers, body: JSON.stringify(req) });
  };

  let res = await open();
  if (res.status === 401 && (await tryRefreshTokens())) res = await open();
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    let message = text;
    try { message = (JSON.parse(text) as { error?: string }).error ?? text; } catch { /* plain text */ }
    throw new Error(message || `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let done: SendMessageResponse | null = null;

  const handleEvent = (block: string) => {
    let event = 'message';
    const dataLines: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
    }
    if (dataLines.length === 0) return;
    const data = JSON.parse(dataLines.join('\n')) as Record<string, unknown>;
    if (event === 'delta') onDelta(String(data.delta ?? ''));
    else if (event === 'avatar_emotion' && typeof data.emotion === 'string') onAvatarEmotion?.(data.emotion);
    else if (event === 'done') done = data as unknown as SendMessageResponse;
    else if (event === 'error') throw new Error(String(data.error ?? 'stream error'));
  };

  for (;;) {
    const { value, done: finished } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      handleEvent(block);
    }
    if (finished) break;
  }
  if (buffer.trim()) handleEvent(buffer);
  if (!done) throw new Error('stream ended without result');
  return done;
}

/**
 * Opens the connection that the chat stream will reuse while the user is
 * still talking: a fresh TLS handshake on a mobile link costs seconds.
 */
export function warmStreamConnection(): void {
  const origin = API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');
  void streamingFetch(`${origin}/health`, { method: 'GET' })
    .then((r) => r.text())
    .catch(() => {});
}

export const AIApi = {
  streamMessage: streamConversationMessage,

  // === Conversations ===
  reserveFreeTalk: (id: string) => ApiClient.post<{ allowed: boolean; unlimited: boolean; expires_at_ms?: number | string; resets_at_ms: number | string; server_now_ms: number | string }>(`/ai/conversations/${encodeURIComponent(id)}/free-talk-session`, {}),
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

    const res = await postMultipart(`${API_BASE_URL}/ai/pronunciation/check`, fd);

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

  // === STT (голосовой ввод в чат, multipart) ===
  /**
   * Распознаёт запись голоса в текст через Google STT (gateway
   * `POST /ai/stt`). Без оценки произношения — просто audio → text для
   * заполнения поля ввода в чате. Тот же multipart-флоу, что и
   * checkPronunciation (RN: file uri; web: реальный Blob).
   */
  async transcribeAudio(input: {
    audio: PronunciationAudioInput;
    language?: string;
    /** Google STT encoding (LINEAR16 | AMR_WB | OGG_OPUS | ...). Пусто → вывод из mime. */
    encoding?: string;
    sample_rate?: number;
  }): Promise<TranscribeAudioResponse> {
    const fd = new FormData();
    if (Platform.OS === 'web') {
      const blobResp = await fetch(input.audio.uri);
      const blob = await blobResp.blob();
      fd.append('audio', blob, input.audio.name);
    } else {
      fd.append('audio', {
        uri: input.audio.uri,
        type: input.audio.type,
        name: input.audio.name,
      } as unknown as Blob);
    }
    if (input.language) fd.append('language', input.language);
    if (input.encoding) fd.append('encoding', input.encoding);
    if (input.sample_rate) fd.append('sample_rate', String(input.sample_rate));

    const res = await postMultipart(`${API_BASE_URL}/ai/stt`, fd);

    if (!res.ok) {
      if (res.status === 401) {
        await handleUnauthorized();
      }
      const text = await safeText(res);
      throw {
        message: text || `HTTP ${res.status}`,
        statusCode: res.status,
      };
    }
    return (await res.json()) as TranscribeAudioResponse;
  },

  // === Quota ===
  getQuota: () => ApiClient.get<AIQuotaStatus>('/ai/quota'),

  // === TTS (on-demand озвучка слов) ===
  synthesizeTTS: (req: { text: string; language?: string; voice?: string }) =>
    ApiClient.post<SynthesizeTTSResponse>('/ai/tts', req),
};

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}
