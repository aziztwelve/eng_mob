import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Check, ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useBulkCreateFlashcards } from '@/hooks/use-flashcards';

export interface WordSelectionCandidate {
  vocabulary_id: string;
  word: string;
  translation: string;
  transcription?: string;
  definition?: string;
  example_sentence?: string;
}

interface WordSelectionStepProps {
  candidates: WordSelectionCandidate[];
  source: 'lesson' | 'bank';
  onDone: () => void;
  onSkip: () => void;
  onBack?: () => void;
}

export function WordSelectionStep({ candidates, source, onDone, onSkip, onBack }: WordSelectionStepProps) {
  const { t } = useTranslation();
  const add = useBulkCreateFlashcards();
  const [selected, setSelected] = useState<Set<string>>(() => new Set(candidates.map((item) => item.vocabulary_id)));

  const selectedItems = useMemo(
    () => candidates.filter((item) => selected.has(item.vocabulary_id)),
    [candidates, selected],
  );

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async () => {
    if (!selectedItems.length) {
      onDone();
      return;
    }
    await add.mutateAsync({
      items: selectedItems.map((item) => ({
        word: item.word,
        translation: item.translation,
        language: 'en',
        target_language: 'ru',
        source,
        vocabulary_id: item.vocabulary_id,
        transcription: item.transcription,
        definition: item.definition,
        example_sentence: item.example_sentence,
      })),
    });
    onDone();
  };

  if (!candidates.length) {
    return (
      <View className="flex-1 bg-[#E8F7FF] px-6 py-10 justify-center">
        <Text className="text-center text-[#152F60] font-nunito-extrabold text-2xl">{t('words.selection_empty')}</Text>
        <Pressable onPress={onDone} className="mt-6 rounded-2xl bg-[#2FA8E6] p-4 items-center">
          <Text className="text-white font-nunito-extrabold text-lg">{t('common.continue')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#E8F7FF] px-5 pt-10">
      <View className="flex-row items-center gap-3">
        {onBack ? <Pressable onPress={onBack} hitSlop={10}><ChevronLeft size={28} color="#152F60" /></Pressable> : null}
        <View className="flex-1">
          <Text className="text-[#152F60] font-nunito-extrabold text-2xl">{t('words.selection_title')}</Text>
          <Text className="text-[#5E7180] font-nunito-semibold mt-1">{t('words.selection_subtitle')}</Text>
        </View>
        <Text className="text-[#2FA8E6] font-nunito-extrabold">16 / 16</Text>
      </View>

      <ScrollView className="mt-5" contentContainerStyle={{ gap: 10, paddingBottom: 160 }}>
        {candidates.map((item) => {
          const isSelected = selected.has(item.vocabulary_id);
          return (
            <Pressable
              key={item.vocabulary_id}
              onPress={() => toggle(item.vocabulary_id)}
              className={`rounded-2xl border-2 p-4 flex-row items-center gap-3 ${isSelected ? 'bg-white border-[#2FA8E6]' : 'bg-white/70 border-[#C9E6F4]'}`}
            >
              <View className={`w-7 h-7 rounded-lg items-center justify-center ${isSelected ? 'bg-[#2FA8E6]' : 'bg-white border-2 border-[#C9E6F4]'}`}>
                {isSelected ? <Check size={18} color="#fff" strokeWidth={3} /> : null}
              </View>
              <View className="flex-1">
                <Text className="text-[#152F60] font-nunito-extrabold text-lg">{item.word}</Text>
                <Text className="text-[#5E7180] font-nunito-semibold">{item.translation}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="absolute left-5 right-5 bottom-7 gap-2">
        <Pressable disabled={add.isPending} onPress={() => void submit()} className="rounded-2xl bg-[#2FA8E6] p-4 items-center">
          {add.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-nunito-extrabold text-lg">{t('words.add_selected', { count: selected.size })}</Text>}
        </Pressable>
        <Pressable disabled={add.isPending} onPress={onSkip} className="items-center p-2">
          <Text className="text-[#5E7180] font-nunito-bold">{t('words.skip_selection')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function selectionCandidatesFromSteps(steps: { content: string }[]): WordSelectionCandidate[] {
  const result: WordSelectionCandidate[] = [];
  const seen = new Set<string>();
  const add = (raw: unknown) => {
    if (!raw || typeof raw !== 'object') return;
    const value = raw as Record<string, unknown>;
    const id = String(value.vocabulary_id ?? value.id ?? '');
    if (!id || seen.has(id)) return;
    const word = String(value.word ?? value.left ?? value.text ?? value.source_text ?? '');
    const translation = String(value.translation ?? value.right ?? value.correct_translation ?? value.meaning ?? '');
    if (!word || !translation) return;
    seen.add(id);
    result.push({ vocabulary_id: id, word, translation, transcription: typeof value.transcription === 'string' ? value.transcription : undefined });
  };
  for (const step of steps) {
    try {
      const content = JSON.parse(step.content) as Record<string, unknown>;
      add(content);
      if (Array.isArray(content.pairs)) content.pairs.forEach(add);
      if (Array.isArray(content.options)) content.options.filter((item) => (item as Record<string, unknown>)?.is_correct).forEach(add);
    } catch {
      // A legacy step without JSON vocabulary content is ignored.
    }
  }
  return result;
}
