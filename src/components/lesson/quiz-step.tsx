import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { QuizContent, QuizQuestion } from '@/types/api';
import { fx } from '@/lib/fx';

interface QuizStepProps {
  content: QuizContent;
  onComplete: (score: number) => void;
}

export function QuizStep({ content, onComplete }: QuizStepProps) {
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

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Progress */}
      <View className="mb-6">
        <View className="flex-row justify-between mb-2">
          <Text className="text-muted-foreground font-semibold">
            Question {currentQuestionIndex + 1} of {content.questions.length}
          </Text>
          <Text className="text-primary font-semibold">
            {correctAnswers} correct
          </Text>
        </View>
        <View className="bg-muted rounded-full h-2 overflow-hidden">
          <View 
            className="bg-primary h-full"
            style={{ width: `${((currentQuestionIndex + 1) / content.questions.length) * 100}%` }}
          />
        </View>
      </View>

      {/* Question */}
      <View className="bg-card rounded-3xl p-6 mb-6 border-4 border-border">
        <Text className="text-2xl font-bold text-foreground">
          {currentQuestion.question}
        </Text>
      </View>

      {/* Options */}
      <View className="space-y-3 mb-6">
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrectAnswer = index === currentQuestion.correct_answer;
          
          let bgColor = 'bg-card';
          let borderColor = 'border-border';
          
          if (showResult) {
            if (isCorrectAnswer) {
              bgColor = 'bg-green-500/20';
              borderColor = 'border-green-500';
            } else if (isSelected && !isCorrect) {
              bgColor = 'bg-red-500/20';
              borderColor = 'border-red-500';
            }
          } else if (isSelected) {
            bgColor = 'bg-primary/20';
            borderColor = 'border-primary';
          }

          return (
            <Pressable
              key={index}
              onPress={() => !showResult && setSelectedAnswer(index)}
              disabled={showResult}
              className={`${bgColor} ${borderColor} border-4 rounded-2xl p-4 active:scale-95`}
            >
              <View className="flex-row items-center">
                <View className={`w-8 h-8 rounded-full border-2 ${borderColor} items-center justify-center mr-3`}>
                  <Text className="font-bold text-foreground">
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text className="text-foreground font-semibold flex-1">
                  {option}
                </Text>
                {showResult && isCorrectAnswer && (
                  <Text className="text-2xl">✓</Text>
                )}
                {showResult && isSelected && !isCorrect && (
                  <Text className="text-2xl">✗</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Explanation */}
      {showResult && (
        <View className={`rounded-2xl p-4 mb-6 border-2 ${isCorrect ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}>
          <Text className={`font-bold text-lg mb-2 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
            {isCorrect ? '🎉 Correct!' : '❌ Incorrect'}
          </Text>
          <Text className="text-foreground">
            {currentQuestion.explanation}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      {!showResult ? (
        <Pressable
          onPress={handleSubmit}
          disabled={selectedAnswer === null}
          className={`rounded-3xl py-4 ${selectedAnswer === null ? 'bg-muted' : 'bg-primary'}`}
        >
          <Text className="text-center font-black text-lg uppercase tracking-wide text-primary-foreground">
            Check Answer
          </Text>
        </Pressable>
      ) : (
        <View className="space-y-3">
          <Pressable
            onPress={handleNext}
            className="bg-primary rounded-3xl py-4"
          >
            <Text className="text-center font-black text-lg uppercase tracking-wide text-primary-foreground">
              {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
            </Text>
          </Pressable>
          
          {!isCorrect && (
            <Pressable
              onPress={handleRetry}
              className="bg-card border-2 border-border rounded-3xl py-4"
            >
              <Text className="text-center font-bold text-lg text-foreground">
                Retry Quiz
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </ScrollView>
  );
}
