/**
 * testimonials — отзывы реальных учеников для interstitial-building карусели.
 *
 * Hard-coded, без backend. Каждый отзыв локализован под ru/en/kk
 * (имена остаются такими как написаны — не транслитерируем).
 *
 * Используется в `<TestimonialCarousel>` (см. §3 спеки v3).
 * Аватары — заглушки emoji; реальные фото добавим позже (Phase 6).
 *
 * Тоналити: краткий, конкретный, "ситуация → результат". Без штампов
 * вроде "лучшее приложение". Каждый testimonial привязан к goal-кластеру,
 * чтобы карусель можно было фильтровать (interstitial-building показывает
 * 2-3 отзыва под выбранную goal + 1-2 общих).
 */

import type { UiLanguage } from './supported-languages';

export type TestimonialGoal =
  | 'work'         // работа / карьера
  | 'business_english' // деловой английский
  | 'travel'       // путешествия
  | 'exam'         // экзамены / учёба
  | 'speaking'     // разговорная практика
  | 'listening_shadowing' // Listening & Shadowing
  | 'study';       // школа / университет

export interface Testimonial {
  id: string;
  /** Эмодзи-аватар-плейсхолдер; в Phase 6 заменим на photo URL. */
  avatarEmoji: string;
  /** Возраст для социального доказательства ("Алина, 28"). */
  age: number;
  /** 1-5; для отображения как звёзды. */
  stars: 4 | 5;
  /** К каким goal'ам релевантен этот отзыв. Используется для фильтрации. */
  goals: TestimonialGoal[];
  /** Имя — не переводится (используется как есть для всех локалей). */
  name: string;
  /** Бейдж — короткая подпись под именем (напр. "60-day streak"). */
  badge: { ru: string; en: string; kk: string };
  /** Текст отзыва, локализованный. */
  quote: { ru: string; en: string; kk: string };
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'alina-work',
    avatarEmoji: '👩‍💻',
    age: 28,
    stars: 5,
    goals: ['work'],
    name: 'Алина',
    badge: {
      ru: '60 дней подряд',
      en: '60-day streak',
      kk: '60 күн қатарынан',
    },
    quote: {
      ru: 'Через два месяца уверенно веду созвоны с зарубежной командой. Раньше пряталась за «later» в чате — теперь говорю сама.',
      en: 'After two months I confidently lead calls with our overseas team. I used to hide behind "later" in chat — now I speak up.',
      kk: 'Екі айдан кейін шетелдік командамен сенімді сөйлесемін. Бұрын «later» деп жасырынатынмын — қазір өзім сөйлеймін.',
    },
  },
  {
    id: 'damir-travel',
    avatarEmoji: '🧑‍🎒',
    age: 24,
    stars: 5,
    goals: ['travel'],
    name: 'Дамир',
    badge: {
      ru: 'Учусь 4 месяца',
      en: 'Learning for 4 months',
      kk: '4 ай оқып жүрмін',
    },
    quote: {
      ru: 'Слетал в Барселону без переводчика. Заказывал кофе, болтал с барменом и понял, что мой испанский живой.',
      en: 'Went to Barcelona without a translator app. Ordered coffee, chatted with the bartender — my Spanish is actually alive.',
      kk: 'Барселонаға тілмашсыз барып келдім. Кофе тапсырдым, барменмен сөйлестім — испан тілім тірі.',
    },
  },
  {
    id: 'marina-exam',
    avatarEmoji: '👩‍🎓',
    age: 19,
    stars: 5,
    goals: ['exam', 'study'],
    name: 'Марина',
    badge: {
      ru: 'IELTS 7.5',
      en: 'IELTS 7.5',
      kk: 'IELTS 7.5',
    },
    quote: {
      ru: 'Готовилась к IELTS параллельно с университетом. 15 минут утром и плюс к моему запасу — каждый день. Сдала на 7.5.',
      en: 'Prepped for IELTS while in university. 15 minutes every morning added to my vocab — every day. Got a 7.5.',
      kk: 'Университетпен қатар IELTS-ке дайындалдым. Күн сайын 15 минут — қорым өсіп отырды. 7.5 алдым.',
    },
  },
  {
    id: 'sergey-listening-shadowing',
    avatarEmoji: '🧑‍🦳',
    age: 54,
    stars: 4,
    goals: ['listening_shadowing'],
    name: 'Сергей',
    badge: {
      ru: 'Учусь после 50',
      en: 'Started after 50',
      kk: '50-ден кейін бастадым',
    },
    quote: {
      ru: 'Не думал, что мозг ещё так хорошо учится. Через 3 месяца смотрю английские лекции без субтитров — и это лучшая тренировка для головы.',
      en: 'Did not expect my brain to learn this well. Three months in I watch English lectures without subtitles — best workout for the mind.',
      kk: 'Миым осындай жақсы үйрене ала ма деп ойламадым. Үш айдан кейін ағылшын лекцияларды субтитрсіз көремін.',
    },
  },
  {
    id: 'aisulu-speaking',
    avatarEmoji: '👩‍🔬',
    age: 31,
    stars: 5,
    goals: ['speaking', 'work'],
    name: 'Айсулу',
    badge: {
      ru: 'Заговорила по-немецки',
      en: 'Started speaking German',
      kk: 'Немісше сөйлей бастадым',
    },
    quote: {
      ru: 'Сначала боялась говорить по-немецки. LingoIQ помог начать с коротких диалогов — теперь спокойно общаюсь на работе и в повседневных ситуациях.',
      en: 'At first I was afraid to speak German. LingoIQ helped me start with short dialogues — now I communicate calmly at work and in everyday situations.',
      kk: 'Алғашында немісше сөйлеуге қорқатынмын. LingoIQ қысқа диалогтардан бастауға көмектесті — қазір жұмыста да, күнделікті өмірде де еркін сөйлесемін.',
    },
  },
  {
    id: 'timur-content',
    avatarEmoji: '🎮',
    age: 17,
    stars: 5,
    goals: ['listening_shadowing'],
    name: 'Тимур',
    badge: {
      ru: 'Школьник',
      en: 'High-school student',
      kk: 'Мектеп оқушысы',
    },
    quote: {
      ru: 'Смотрю аниме без сабов и понимаю 70%. Друзья спрашивают, где учусь — теперь я тут «учитель».',
      en: 'Watch anime without subs and catch 70%. Friends keep asking where I learn — now I am the "teacher" in our group.',
      kk: 'Аниме субтитрсіз көремін, 70% түсінемін. Достарым қайда оқып жүрсің деп сұрайды.',
    },
  },
];

/**
 * Возвращает отзывы под выбранную goal: до `limit` отзывов, отсортированных
 * по релевантности (точное попадание goal первыми, потом общие).
 */
export function testimonialsForGoal(
  goal: TestimonialGoal | null,
  limit = 4,
): Testimonial[] {
  if (!goal) return TESTIMONIALS.slice(0, limit);
  const exact = TESTIMONIALS.filter((t) => t.goals.includes(goal));
  const rest = TESTIMONIALS.filter((t) => !t.goals.includes(goal));
  return [...exact, ...rest].slice(0, limit);
}

export function localizedQuote(t: Testimonial, ui: UiLanguage): string {
  return t.quote[ui] ?? t.quote.ru;
}

export function localizedBadge(t: Testimonial, ui: UiLanguage): string {
  return t.badge[ui] ?? t.badge.ru;
}
