/**
 * onboarding-reactions — mapping для контекстных reaction-интерстициалов
 * в онбординге v3 (Oki-style).
 *
 * См. docs/tasks/mob/onboarding-v3-oki-style.md §3.6.
 *
 * После каждого «эмоционального» шага (speaking_situation / past_blocker /
 * future_regret / emotional_reaction / reminder_slot) показываем интерстициал
 * с маскотом Lumi и короткой персонализированной фразой. Mapping —
 * client-side, backend ничего не отдаёт.
 *
 * Структура:
 *   REACTIONS[stepKey][choiceValue] = { text, pose }
 *
 * stepKey — название поля в OnboardingState (snake_case).
 * choiceValue — конкретный enum-значение.
 *
 * Generic helper `getReaction(step, value)` возвращает запись либо null
 * (если для choice'а нет настроенного reaction — UI пропускает interstitial).
 */

import type { MascotPose } from './mascot-manifest';

export type ReactionStep =
  | 'speaking_situation'
  | 'past_blocker'
  | 'future_regret'
  | 'emotional_reaction'
  | 'reminder_slot';

export interface Reaction {
  text: string;
  pose: MascotPose;
}

export const REACTIONS: Record<ReactionStep, Record<string, Reaction>> = {
  speaking_situation: {
    freeze: {
      text: 'Для таких пауз соберём речевые стартеры — как начать, продолжить и не потеряться в ответе.',
      pose: 'thumbs_up',
    },
    translate_in_head: {
      text: 'Будем тренировать прямой ответ — без перевода в голове. Через неделю заметишь разницу.',
      pose: 'cheering',
    },
    too_short: {
      text: 'Научимся раскрывать мысль — добавим коннекторы и примеры, чтобы фразы звучали полнее.',
      pose: 'thumbs_up',
    },
    avoid: {
      text: 'Создадим безопасную среду — здесь не страшно пробовать. Ошибаться можно, это часть пути.',
      pose: 'wink',
    },
  },

  past_blocker: {
    boring: {
      text: 'Скучно у нас не будет — короткие уроки, разные форматы, история-сториз и AI-собеседник.',
      pose: 'cheering',
    },
    too_hard: {
      text: 'Подберём твой темп. Сложно — снизим уровень шага. Хочешь больше — добавим челлендж.',
      pose: 'thumbs_up',
    },
    no_progress: {
      text: 'У нас прогресс видимый: streak, XP, лиги и карта силы навыков. Будешь чувствовать, что растёшь.',
      pose: 'cheering',
    },
    no_fit: {
      text: 'Контент адаптируется под цель и интересы. Найдём то, что зацепит именно тебя.',
      pose: 'wink',
    },
    no_support: {
      text: 'Lumi всегда рядом — напомнит, объяснит, поддержит. И сообщество учеников тоже здесь.',
      pose: 'thumbs_up',
    },
  },

  future_regret: {
    stay_same: {
      text: 'Через 3 месяца ты не узнаешь себя — даже 10 минут в день дают эффект.',
      pose: 'cheering',
    },
    limit_self: {
      text: 'Язык открывает двери: вакансии, города, фильмы, друзья. Не дадим ограничивать.',
      pose: 'thumbs_up',
    },
    pressure: {
      text: 'Не дадим давлению расти. Маленькими шагами, без штрафов и без стресса.',
      pose: 'wink',
    },
    postpone: {
      text: 'Лучший момент — сейчас. Маленький первый шаг важнее идеального плана.',
      pose: 'thumbs_up',
    },
  },

  emotional_reaction: {
    lose_confidence: {
      text: 'Уверенность приходит с каждым правильным ответом. Будем замечать твои победы.',
      pose: 'cheering',
    },
    upset: {
      text: 'Бывает. Lumi не оставит наедине с разочарованием — разложим сложное на простые шаги.',
      pose: 'wink',
    },
    burnout: {
      text: 'Сделаем темп бережным — лучше регулярно по 10 минут, чем рывками до выгорания.',
      pose: 'thumbs_up',
    },
    lost: {
      text: 'Дадим тебе карту: понятный путь от «не понимаю» до «свободно общаюсь».',
      pose: 'cheering',
    },
  },

  reminder_slot: {
    morning: {
      text: 'Утренний слот — отличный выбор. Будим тебя в нужное окно, без раздражения.',
      pose: 'thumbs_up',
    },
    day: {
      text: 'Дневное окно — для перерыва между задачами. Зайдёшь — переключишься.',
      pose: 'cheering',
    },
    evening: {
      text: 'Вечером — лучшее для глубокого погружения. Подберём истории и AI-разговоры.',
      pose: 'wink',
    },
    flex: {
      text: 'Без жёстких рамок — будем напоминать тогда, когда у тебя удобнее.',
      pose: 'thumbs_up',
    },
  },
};

export function getReaction(step: ReactionStep, value: string): Reaction | null {
  return REACTIONS[step]?.[value] ?? null;
}
