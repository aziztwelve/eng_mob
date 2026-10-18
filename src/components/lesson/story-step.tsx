import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTranslation } from 'react-i18next';
import { FeedbackBar, type FeedbackState } from './FeedbackBar';
import { SKY } from './sky-lesson-header';
import { SkyCard, SkyMissing, SkyOption, SkyStepLayout, skyFont } from './sky-ui';
import { parseStepContent, type StepComponentProps } from './step-types';
import type { StoryContent, StoryScene } from '@/types/api';

/**
 * Markdown-стили для двух вариантов в story (main / translation) на светлом фоне.
 */
const mdMain = StyleSheet.create({
  body: { color: SKY.ink, fontFamily: skyFont.title, fontSize: 18, lineHeight: 26 },
  paragraph: { marginTop: 0, marginBottom: 6 },
  heading1: { fontSize: 22, marginVertical: 4 },
  heading2: { fontSize: 20, marginVertical: 4 },
  heading3: { fontSize: 18, marginVertical: 4 },
  strong: { fontFamily: skyFont.title },
  em: { fontStyle: 'italic' },
  link: { color: SKY.blueDark, textDecorationLine: 'underline' },
  code_inline: {
    color: SKY.ink,
    backgroundColor: '#EEF2F5',
    fontFamily: 'monospace',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  code_block: {
    color: SKY.ink,
    backgroundColor: '#EEF2F5',
    fontFamily: 'monospace',
    padding: 8,
    borderRadius: 8,
  },
  bullet_list: { marginVertical: 2 },
  ordered_list: { marginVertical: 2 },
  list_item: { flexDirection: 'row' },
});

const mdTranslation = StyleSheet.create({
  body: { color: SKY.muted, fontFamily: skyFont.medium, fontSize: 14, lineHeight: 20 },
  paragraph: { marginTop: 0, marginBottom: 4 },
  strong: { color: SKY.ink, fontFamily: skyFont.bold },
  em: { fontStyle: 'italic' },
  link: { color: SKY.blueDark, textDecorationLine: 'underline' },
  code_inline: {
    color: SKY.muted,
    backgroundColor: '#EEF2F5',
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
  const { t } = useTranslation();
  const content = parseStepContent<StoryContent>(step);
  const scenes = content?.scenes ?? [];
  const [sceneIdx, setSceneIdx] = useState(0);
  const [choices, setChoices] = useState<number[]>([]);
  const [state, setState] = useState<FeedbackState>({ kind: 'idle' });

  if (!content || scenes.length === 0) {
    return <SkyMissing message={t('lesson.parse_error')} />;
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

  const finished = state.kind === 'correct' || state.kind === 'wrong';
  const title = content.title ? (
    <Text style={{ fontFamily: skyFont.title, fontSize: 24, color: SKY.ink, marginBottom: 12 }}>{content.title}</Text>
  ) : null;

  if (finished) {
    return (
      <SkyStepLayout
        footer={<FeedbackBar state={state} canSubmit={false} onSubmit={() => {}} onContinue={onContinue} isLast={isLast} />}
      >
        {title}
        <SkyCard style={{ gap: 12 }}>
          {scenes
            .filter((sc) => sc.text && sc.type !== 'choice')
            .map((sc, i) => (
              <View key={i}>
                {sc.character ? (
                  <Text style={{ fontFamily: skyFont.strong, fontSize: 12, letterSpacing: 0.7, textTransform: 'uppercase', color: SKY.blueDark }}>{sc.character}</Text>
                ) : null}
                <Text style={{ fontFamily: skyFont.strong, fontSize: 16, lineHeight: 22, color: SKY.ink }}>{sc.text}</Text>
              </View>
            ))}
        </SkyCard>
      </SkyStepLayout>
    );
  }

  return (
    <SkyStepLayout
      footer={
        isChoice ? null : (
          <FeedbackBar
            state={state}
            canSubmit
            onSubmit={handleNext}
            onContinue={onContinue}
            isLast={isLast}
            submitLabel={lastScene ? t('lesson.feedback.finish') : t('lesson.feedback.next')}
          />
        )
      }
    >
      {title}

      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
        {scenes.map((_, i) => (
          <View
            key={i}
            style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i <= sceneIdx ? SKY.blue : '#FFFFFF', borderWidth: 1, borderColor: SKY.line }}
          />
        ))}
      </View>

      <SkyCard>
        {scene.image_url ? (
          <Image
            source={{ uri: scene.image_url }}
            style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 14, marginBottom: 12, backgroundColor: '#EEF2F5' }}
            resizeMode="cover"
          />
        ) : null}
        {scene.character ? (
          <Text style={{ fontFamily: skyFont.strong, fontSize: 12, letterSpacing: 0.7, textTransform: 'uppercase', color: SKY.blueDark, marginBottom: 4 }}>
            {scene.character}
          </Text>
        ) : null}
        {scene.text ? <Markdown style={mdMain}>{scene.text}</Markdown> : null}
        {scene.translation ? (
          <View style={{ marginTop: 4 }}>
            <Markdown style={mdTranslation}>{scene.translation}</Markdown>
          </View>
        ) : null}
        {isChoice && scene.question ? (
          <Text style={{ fontFamily: skyFont.strong, fontSize: 16, color: SKY.ink, marginTop: 12 }}>{scene.question}</Text>
        ) : null}
      </SkyCard>

      {isChoice && scene.options ? (
        <View style={{ gap: 12 }}>
          {scene.options.map((opt, i) => (
            <SkyOption
              key={i}
              label={opt.text}
              badge={String.fromCharCode(65 + i)}
              state="idle"
              disabled={state.kind === 'submitting'}
              onPress={() => handleChoice(i)}
            />
          ))}
        </View>
      ) : null}
    </SkyStepLayout>
  );
}
