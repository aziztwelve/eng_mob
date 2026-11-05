import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Dimensions, Keyboard, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Maximize2, Minimize2, Send, UserRound, Volume2, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { KeyboardLift } from '@/components/keyboard-lift';
import { SkyScreen } from '@/components/lesson/sky-lesson-header';
import { ChatMessage } from '@/components/ai/chat-message';
import { FreeTalkVoiceControls } from '@/components/ai/free-talk-voice-controls';
import { AvatarPicker } from '@/components/ai/avatar-picker';
import { TalkingAvatar } from '@/components/ai/talking-avatar';
import { useFreeTalkAvatar } from '@/hooks/use-free-talk-avatar';
import { useFreeTalkSession } from '@/hooks/use-free-talk-session';
import { useAIConversation, useAIQuota } from '@/hooks/use-ai';
import { useFreeTalk } from '@/hooks/use-free-talk';
import { hasQuotaLeft } from '@/components/ai/quota-widget';
import { TALK_STARTERS, talkDuration } from '@/lib/free-talk';
import { AI_LEVELS, AI_TOPICS, findAILesson } from '@/lib/ai-topics';
import { buildLessonInstruction, getAILessonCard } from '@/lib/ai-lesson-cards';
import { useCurrentUser } from '@/hooks/use-auth';
import { completeLesson } from '@/lib/ai-lesson-progress';

export default function FreeTalkScreen() {
  const { t, i18n } = useTranslation();
  const user = useCurrentUser();
  const { id, aiLevel, aiTopic, aiLesson, autoStart } = useLocalSearchParams<{ id: string; aiLevel?: string; aiTopic?: string; aiLesson?: string; autoStart?: string }>();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const keyboardBottomInset = Platform.OS === 'android'
    ? Math.max(0, Dimensions.get('screen').height - window.height - insets.top)
    : 0;
  const conversation = useAIConversation(id);
  const quota = useAIQuota();
  const language = conversation.data?.conversation.target_language || 'en';
  const talk = useFreeTalk(id ?? '', language);
  const { phase: talkPhase, stopAtSessionLimit } = talk;
  const avatar = useFreeTalkAvatar();
  const session = useFreeTalkSession(id ?? '');
  const { start: startSession } = session;
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [manualSpeech, setManualSpeech] = useState<Record<string, string>>({});
  const [typing, setTyping] = useState(false);
  const [recordingLocked, setRecordingLocked] = useState(false);
  const [draft, setDraft] = useState('');
  const [inspire, setInspire] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const ready = !!conversation.data?.conversation && !conversation.isError;
  const busy = talk.phase !== 'idle';
  const allowed = ready && session.active && hasQuotaLeft(quota.data, 'chat') && !quota.isError;
  const messages = (conversation.data?.messages ?? []).filter(message => message.content.trim());
  const title = conversation.data?.conversation.title ?? '';
  const lessonFromTitle = AI_LEVELS.flatMap(level => AI_TOPICS[level].flatMap(topic => topic.lessons.map((lesson, index) => ({ level, topic, lesson, lessonIndex: index }))))
    .find(item => `${item.level} · ${item.topic.title} · ${item.lesson}` === title);
  const lesson = (aiLevel && aiTopic && aiLesson !== undefined ? findAILesson(aiLevel, aiTopic, Number(aiLesson)) : null) ?? lessonFromTitle;
  const lessonCard = lesson ? getAILessonCard(lesson.level, lesson.topic.id, lesson.lessonIndex) : null;
  const introPrefix = 'Let’s begin my English lesson:';
  const practicePrefix = 'Let’s move on to conversation practice.';
  const hasIntro = messages.some(message => message.content.startsWith(introPrefix));
  const practicing = messages.some(message => message.content.startsWith(practicePrefix));
  const visibleMessages = lesson ? messages.filter(message => !message.content.startsWith(introPrefix) && !message.content.startsWith(practicePrefix)) : messages;
  const introInFlight = useRef(false);
  const [introFailed, setIntroFailed] = useState(false);
  const manualSpeechText = Object.values(manualSpeech).at(-1) ?? '';
  const lastText = messages.at(-1)?.content;
  const lastAssistantText = [...messages].reverse().find(message => String(message.role).toUpperCase().includes('ASSISTANT') || Number(message.role) === 2)?.content ?? '';
  const autoStarted = useRef<string | null>(null);
  const automaticEntry = autoStart === '1' && !session.started && !session.failed && !conversation.isError && !quota.isError && hasQuotaLeft(quota.data, 'chat');

  useEffect(() => {
    if (autoStart !== '1' || !id || !ready || !quota.isSuccess || !hasQuotaLeft(quota.data, 'chat') || autoStarted.current === id) return;
    autoStarted.current = id;
    void startSession();
  }, [autoStart, id, ready, quota.isSuccess, quota.data, startSession]);

  useEffect(() => {
    if (session.started && !session.active && talkPhase !== 'idle') void stopAtSessionLimit();
  }, [session.active, session.started, talkPhase, stopAtSessionLimit]);
  useEffect(() => {
    // Count real foreground practice time, rather than inventing a quota countdown.
    const interval = setInterval(() => { if (AppState.currentState === 'active' && ready) setElapsed(value => value + 1); }, 1000);
    return () => clearInterval(interval);
  }, [ready]);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  useEffect(() => {
    const timeout = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timeout);
  }, [lastText, busy, keyboardOpen]);

  const beginLesson = async () => {
    if (!lesson || !allowed || busy || introInFlight.current || hasIntro) return;
    introInFlight.current = true;
    setIntroFailed(false);
    const guidance = lessonCard ? buildLessonInstruction(lessonCard) : 'Please teach me interactively at this level. First explain a few useful words and one relevant language point with examples, then ask short exercises one at a time and give feedback. After that, help me practise a realistic conversation on this topic.';
    const sent = await talk.sendText(`${introPrefix} ${lesson.lesson} (${lesson.topic.title}, ${lesson.level}). ${guidance}`);
    if (!sent) { introInFlight.current = false; setIntroFailed(true); }
  };
  useEffect(() => {
    if (lesson && allowed && !hasIntro && !introInFlight.current && !introFailed) void beginLesson();
  });
  const beginPractice = async () => {
    if (!lesson || !allowed || busy) return;
    await talk.sendText(`${practicePrefix} ${lessonCard ? `${lessonCard.practice} Success criteria: ${lessonCard.success}` : `Please role-play a realistic ${lesson.level} conversation about ${lesson.lesson}, one turn at a time, and give brief helpful corrections.`}`);
  };

  const finishLesson = async () => {
    if (!lesson || !user.data?.id || savingProgress) return;
    setSavingProgress(true);
    try {
      await completeLesson(user.data.id, lesson.level, lesson.topic.id, lesson.lessonIndex);
      if (router.canGoBack()) router.back(); else router.replace('/(tabs)/ai');
    } catch {
      Toast.show({ type: 'error', text1: t('common.load_failed') });
    } finally { setSavingProgress(false); }
  };

  const submit = async () => {
    if (!allowed || busy || !draft.trim()) return;
    const text = draft;
    Keyboard.dismiss();
    if (await talk.sendText(text)) { setDraft(''); setTyping(false); }
  };
  const stateLabel = talk.phase === 'listening' ? t(recordingLocked ? 'freeTalk.recording_locked' : 'freeTalk.listening')
    : talk.phase === 'starting' ? t('freeTalk.starting')
    : talk.phase === 'thinking' ? t('ai.thinking')
    : talk.phase === 'speaking' ? t('freeTalk.speaking') : t('freeTalk.hold_hint');

  return (
    <SkyScreen>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: !busy }} />
      <StatusBar style="dark" />
      <KeyboardLift keyboardBottomInset={keyboardBottomInset}>
        <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-3">
          <View className="flex-row items-center justify-between gap-3">
            <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/ai/chat')}
              accessibilityRole="button" accessibilityLabel={t('freeTalk.close')}
              className="h-11 w-11 items-center justify-center rounded-full border border-[#9DDEFA] bg-white/90">
              <X size={23} color="#171A1C" />
            </Pressable>
            <View className="flex-1 items-center">
              <Text numberOfLines={1} className="font-nunito-extrabold text-lg text-mieo-heading">{lesson?.lesson ?? 'Free Talk'}</Text>
              <Text accessibilityLabel={t('freeTalk.elapsed')} className="font-nunito-bold text-xs text-mieo-body">{session.active && session.remaining !== null ? `${t('freeTalk.session_remaining')} ${talkDuration(session.remaining)}` : session.started && !session.active ? '00:00' : session.started ? talkDuration(elapsed) : '05:00'} · {language.toUpperCase()}</Text>
            </View>
            <Pressable onPress={() => talk.setRate(talk.rate === 1 ? 0.75 : talk.rate === 0.75 ? 1.25 : 1)}
              accessibilityRole="button" accessibilityLabel={t('freeTalk.speed', { rate: talk.rate })}
              className="h-11 min-w-11 items-center justify-center rounded-full border border-[#9DDEFA] bg-white/90 px-2">
              <Text className="font-nunito-extrabold text-sm text-[#247FA8]">{talk.rate}×</Text>
            </Pressable>
          </View>
          {!keyboardOpen && (
            <View className={`items-center justify-center ${expanded ? 'h-64' : 'h-40'}`}>
              <TalkingAvatar id={avatar.avatarId} expanded={expanded} phase={talk.phase}
                text={talk.speakingText || manualSpeechText || lastAssistantText} emotion={manualSpeechText ? null : talk.avatarEmotion} speaking={talk.audioPlaying || !!manualSpeechText} label={t('freeTalk.avatar_space')} />
              <Pressable onPress={() => setAvatarPickerOpen(true)} disabled={talk.phase !== 'idle'} accessibilityRole="button" accessibilityLabel={t('freeTalk.change_avatar')}
                className={`absolute bottom-0 left-0 min-h-11 flex-row items-center gap-2 rounded-full border border-[#9DDEFA] bg-white/90 px-3 ${talk.phase !== 'idle' ? 'opacity-50' : ''}`}>
                <UserRound size={17} color="#247FA8" /><Text className="font-nunito-bold text-xs text-[#247FA8]">{t('freeTalk.change_avatar')}</Text>
              </Pressable>
              <Pressable onPress={() => setExpanded(value => !value)} accessibilityRole="button" accessibilityLabel={t(expanded ? 'freeTalk.collapse' : 'freeTalk.expand')}
                className="absolute bottom-0 right-0 h-11 w-11 items-center justify-center rounded-full bg-white/70">
                {expanded ? <Minimize2 size={19} color="#247FA8" /> : <Maximize2 size={19} color="#247FA8" />}
              </Pressable>
            </View>
          )}
        </View>

        <View className="flex-1 rounded-t-[28px] bg-white">
          <View className="mx-4 mt-4 flex-row items-center gap-3 rounded-2xl border-b-4 border-[#E8A22A] bg-[#FFBD48] px-4 py-3">
            <Volume2 size={23} color="#5C3D08" />
            <Text className="flex-1 font-nunito-extrabold text-base text-[#5C3D08]">{lesson ? t(practicing ? 'aiTopics.practice' : 'aiTopics.lecture') : t('freeTalk.section')}</Text>
          </View>
          <ScrollView ref={scroll} className="flex-1" contentContainerClassName="gap-3 px-4 pb-4 pt-4" keyboardShouldPersistTaps="handled">
            {conversation.isPending ? <ActivityIndicator color="#2FA8E6" />
              : conversation.isError ? (
                <View accessibilityRole="alert" className="gap-3 rounded-2xl border border-mieo-stroke p-5">
                  <Text className="font-nunito-bold text-mieo-error-text">{t('common.load_failed')}</Text>
                  <Pressable onPress={() => void conversation.refetch()} className="min-h-11 items-center justify-center rounded-xl bg-mieo-sky">
                    <Text className="font-nunito-bold text-mieo-heading">{t('practice.retry')}</Text>
                  </Pressable>
                </View>
              ) : visibleMessages.length ? visibleMessages.map(message => (
                <ChatMessage key={message.id} message={message} language={language} showAvatar={false} compact audioDisabled={busy} playbackRate={talk.rate}
                  onPlaybackChange={(playing, text) => setManualSpeech(current => {
                    const next = { ...current }; if (playing) next[message.id] = text; else delete next[message.id]; return next;
                  })} />
              )) : (
                <View className="gap-2 rounded-[24px] bg-[#F3F7FA] p-5">
                  <Text className="font-nunito-extrabold text-xl text-mieo-heading">{lesson ? lesson.lesson : t('freeTalk.welcome')}</Text>
                  <Text className="font-nunito-semibold text-base leading-6 text-mieo-body">{lesson ? `${t('aiTopics.lecture')} · ${t('aiTopics.practice')} · ${lesson.level}` : t('freeTalk.welcome_hint')}</Text>
                </View>
              )}
            {talk.phase === 'thinking' && <View className="self-start rounded-2xl bg-[#F3F7FA] px-5 py-3"><ActivityIndicator color="#2FA8E6" /></View>}
          </ScrollView>
          <View className="gap-3 px-5 pt-2" style={{ paddingBottom: keyboardOpen ? 12 : insets.bottom + 24 }}>
            {lesson && session.active && hasIntro && !practicing && <Pressable onPress={() => void beginPractice()} disabled={busy} accessibilityRole="button" className={`min-h-11 items-center justify-center rounded-xl border border-[#94D9F8] bg-[#EDF9FF] ${busy ? 'opacity-50' : ''}`}><Text className="font-nunito-extrabold text-[#168CC5]">{t('aiTopics.practice')} →</Text></Pressable>}
            {lesson && practicing && <Pressable onPress={() => void finishLesson()} disabled={busy || savingProgress || !user.data?.id} accessibilityRole="button" className={`min-h-11 items-center justify-center rounded-xl border border-[#94D9F8] bg-[#EDF9FF] ${busy || savingProgress || !user.data?.id ? 'opacity-50' : ''}`}><Text className="font-nunito-extrabold text-[#168CC5]">{i18n.resolvedLanguage?.startsWith('ru') ? 'Отметить урок пройденным' : i18n.resolvedLanguage?.startsWith('kk') ? 'Сабақты аяқталды деп белгілеу' : 'Mark lesson complete'}</Text></Pressable>}
            {lesson && introFailed && session.active && <Pressable onPress={() => { setIntroFailed(false); void beginLesson(); }} accessibilityRole="button"><Text className="text-center font-nunito-bold text-mieo-error-text">{t('common.load_failed')} · {t('practice.retry')}</Text></Pressable>}
            {!hasQuotaLeft(quota.data, 'chat') && <Text className="text-center font-nunito-bold text-sm text-mieo-error-text">{t('ai.chat_limit_bar')}</Text>}
            {quota.isError && <Pressable accessibilityRole="button" onPress={() => void quota.refetch()}><Text className="text-center font-nunito-bold text-mieo-error-text">{t('common.load_failed')} · {t('practice.retry')}</Text></Pressable>}
            {!session.active && <View className="gap-2 rounded-2xl bg-[#F3F9FC] p-4">
              <Text className="text-center font-nunito-bold text-sm text-mieo-body">{session.started ? t('freeTalk.session_ended') : automaticEntry ? t('freeTalk.session_starting') : t('freeTalk.session_hint')}</Text>
              {automaticEntry && <ActivityIndicator color="#2FA8E6" />}
              {session.failed && <Text className="text-center font-nunito-bold text-sm text-mieo-error-text">{t('freeTalk.session_failed')}</Text>}
              {!session.started && !automaticEntry && <Pressable onPress={() => void session.start()} disabled={!ready || session.starting || quota.isPending || quota.isError || !hasQuotaLeft(quota.data, 'chat')} accessibilityRole="button"
                className={`min-h-11 items-center justify-center rounded-xl bg-[#2FA8E6] ${!ready || session.starting || quota.isPending || quota.isError || !hasQuotaLeft(quota.data, 'chat') ? 'opacity-50' : ''}`}>
                <Text className="font-nunito-extrabold text-white">{t(session.starting ? 'freeTalk.session_starting' : session.failed ? 'practice.retry' : 'freeTalk.session_start')}</Text>
              </Pressable>}
            </View>}
            {typing ? (
              <View className="flex-row items-end gap-2 rounded-2xl border-[1.5px] border-b-4 border-[#C9EDFF] bg-[#F5FBFF] p-2">
                <TextInput value={draft} onChangeText={setDraft} multiline maxLength={4000} editable={!busy}
                  accessibilityLabel={t('freeTalk.type')} placeholder={t('freeTalk.message_placeholder')} placeholderTextColor="#8A949B"
                  className="max-h-28 min-h-11 flex-1 px-2 font-nunito-semibold text-base text-mieo-heading" />
                <Pressable onPress={() => void submit()} disabled={!allowed || busy || !draft.trim()} accessibilityRole="button" accessibilityLabel={t('freeTalk.send')}
                  className={`h-11 w-11 items-center justify-center rounded-xl bg-[#2FA8E6] ${!allowed || busy || !draft.trim() ? 'opacity-40' : ''}`}>
                  <Send size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            ) : null}
            {session.active && (!typing || busy) && <Text accessibilityLiveRegion="polite" className="text-center font-nunito-bold text-sm text-mieo-body">{stateLabel}{talk.phase === 'listening' ? ` · ${talkDuration(talk.recordedSeconds)} / 00:30` : ''}</Text>}
            {!keyboardOpen && <FreeTalkVoiceControls talk={talk} allowed={allowed} typing={typing} onLockChange={setRecordingLocked}
              onType={() => { setTyping(value => !value); Keyboard.dismiss(); }} onInspire={() => setInspire(true)} />}
          </View>
        </View>
      </KeyboardLift>
      <AvatarPicker visible={avatarPickerOpen} selected={avatar.avatarId} loading={avatar.isLoading} saving={avatar.isSaving} error={avatar.loadError}
        onRetry={() => void avatar.retry()} onClose={() => setAvatarPickerOpen(false)} onSelect={(avatarId) => {
          void avatar.saveAvatar(avatarId).then(() => setAvatarPickerOpen(false)).catch(() => {
            Toast.show({ type: 'error', text1: t('freeTalk.avatar_save_failed') });
          });
        }} />
      <Modal visible={inspire} transparent animationType="slide" onRequestClose={() => setInspire(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="gap-4 rounded-t-3xl bg-white px-5 pt-5" style={{ paddingBottom: insets.bottom + 20 }}>
            <View className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 font-nunito-extrabold text-xl text-mieo-heading">{t('freeTalk.inspire_title')}</Text>
              <Pressable onPress={() => setInspire(false)} accessibilityRole="button" accessibilityLabel={t('common.close')} className="h-11 w-11 items-center justify-center"><X size={24} color="#171A1C" /></Pressable>
            </View>
            <Text className="font-nunito-semibold text-sm text-mieo-body">{t('freeTalk.inspire_hint')}</Text>
            {TALK_STARTERS.map(text => <Pressable key={text} onPress={() => { setDraft(text); setTyping(true); setInspire(false); }} accessibilityRole="button" className="min-h-12 justify-center rounded-2xl border border-[#C9EDFF] bg-[#F5FBFF] px-4 py-3"><Text className="font-nunito-bold text-base text-mieo-heading">{text}</Text></Pressable>)}
          </View>
        </View>
      </Modal>
    </SkyScreen>
  );
}
