import React from 'react';
import { View, Text } from 'react-native';
import { TranslateStep } from './translate-step';
import { MatchPairsStep } from './match-pairs-step';
import { MatchPairsVoiceStep } from './match-pairs-voice-step';
import { ListeningStep } from './listening-step';
import { ListeningShadowingStep } from './listening-shadowing-step';
import { FillBlankStep } from './fill-blank-step';
import { TapWordsStep } from './tap-words-step';
import { QuizInteractiveStep } from './quiz-interactive-step';
import { StoryStep } from './story-step';
import { ChooseDefinitionStep } from './choose-definition-step';
import { ListenChooseWordStep } from './listen-choose-word-step';
import { MissingWordStep } from './missing-word-step';
import { CompleteChatStep } from './complete-chat-step';
import type { StepComponentProps } from './step-types';

/**
 * Главный switch для phase-2 интерактивных шагов на mobile.
 * Не покрывает legacy text/video и legacy quiz (`questions: [...]` формат).
 */
export function StepRenderer(props: StepComponentProps) {
  switch (props.step.type) {
    case 'translate':
      return <TranslateStep {...props} />;
    case 'match_pairs':
      return <MatchPairsStep {...props} />;
    case 'match_pairs_voice':
      return <MatchPairsVoiceStep {...props} />;
    case 'listening':
      return <ListeningStep {...props} />;
    case 'listening_shadowing':
      return <ListeningShadowingStep {...props} />;
    case 'fill_blank':
      return <FillBlankStep {...props} />;
    case 'tap_words':
      return <TapWordsStep {...props} />;
    case 'quiz':
      // Phase-2 single-choice формат. Если на бэке хранится legacy
      // `{ questions: [...] }` — компонент покажет fallback-message.
      return <QuizInteractiveStep {...props} />;
    case 'story':
      return <StoryStep {...props} />;
    case 'choose_definition':
      return <ChooseDefinitionStep {...props} />;
    case 'listen_choose_word':
      return <ListenChooseWordStep {...props} />;
    case 'missing_word':
      return <MissingWordStep {...props} />;
    case 'complete_chat':
      return <CompleteChatStep {...props} />;
    default:
      return (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-muted-foreground text-center">
            Тип шага «{props.step.type}» не поддержан интерактивным флоу.
          </Text>
        </View>
      );
  }
}

export {
  TranslateStep,
  MatchPairsStep,
  MatchPairsVoiceStep,
  ListeningStep,
  ListeningShadowingStep,
  FillBlankStep,
  TapWordsStep,
  QuizInteractiveStep,
  StoryStep,
  ChooseDefinitionStep,
  ListenChooseWordStep,
  MissingWordStep,
  CompleteChatStep,
};
