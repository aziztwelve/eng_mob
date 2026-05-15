import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { parseStepContent, type StepComponentProps } from './step-types';
import type { StoryContent, StoryScene } from '@/types/api';

/**
 * Минимальный strip-markdown: убираем **bold** и *italic* маркеры,
 * оставляем текст. На phase-2 mobile использует plain text — полноценный
 * markdown-рендер (`react-native-markdown-display`) — Phase 2.5 TODO.
 *
 * Поддерживает:
 *  - `**text**` / `__text__` → text
 *  - `*text*` / `_text_` → text
 *  - `` `code` `` → code
 *  - `[link text](url)` → link text
 */
function stripMarkdown(s: string): string {
  return s
    .replace(/\*\*([^*]+?)\*\*/g, '$1')
    .replace(/__([^_]+?)__/g, '$1')
    .replace(/\*([^*]+?)\*/g, '$1')
    .replace(/(?<![\w_])_([^_]+?)_(?![\w_])/g, '$1')
    .replace(/`([^`]+?)`/g, '$1')
    .replace(/\[([^\]]+?)\]\([^)]+\)/g, '$1');
}

/**
 * Story: последовательные сцены с прогрессом. На choice — кнопки.
 *
 * Markdown в `scene.text` / `scene.translation` сейчас стрипается до plain
 * text. Phase 2.5 TODO: добавить `react-native-markdown-display`.
 */
export function StoryStep({ step, onSubmit, onContinue, isLast }: StepComponentProps) {
  const content = parseStepContent<StoryContent>(step);
  const scenes = content?.scenes ?? [];
  const [sceneIdx, setSceneIdx] = useState(0);
  const [choices, setChoices] = useState<number[]>([]);
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content || scenes.length === 0) {
    return (
      <View className="p-6">
        <Text className="text-muted-foreground">Не удалось распарсить story content.</Text>
      </View>
    );
  }

  const scene: StoryScene = scenes[sceneIdx];
  const isChoice = scene.type === 'choice' && scene.options && scene.options.length > 0;
  const lastScene = sceneIdx === scenes.length - 1;

  const submit = async (allChoices: number[]) => {
    setState({ kind: 'submitting' });
    try {
      const resp = await onSubmit({ choices: allChoices });
      setState(
        resp.is_correct
          ? { kind: 'correct', explanation: resp.explanation }
          : { kind: 'wrong', explanation: resp.explanation },
      );
    } catch (e) {
      console.error(e);
      setState({ kind: 'idle' });
    }
  };

  const handleChoice = (idx: number) => {
    const next = [...choices, idx];
    setChoices(next);
    if (!lastScene) setSceneIdx(sceneIdx + 1);
    else void submit(next);
  };

  const handleNext = () => {
    if (lastScene) void submit(choices);
    else setSceneIdx(sceneIdx + 1);
  };

  if (state.kind === 'correct' || state.kind === 'wrong') {
    return (
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="pb-4">
        {content.title && (
          <Text className="text-2xl font-black text-foreground mb-4">{content.title}</Text>
        )}
        <FeedbackBar
          state={state}
          canSubmit={false}
          onSubmit={() => {}}
          onContinue={onContinue}
          isLast={isLast}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="pb-4">
      {content.title && (
        <Text className="text-2xl font-black text-foreground mb-3">{content.title}</Text>
      )}

      {/* Прогресс */}
      <View className="flex-row gap-1 mb-4">
        {scenes.map((_, i) => (
          <View
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= sceneIdx ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </View>

      <View className="bg-card rounded-2xl border-2 border-border p-4 mb-4">
        {scene.image_url ? (
          <Image
            source={{ uri: scene.image_url }}
            className="w-full aspect-video rounded-xl mb-3 bg-muted"
            resizeMode="cover"
          />
        ) : null}
        {scene.character && (
          <Text className="text-xs font-bold text-muted-foreground uppercase mb-1">
            {scene.character}
          </Text>
        )}
        {scene.text && (
          <Text className="text-foreground text-lg font-black">
            {stripMarkdown(scene.text)}
          </Text>
        )}
        {scene.translation && (
          <Text className="text-sm text-muted-foreground font-medium mt-1">
            {stripMarkdown(scene.translation)}
          </Text>
        )}
        {isChoice && scene.question && (
          <Text className="text-foreground font-bold text-base mt-3">{scene.question}</Text>
        )}
      </View>

      {isChoice && scene.options ? (
        <View className="gap-2 mb-5">
          {scene.options.map((opt, i) => (
            <Pressable
              key={i}
              disabled={state.kind === 'submitting'}
              onPress={() => handleChoice(i)}
              className="rounded-2xl border-2 border-border bg-card p-4"
            >
              <Text className="font-bold text-foreground">{opt.text}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <FeedbackBar
          state={state}
          canSubmit
          onSubmit={handleNext}
          onContinue={onContinue}
          isLast={isLast}
          submitLabel={lastScene ? 'Завершить' : 'Дальше'}
        />
      )}
    </ScrollView>
  );
}
