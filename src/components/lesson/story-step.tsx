import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { parseStepContent, type StepComponentProps } from './step-types';
import type { StoryContent, StoryScene } from '@/types/api';

/**
 * Markdown-стили для двух вариантов в story (main / translation).
 * Цвета из tailwind.config.js (foreground / muted-foreground / primary).
 *
 * `body` — обёртка всего markdown. `paragraph`/`heading*`/`bullet_list`
 * наследуют от body, остальное (bold/italic/code/link) переопределяем.
 */
const mdMain = StyleSheet.create({
  body: { color: '#ffffff', fontSize: 18, fontWeight: '900', lineHeight: 26 },
  paragraph: { marginTop: 0, marginBottom: 6 },
  heading1: { fontSize: 22, fontWeight: '900', marginVertical: 4 },
  heading2: { fontSize: 20, fontWeight: '900', marginVertical: 4 },
  heading3: { fontSize: 18, fontWeight: '900', marginVertical: 4 },
  strong: { fontWeight: '900' },
  em: { fontStyle: 'italic', fontWeight: '900' },
  link: { color: '#00FFA3', textDecorationLine: 'underline' },
  code_inline: {
    color: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    fontFamily: 'monospace',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  code_block: {
    color: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.08)',
    fontFamily: 'monospace',
    padding: 8,
    borderRadius: 8,
  },
  bullet_list: { marginVertical: 2 },
  ordered_list: { marginVertical: 2 },
  list_item: { flexDirection: 'row' },
});

const mdTranslation = StyleSheet.create({
  body: { color: '#9FB0C8', fontSize: 14, fontWeight: '500', lineHeight: 20 },
  paragraph: { marginTop: 0, marginBottom: 4 },
  strong: { color: '#ffffff', fontWeight: '700' },
  em: { fontStyle: 'italic' },
  link: { color: '#00FFA3', textDecorationLine: 'underline' },
  code_inline: {
    color: '#9FB0C8',
    backgroundColor: 'rgba(255,255,255,0.06)',
    fontFamily: 'monospace',
    paddingHorizontal: 3,
    borderRadius: 4,
  },
});

/**
 * Story: последовательные сцены с прогрессом. На choice — кнопки.
 *
 * Markdown в `scene.text` / `scene.translation` рендерится через
 * `react-native-markdown-display` с двумя style-вариантами (main + translation).
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
          <Markdown style={mdMain}>{scene.text}</Markdown>
        )}
        {scene.translation && (
          <View className="mt-1">
            <Markdown style={mdTranslation}>{scene.translation}</Markdown>
          </View>
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
