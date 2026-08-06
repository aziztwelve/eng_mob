import { ScrollView, Text, View } from 'react-native';
import { ActivityContent } from '@/types/api';

interface ActivityStepProps {
  content: ActivityContent;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    : [];
}

function value(record: Record<string, unknown>, key: string): string | null {
  return typeof record[key] === 'string' ? record[key] : null;
}

export function ActivityStep({ content }: ActivityStepProps) {
  const body = content.content ?? {};
  const prompt = value(body, 'prompt') ?? value(body, 'story') ?? value(body, 'script') ?? value(body, 'task');
  const models = strings(body.models).concat(strings(body.frames));
  const phrases = strings(body.required_phrases);
  const vocabulary = records(body.items);
  const dialogue = records(body.dialogue);

  return (
    <ScrollView className="flex-1 px-5 py-4" contentContainerClassName="gap-4 pb-8">
      <View className="rounded-3xl border border-white/15 bg-white/10 p-5">
        <Text className="text-xs font-bold uppercase tracking-wider text-[#ffdf5e]">
          {content.activity_type.replaceAll('_', ' ')}
        </Text>
        <Text className="mt-2 text-lg font-black text-white">{content.instructions}</Text>
        {content.estimated_seconds > 0 && (
          <Text className="mt-3 text-sm text-white/60">About {content.estimated_seconds} seconds</Text>
        )}
      </View>

      {prompt && (
        <View className="rounded-3xl bg-[#1b3056] p-5">
          <Text className="text-base leading-6 text-white">{prompt}</Text>
        </View>
      )}

      {vocabulary.length > 0 && (
        <View className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <Text className="mb-3 text-base font-black text-white">Key words</Text>
          {vocabulary.map((item, index) => (
            <Text key={`${value(item, 'word') ?? index}`} className="mb-2 text-base text-white/80">
              {value(item, 'word') ?? value(item, 'prompt') ?? ''}
            </Text>
          ))}
        </View>
      )}

      {models.length > 0 && (
        <View className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <Text className="mb-3 text-base font-black text-white">Say it</Text>
          {models.map((model) => (
            <Text key={model} className="mb-2 text-base text-white/80">{model}</Text>
          ))}
        </View>
      )}

      {dialogue.length > 0 && (
        <View className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <Text className="mb-3 text-base font-black text-white">Conversation</Text>
          {dialogue.map((line, index) => (
            <Text key={`${value(line, 'speaker') ?? index}-${value(line, 'text') ?? ''}`} className="mb-2 text-base text-white/80">
              {value(line, 'speaker') ? `${value(line, 'speaker')}: ` : ''}{value(line, 'text') ?? ''}
            </Text>
          ))}
        </View>
      )}

      {phrases.length > 0 && (
        <View className="rounded-3xl border border-[#ffdf5e]/30 bg-[#ffdf5e]/10 p-5">
          <Text className="mb-3 text-base font-black text-[#ffdf5e]">Mission phrases</Text>
          {phrases.map((phrase) => (
            <Text key={phrase} className="mb-2 text-base text-white">{phrase}</Text>
          ))}
        </View>
      )}

      {content.success_criteria.length > 0 && (
        <View className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <Text className="mb-3 text-base font-black text-white">Your goal</Text>
          {content.success_criteria.map((criterion) => (
            <Text key={criterion} className="mb-2 text-sm leading-5 text-white/70">- {criterion}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
