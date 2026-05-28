/**
 * placement-questions — pool вопросов для опционального mini-test на шаге 4 (level).
 *
 * Client-side only — backend ничего не валидирует и не хранит вопросы.
 * После теста клиент считает score и шлёт `PATCH /me/onboarding` с
 * `proficiency_level` и `placement_score`.
 *
 * Структура: 12 языков × 6-10 вопросов с прогрессией A1 → B2.
 * Каждый вопрос — multiple choice (4 опции, 1 правильная).
 *
 * Scoring algorithm (см. `use-placement.ts`):
 *   - правильных 0-1   → beginner / a1
 *   - правильных 2-3   → a1 / a2
 *   - правильных 4-5   → a2 / b1
 *   - правильных 6-7   → b1
 *   - правильных 8+    → b2
 *
 * Каждый вопрос ассоциирован с CEFR-level, который он тестирует —
 * это даёт более точный scoring (weighted by level).
 *
 * Prompts хранятся как i18n keys; реальный текст — в `src/locales/*.json`
 * под `placement.prompts.<key>`. Здесь храним только структуру pool'а.
 */

import type { CefrLevel, LanguageCode } from './supported-languages';

export interface PlacementQuestion {
  id: string;
  /** CEFR-уровень, который этот вопрос тестирует. */
  level: CefrLevel;
  /**
   * i18n-ключ для prompt'а. Реальный текст в `t('placement.prompts.<key>')`,
   * обычно вида "Выбери правильный перевод слова «cat»".
   */
  promptKey: string;
  /**
   * Опциональный контекст-слово или фраза, которая встраивается в prompt
   * (напр., target-language слово, перевод которого спрашиваем).
   * Шаблон: `t('placement.prompts.translate_to_target', { word: 'кот' })`.
   */
  promptParams?: Record<string, string>;
  /** Опции — текст на target language (или native, в зависимости от типа вопроса). */
  options: string[];
  /** Индекс правильной опции (0-based). */
  correctIndex: number;
}

/** Веса для финального score (выше уровень → больше вклад). */
export const LEVEL_WEIGHT: Record<CefrLevel, number> = {
  a1: 1,
  a2: 1.5,
  b1: 2,
  b2: 2.5,
  c1: 3,
};

/* ─────────────────────────────────────────────────────────────────────── *
 *  English (en)
 * ─────────────────────────────────────────────────────────────────────── */
const EN_QUESTIONS: PlacementQuestion[] = [
  { id: 'en-1', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'кошка' },
    options: ['dog', 'cat', 'cow', 'cup'], correctIndex: 1 },
  { id: 'en-2', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'вода' },
    options: ['fire', 'water', 'wind', 'wood'], correctIndex: 1 },
  { id: 'en-3', level: 'a1', promptKey: 'fill_blank',
    promptParams: { sentence: 'She ___ a student.' },
    options: ['am', 'is', 'are', 'be'], correctIndex: 1 },
  { id: 'en-4', level: 'a2', promptKey: 'fill_blank',
    promptParams: { sentence: 'I ___ to school yesterday.' },
    options: ['go', 'goes', 'went', 'gone'], correctIndex: 2 },
  { id: 'en-5', level: 'a2', promptKey: 'translate_to_target',
    promptParams: { word: 'часто' },
    options: ['rarely', 'often', 'never', 'seldom'], correctIndex: 1 },
  { id: 'en-6', level: 'b1', promptKey: 'fill_blank',
    promptParams: { sentence: 'If I ___ rich, I would travel a lot.' },
    options: ['am', 'was', 'were', 'be'], correctIndex: 2 },
  { id: 'en-7', level: 'b1', promptKey: 'pick_meaning',
    promptParams: { word: 'reluctant' },
    options: ['eager', 'unwilling', 'tired', 'happy'], correctIndex: 1 },
  { id: 'en-8', level: 'b2', promptKey: 'fill_blank',
    promptParams: { sentence: 'She suggested ___ a new approach.' },
    options: ['to try', 'trying', 'try', 'tried'], correctIndex: 1 },
  { id: 'en-9', level: 'b2', promptKey: 'pick_meaning',
    promptParams: { word: 'to dwell on' },
    options: ['to forget', 'to think too much about', 'to enjoy', 'to share'],
    correctIndex: 1 },
  { id: 'en-10', level: 'b2', promptKey: 'fill_blank',
    promptParams: { sentence: 'Had I known, I ___ have come earlier.' },
    options: ['will', 'would', 'should', 'might'], correctIndex: 1 },
];

/* ─────────────────────────────────────────────────────────────────────── *
 *  Spanish (es)
 * ─────────────────────────────────────────────────────────────────────── */
const ES_QUESTIONS: PlacementQuestion[] = [
  { id: 'es-1', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'привет' },
    options: ['adiós', 'hola', 'gracias', 'por favor'], correctIndex: 1 },
  { id: 'es-2', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'дом' },
    options: ['coche', 'casa', 'gato', 'comida'], correctIndex: 1 },
  { id: 'es-3', level: 'a1', promptKey: 'fill_blank',
    promptParams: { sentence: 'Yo ___ español.' },
    options: ['habla', 'hablas', 'hablo', 'hablan'], correctIndex: 2 },
  { id: 'es-4', level: 'a2', promptKey: 'fill_blank',
    promptParams: { sentence: 'Ayer ___ al mercado.' },
    options: ['voy', 'fui', 'iré', 'iba'], correctIndex: 1 },
  { id: 'es-5', level: 'b1', promptKey: 'fill_blank',
    promptParams: { sentence: 'Si tuviera dinero, ___ a Madrid.' },
    options: ['viajo', 'viajaré', 'viajaría', 'viajaba'], correctIndex: 2 },
  { id: 'es-6', level: 'b1', promptKey: 'pick_meaning',
    promptParams: { word: 'imprescindible' },
    options: ['opcional', 'esencial', 'difícil', 'lejano'], correctIndex: 1 },
  { id: 'es-7', level: 'b2', promptKey: 'fill_blank',
    promptParams: { sentence: 'No creo que ___ posible.' },
    options: ['es', 'sea', 'está', 'siendo'], correctIndex: 1 },
  { id: 'es-8', level: 'b2', promptKey: 'pick_meaning',
    promptParams: { word: 'aprovecharse' },
    options: ['perder', 'sacar partido', 'reírse', 'olvidar'], correctIndex: 1 },
];

/* ─────────────────────────────────────────────────────────────────────── *
 *  German (de)
 * ─────────────────────────────────────────────────────────────────────── */
const DE_QUESTIONS: PlacementQuestion[] = [
  { id: 'de-1', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'спасибо' },
    options: ['bitte', 'danke', 'hallo', 'tschüss'], correctIndex: 1 },
  { id: 'de-2', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'хлеб' },
    options: ['Wasser', 'Brot', 'Käse', 'Milch'], correctIndex: 1 },
  { id: 'de-3', level: 'a1', promptKey: 'fill_blank',
    promptParams: { sentence: 'Ich ___ aus Russland.' },
    options: ['bist', 'bin', 'ist', 'sind'], correctIndex: 1 },
  { id: 'de-4', level: 'a2', promptKey: 'fill_blank',
    promptParams: { sentence: 'Ich ___ gestern ins Kino gegangen.' },
    options: ['habe', 'bin', 'war', 'werde'], correctIndex: 1 },
  { id: 'de-5', level: 'b1', promptKey: 'fill_blank',
    promptParams: { sentence: 'Wenn ich Zeit ___, würde ich kommen.' },
    options: ['habe', 'hätte', 'hatte', 'haben'], correctIndex: 1 },
  { id: 'de-6', level: 'b1', promptKey: 'pick_meaning',
    promptParams: { word: 'verzichten' },
    options: ['versuchen', 'aufgeben', 'fordern', 'verstehen'], correctIndex: 1 },
  { id: 'de-7', level: 'b2', promptKey: 'fill_blank',
    promptParams: { sentence: 'Das Buch, ___ ich gelesen habe, war spannend.' },
    options: ['der', 'die', 'das', 'dem'], correctIndex: 2 },
  { id: 'de-8', level: 'b2', promptKey: 'pick_meaning',
    promptParams: { word: 'gleichgültig' },
    options: ['begeistert', 'egal', 'wichtig', 'traurig'], correctIndex: 1 },
];

/* ─────────────────────────────────────────────────────────────────────── *
 *  French (fr)
 * ─────────────────────────────────────────────────────────────────────── */
const FR_QUESTIONS: PlacementQuestion[] = [
  { id: 'fr-1', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'привет' },
    options: ['au revoir', 'bonjour', 'merci', 's\'il vous plaît'], correctIndex: 1 },
  { id: 'fr-2', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'книга' },
    options: ['lit', 'livre', 'lampe', 'lune'], correctIndex: 1 },
  { id: 'fr-3', level: 'a1', promptKey: 'fill_blank',
    promptParams: { sentence: 'Je ___ étudiant.' },
    options: ['es', 'suis', 'est', 'sommes'], correctIndex: 1 },
  { id: 'fr-4', level: 'a2', promptKey: 'fill_blank',
    promptParams: { sentence: 'Hier, j\'___ au cinéma.' },
    options: ['vais', 'suis allé', 'irai', 'aller'], correctIndex: 1 },
  { id: 'fr-5', level: 'b1', promptKey: 'fill_blank',
    promptParams: { sentence: 'Si j\'avais le temps, je ___.' },
    options: ['viens', 'viendrai', 'viendrais', 'venais'], correctIndex: 2 },
  { id: 'fr-6', level: 'b1', promptKey: 'pick_meaning',
    promptParams: { word: 'aussitôt' },
    options: ['plus tard', 'immédiatement', 'presque', 'autrefois'], correctIndex: 1 },
  { id: 'fr-7', level: 'b2', promptKey: 'fill_blank',
    promptParams: { sentence: 'Je veux qu\'il ___ heureux.' },
    options: ['est', 'soit', 'sera', 'était'], correctIndex: 1 },
  { id: 'fr-8', level: 'b2', promptKey: 'pick_meaning',
    promptParams: { word: 'davantage' },
    options: ['moins', 'plus', 'parfois', 'jamais'], correctIndex: 1 },
];

/* ─────────────────────────────────────────────────────────────────────── *
 *  Italian (it)
 * ─────────────────────────────────────────────────────────────────────── */
const IT_QUESTIONS: PlacementQuestion[] = [
  { id: 'it-1', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'привет' },
    options: ['arrivederci', 'ciao', 'grazie', 'prego'], correctIndex: 1 },
  { id: 'it-2', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'вода' },
    options: ['vino', 'acqua', 'pane', 'latte'], correctIndex: 1 },
  { id: 'it-3', level: 'a1', promptKey: 'fill_blank',
    promptParams: { sentence: 'Io ___ italiano.' },
    options: ['parla', 'parli', 'parlo', 'parliamo'], correctIndex: 2 },
  { id: 'it-4', level: 'a2', promptKey: 'fill_blank',
    promptParams: { sentence: 'Ieri ___ al ristorante.' },
    options: ['vado', 'sono andato', 'andrò', 'andavo'], correctIndex: 1 },
  { id: 'it-5', level: 'b1', promptKey: 'fill_blank',
    promptParams: { sentence: 'Se avessi tempo, ___ con te.' },
    options: ['vengo', 'verrò', 'verrei', 'venivo'], correctIndex: 2 },
  { id: 'it-6', level: 'b1', promptKey: 'pick_meaning',
    promptParams: { word: 'magari' },
    options: ['mai', 'forse', 'sempre', 'subito'], correctIndex: 1 },
  { id: 'it-7', level: 'b2', promptKey: 'fill_blank',
    promptParams: { sentence: 'Spero che ___ presto.' },
    options: ['arriva', 'arrivi', 'arriverà', 'arrivava'], correctIndex: 1 },
];

/* ─────────────────────────────────────────────────────────────────────── *
 *  Portuguese (pt)
 * ─────────────────────────────────────────────────────────────────────── */
const PT_QUESTIONS: PlacementQuestion[] = [
  { id: 'pt-1', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'спасибо' },
    options: ['olá', 'obrigado', 'tchau', 'por favor'], correctIndex: 1 },
  { id: 'pt-2', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'дом' },
    options: ['carro', 'casa', 'cão', 'comida'], correctIndex: 1 },
  { id: 'pt-3', level: 'a1', promptKey: 'fill_blank',
    promptParams: { sentence: 'Eu ___ português.' },
    options: ['fala', 'falo', 'falas', 'falam'], correctIndex: 1 },
  { id: 'pt-4', level: 'a2', promptKey: 'fill_blank',
    promptParams: { sentence: 'Ontem eu ___ ao mercado.' },
    options: ['vou', 'fui', 'irei', 'ia'], correctIndex: 1 },
  { id: 'pt-5', level: 'b1', promptKey: 'fill_blank',
    promptParams: { sentence: 'Se eu tivesse dinheiro, ___ para o Brasil.' },
    options: ['viajo', 'viajarei', 'viajaria', 'viajava'], correctIndex: 2 },
  { id: 'pt-6', level: 'b1', promptKey: 'pick_meaning',
    promptParams: { word: 'aliás' },
    options: ['nunca', 'aliás (de fato)', 'talvez', 'depois'], correctIndex: 1 },
  { id: 'pt-7', level: 'b2', promptKey: 'fill_blank',
    promptParams: { sentence: 'Espero que ele ___ logo.' },
    options: ['chega', 'chegue', 'chegará', 'chegava'], correctIndex: 1 },
];

/* ─────────────────────────────────────────────────────────────────────── *
 *  Japanese (ja)  — romaji-based для простоты в MVP
 * ─────────────────────────────────────────────────────────────────────── */
const JA_QUESTIONS: PlacementQuestion[] = [
  { id: 'ja-1', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'привет' },
    options: ['さようなら', 'こんにちは', 'ありがとう', 'すみません'], correctIndex: 1 },
  { id: 'ja-2', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'вода' },
    options: ['火 (hi)', '水 (mizu)', '木 (ki)', '土 (tsuchi)'], correctIndex: 1 },
  { id: 'ja-3', level: 'a1', promptKey: 'fill_blank',
    promptParams: { sentence: '私 ___ 学生です。' },
    options: ['を', 'は', 'に', 'が'], correctIndex: 1 },
  { id: 'ja-4', level: 'a2', promptKey: 'fill_blank',
    promptParams: { sentence: '昨日、映画 ___ 見ました。' },
    options: ['は', 'を', 'に', 'で'], correctIndex: 1 },
  { id: 'ja-5', level: 'b1', promptKey: 'pick_meaning',
    promptParams: { word: 'たぶん' },
    options: ['никогда', 'может быть', 'всегда', 'сейчас'], correctIndex: 1 },
  { id: 'ja-6', level: 'b1', promptKey: 'fill_blank',
    promptParams: { sentence: '日本語 ___ 話せます。' },
    options: ['は', 'を', 'が', 'に'], correctIndex: 2 },
  { id: 'ja-7', level: 'b2', promptKey: 'fill_blank',
    promptParams: { sentence: '雨 ___ 降れば、行きません。' },
    options: ['は', 'が', 'を', 'に'], correctIndex: 1 },
];

/* ─────────────────────────────────────────────────────────────────────── *
 *  Chinese (zh) — Simplified
 * ─────────────────────────────────────────────────────────────────────── */
const ZH_QUESTIONS: PlacementQuestion[] = [
  { id: 'zh-1', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'привет' },
    options: ['再见', '你好', '谢谢', '不客气'], correctIndex: 1 },
  { id: 'zh-2', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'я' },
    options: ['你', '我', '他', '她'], correctIndex: 1 },
  { id: 'zh-3', level: 'a1', promptKey: 'fill_blank',
    promptParams: { sentence: '我 ___ 学生。' },
    options: ['有', '是', '在', '去'], correctIndex: 1 },
  { id: 'zh-4', level: 'a2', promptKey: 'fill_blank',
    promptParams: { sentence: '我昨天 ___ 北京。' },
    options: ['去了', '去', '会去', '想去'], correctIndex: 0 },
  { id: 'zh-5', level: 'b1', promptKey: 'pick_meaning',
    promptParams: { word: '其实' },
    options: ['потом', 'на самом деле', 'никогда', 'обычно'], correctIndex: 1 },
  { id: 'zh-6', level: 'b1', promptKey: 'fill_blank',
    promptParams: { sentence: '我 ___ 喝咖啡 ___ 喝茶。' },
    options: ['是…的', '不是…就是', '又…又', '虽然…但是'], correctIndex: 1 },
  { id: 'zh-7', level: 'b2', promptKey: 'pick_meaning',
    promptParams: { word: '尽管' },
    options: ['потому что', 'несмотря на', 'если', 'когда'], correctIndex: 1 },
];

/* ─────────────────────────────────────────────────────────────────────── *
 *  Korean (ko)
 * ─────────────────────────────────────────────────────────────────────── */
const KO_QUESTIONS: PlacementQuestion[] = [
  { id: 'ko-1', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'привет' },
    options: ['안녕히 가세요', '안녕하세요', '감사합니다', '미안합니다'], correctIndex: 1 },
  { id: 'ko-2', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'вода' },
    options: ['불', '물', '밥', '집'], correctIndex: 1 },
  { id: 'ko-3', level: 'a1', promptKey: 'fill_blank',
    promptParams: { sentence: '저 ___ 학생입니다.' },
    options: ['은', '는', '이', '가'], correctIndex: 1 },
  { id: 'ko-4', level: 'a2', promptKey: 'fill_blank',
    promptParams: { sentence: '어제 영화 ___ 봤어요.' },
    options: ['이', '를', '에', '에서'], correctIndex: 1 },
  { id: 'ko-5', level: 'b1', promptKey: 'fill_blank',
    promptParams: { sentence: '비가 ___ 안 갈 거예요.' },
    options: ['오고', '오면', '와서', '와도'], correctIndex: 1 },
  { id: 'ko-6', level: 'b1', promptKey: 'pick_meaning',
    promptParams: { word: '아마' },
    options: ['никогда', 'может быть', 'сейчас', 'часто'], correctIndex: 1 },
];

/* ─────────────────────────────────────────────────────────────────────── *
 *  Russian (ru)
 * ─────────────────────────────────────────────────────────────────────── */
const RU_QUESTIONS: PlacementQuestion[] = [
  { id: 'ru-1', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'hello' },
    options: ['пока', 'привет', 'спасибо', 'пожалуйста'], correctIndex: 1 },
  { id: 'ru-2', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'water' },
    options: ['огонь', 'вода', 'хлеб', 'дом'], correctIndex: 1 },
  { id: 'ru-3', level: 'a1', promptKey: 'fill_blank',
    promptParams: { sentence: 'Я ___ студент.' },
    options: ['есть', '(пусто)', 'был', 'буду'], correctIndex: 1 },
  { id: 'ru-4', level: 'a2', promptKey: 'fill_blank',
    promptParams: { sentence: 'Вчера я ___ в кино.' },
    options: ['иду', 'пошёл', 'пойду', 'идти'], correctIndex: 1 },
  { id: 'ru-5', level: 'b1', promptKey: 'fill_blank',
    promptParams: { sentence: 'Если бы у меня было время, я ___ пришёл.' },
    options: ['буду', 'был', 'бы', 'есть'], correctIndex: 2 },
  { id: 'ru-6', level: 'b1', promptKey: 'pick_meaning',
    promptParams: { word: 'довольно' },
    options: ['немного', 'весьма', 'никогда', 'тихо'], correctIndex: 1 },
  { id: 'ru-7', level: 'b2', promptKey: 'fill_blank',
    promptParams: { sentence: 'Несмотря на дождь, мы ___ гулять.' },
    options: ['пошли', 'не пошли', 'идём', 'шли'], correctIndex: 0 },
];

/* ─────────────────────────────────────────────────────────────────────── *
 *  Kazakh (kk)
 * ─────────────────────────────────────────────────────────────────────── */
const KK_QUESTIONS: PlacementQuestion[] = [
  { id: 'kk-1', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'привет' },
    options: ['сау бол', 'сәлем', 'рахмет', 'кешіріңіз'], correctIndex: 1 },
  { id: 'kk-2', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'вода' },
    options: ['от', 'су', 'нан', 'үй'], correctIndex: 1 },
  { id: 'kk-3', level: 'a1', promptKey: 'fill_blank',
    promptParams: { sentence: 'Мен студент ___ .' },
    options: ['емес', 'екенмін', 'болдым', 'емін'], correctIndex: 3 },
  { id: 'kk-4', level: 'a2', promptKey: 'fill_blank',
    promptParams: { sentence: 'Кеше мен киноға ___ .' },
    options: ['барамын', 'бардым', 'барған', 'барады'], correctIndex: 1 },
  { id: 'kk-5', level: 'b1', promptKey: 'pick_meaning',
    promptParams: { word: 'әрине' },
    options: ['никогда', 'конечно', 'может быть', 'иногда'], correctIndex: 1 },
  { id: 'kk-6', level: 'b1', promptKey: 'fill_blank',
    promptParams: { sentence: 'Уақыт болса, мен ___ .' },
    options: ['келдім', 'келемін', 'келер едім', 'келген'], correctIndex: 2 },
];

/* ─────────────────────────────────────────────────────────────────────── *
 *  Arabic (ar) — RTL
 * ─────────────────────────────────────────────────────────────────────── */
const AR_QUESTIONS: PlacementQuestion[] = [
  { id: 'ar-1', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'привет' },
    options: ['وداعا', 'مرحبا', 'شكرا', 'من فضلك'], correctIndex: 1 },
  { id: 'ar-2', level: 'a1', promptKey: 'translate_to_target',
    promptParams: { word: 'вода' },
    options: ['نار', 'ماء', 'خبز', 'بيت'], correctIndex: 1 },
  { id: 'ar-3', level: 'a1', promptKey: 'fill_blank',
    promptParams: { sentence: 'أنا ___ طالب.' },
    options: ['هو', '(пусто)', 'هي', 'أنت'], correctIndex: 1 },
  { id: 'ar-4', level: 'a2', promptKey: 'fill_blank',
    promptParams: { sentence: 'أمس ___ إلى السوق.' },
    options: ['أذهب', 'ذهبت', 'سأذهب', 'يذهب'], correctIndex: 1 },
  { id: 'ar-5', level: 'b1', promptKey: 'pick_meaning',
    promptParams: { word: 'ربما' },
    options: ['никогда', 'может быть', 'всегда', 'сейчас'], correctIndex: 1 },
  { id: 'ar-6', level: 'b1', promptKey: 'fill_blank',
    promptParams: { sentence: 'لو كان عندي وقت، ___ معك.' },
    options: ['أذهب', 'سأذهب', 'لذهبت', 'ذاهب'], correctIndex: 2 },
];

/* ─────────────────────────────────────────────────────────────────────── *
 *  Registry
 * ─────────────────────────────────────────────────────────────────────── */
export const PLACEMENT_POOL: Record<LanguageCode, PlacementQuestion[]> = {
  en: EN_QUESTIONS,
  es: ES_QUESTIONS,
  de: DE_QUESTIONS,
  fr: FR_QUESTIONS,
  it: IT_QUESTIONS,
  pt: PT_QUESTIONS,
  ja: JA_QUESTIONS,
  zh: ZH_QUESTIONS,
  ko: KO_QUESTIONS,
  ru: RU_QUESTIONS,
  kk: KK_QUESTIONS,
  ar: AR_QUESTIONS,
  // extra (no questions yet):
  tr: [],
  nl: [],
  pl: [],
};

export function getPlacementQuestions(lang: string, count = 6): PlacementQuestion[] {
  const pool = PLACEMENT_POOL[lang as LanguageCode];
  if (!pool || pool.length === 0) return [];
  // Берём вопросы с прогрессией: 2×a1, 2×a2, 2×b1, остальные b2.
  // Если pool меньше — отдаём как есть.
  if (pool.length <= count) return pool;
  const byLevel: Record<CefrLevel, PlacementQuestion[]> = {
    a1: [], a2: [], b1: [], b2: [], c1: [],
  };
  for (const q of pool) byLevel[q.level].push(q);
  const desired: CefrLevel[] = ['a1', 'a1', 'a2', 'a2', 'b1', 'b1', 'b2', 'b2', 'c1', 'c1'];
  const out: PlacementQuestion[] = [];
  for (const lvl of desired.slice(0, count)) {
    const next = byLevel[lvl].shift();
    if (next) out.push(next);
  }
  // Заполнить остаток, если по уровням не хватило.
  if (out.length < count) {
    for (const q of pool) {
      if (out.length >= count) break;
      if (!out.includes(q)) out.push(q);
    }
  }
  return out;
}

/**
 * Score → CEFR mapping.
 * Используем weighted score: сумма LEVEL_WEIGHT для правильных ответов / общая возможная.
 */
export function scoreToLevel(
  questions: PlacementQuestion[],
  correctIds: string[],
): { level: 'beginner' | 'a1' | 'a2' | 'b1' | 'b2'; score: number } {
  if (questions.length === 0) return { level: 'beginner', score: 0 };
  const totalWeight = questions.reduce((s, q) => s + LEVEL_WEIGHT[q.level], 0);
  const got = questions
    .filter((q) => correctIds.includes(q.id))
    .reduce((s, q) => s + LEVEL_WEIGHT[q.level], 0);
  const ratio = got / totalWeight;
  const score = Math.round(ratio * 5 * 10) / 10; // 0..5, one decimal
  let level: 'beginner' | 'a1' | 'a2' | 'b1' | 'b2';
  if (ratio < 0.15) level = 'beginner';
  else if (ratio < 0.35) level = 'a1';
  else if (ratio < 0.55) level = 'a2';
  else if (ratio < 0.8) level = 'b1';
  else level = 'b2';
  return { level, score };
}
