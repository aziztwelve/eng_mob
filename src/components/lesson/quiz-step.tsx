import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { QuizContent } from '@/types/api';
import { fx } from '@/lib/fx';
import { SKY } from './sky-lesson-header';
import { SkyCard, SkyOption, SkyStepLayout, skyFont, type ChoiceState } from './sky-ui';

interface QuizStepProps {
  content: QuizContent;
  onComplete: (score: number) => void;
}

function Btn({ label, onPress, disabled, tone = 'blue' }: { label: string; onPress: () => void; disabled?: boolean; tone?: 'blue' | 'white' }) {
  const white = tone === 'white';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: disabled ? '#E3E8EC' : white ? '#FFFFFF' : SKY.blue,
        borderWidth: white ? 1.5 : 0,
        borderColor: SKY.line,
        borderBottomWidth: 4,
        borderBottomColor: disabled ? '#CDD4D9' : white ? SKY.card : SKY.blueDark,
      }}
    >
      <Text style={{ fontFamily: skyFont.strong, fontSize: 16, color: disabled ? '#8A949B' : white ? SKY.blueDark : '#FFFFFF' }}>{label}</Text>
    </Pressable>
  );
}

export function QuizStep({ content, onComplete }: QuizStepProps) {
  const { t } = useTranslation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const currentQuestion = content.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === content.questions.length - 1;
  const isCorrect = selectedAnswer === currentQuestion.correct_answer;

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    setShowResult(true);
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      fx.onCorrect();
    } else {
      fx.onWrong();
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Calculate final score
      const finalCorrect = correctAnswers + (isCorrect ? 1 : 0);
      const score = Math.round((finalCorrect / content.questions.length) * 100);
      onComplete(score);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setCorrectAnswers(0);
  };

  const stateOf = (index: number): ChoiceState => {
    const picked = selectedAnswer === index;
    const right = index === currentQuestion.correct_answer;
    if (showResult) {
      if (right) return 'correct';
      if (picked) return 'wrong';
      return 'idle';
    }
    return picked ? 'selected' : 'idle';
  };

  const footer = !showResult ? (
    <Btn label={t('lesson.feedback.check')} onPress={handleSubmit} disabled={selectedAnswer === null} />
  ) : (
    <View style={{ gap: 10 }}>
      <Btn label={isLastQuestion ? t('lesson.feedback.finish') : t('lesson.feedback.next')} onPress={handleNext} />
      {!isCorrect && <Btn tone="white" label={t('lesson.retry_quiz')} onPress={handleRetry} />}
    </View>
  );

  return (
    <SkyStepLayout footer={footer}>
      <View style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontFamily: skyFont.bold, fontSize: 13, color: SKY.muted }}>
            {t('lesson.question_n_of', { n: currentQuestionIndex + 1, total: content.questions.length })}
          </Text>
          <Text style={{ fontFamily: skyFont.strong, fontSize: 13, color: SKY.blueDark }}>
            {t('lesson.correct_count', { n: correctAnswers })}
          </Text>
        </View>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: SKY.line, overflow: 'hidden' }}>
          <View style={{ height: '100%', borderRadius: 5, backgroundColor: SKY.blue, width: `${((currentQuestionIndex + 1) / content.questions.length) * 100}%` }} />
        </View>
      </View>

      <SkyCard>
        <Text style={{ fontFamily: skyFont.title, fontSize: 21, lineHeight: 28, color: SKY.ink }}>{currentQuestion.question}</Text>
      </SkyCard>

      <View style={{ gap: 12 }}>
        {currentQuestion.options.map((option, index) => (
          <SkyOption
            key={index}
            label={option}
            badge={String.fromCharCode(65 + index)}
            disabled={showResult}
            onPress={() => setSelectedAnswer(index)}
            state={stateOf(index)}
          />
        ))}
      </View>

      {showResult && (
        <View
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 20,
            backgroundColor: isCorrect ? '#E9FBEF' : '#FFECEC',
            borderWidth: 1.5,
            borderColor: isCorrect ? '#BDEFCB' : '#FFC9CC',
          }}
        >
          <Text style={{ fontFamily: skyFont.title, fontSize: 18, color: isCorrect ? '#1E7A3A' : '#B4232A' }}>
            {isCorrect ? t('lesson.feedback.correct') : t('lesson.feedback.incorrect')}
          </Text>
          {currentQuestion.explanation ? (
            <Text style={{ fontFamily: skyFont.medium, fontSize: 14, lineHeight: 20, color: isCorrect ? '#1E7A3A' : '#B4232A', marginTop: 4 }}>
              {currentQuestion.explanation}
            </Text>
          ) : null}
        </View>
      )}
    </SkyStepLayout>
  );
}
