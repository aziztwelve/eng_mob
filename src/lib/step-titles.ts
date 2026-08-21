const TITLES = {
  video: { ru: 'Видео', en: 'Video', kk: 'Бейне' },
  text: { ru: 'Теория', en: 'Theory', kk: 'Теория' },
  quiz: { ru: 'Проверка знаний', en: 'Knowledge check', kk: 'Білімді тексеру' },
  translate: { ru: 'Переведите фразу', en: 'Translate the phrase', kk: 'Сөйлемді аударыңыз' },
  match_pairs: { ru: 'Соедините пары', en: 'Match the pairs', kk: 'Жұптарды сәйкестендіріңіз' },
  listening: { ru: 'Аудирование', en: 'Listening', kk: 'Тыңдау' },
  fill_blank: { ru: 'Заполните пропуск', en: 'Fill the blank', kk: 'Бос орынды толтырыңыз' },
  tap_words: { ru: 'Соберите фразу', en: 'Build the phrase', kk: 'Сөйлем құрастырыңыз' },
  story: { ru: 'История', en: 'Story', kk: 'Оқиға' },
  choose_definition: { ru: 'Выберите определение', en: 'Choose the definition', kk: 'Анықтаманы таңдаңыз' },
  listen_choose_word: { ru: 'Услышьте пропущенное слово', en: 'Listen for the missing word', kk: 'Қалып қойған сөзді тыңдаңыз' },
  missing_word: { ru: 'Пропущенное слово', en: 'The Missing Word', kk: 'Қалып қойған сөз' },
  complete_chat: { ru: 'Завершите диалог', en: 'Complete the chat', kk: 'Диалогті аяқтаңыз' },
  task: { ru: 'Задание', en: 'Task', kk: 'Тапсырма' },
  brain_game: { ru: 'Тренировка памяти', en: 'Memory training', kk: 'Жад жаттығуы' },
  ai_writing: { ru: 'Письменное задание', en: 'Writing task', kk: 'Жазу тапсырмасы' },
  activity: { ru: 'Практика речи', en: 'Speaking practice', kk: 'Сөйлеу жаттығуы' },
} as const;

const INSTRUCTIONS = {
  video: { ru: 'Посмотрите видео.', en: 'Watch the video.', kk: 'Бейнені қараңыз.' },
  text: { ru: 'Прочитайте материал.', en: 'Read the material.', kk: 'Материалды оқыңыз.' },
  quiz: { ru: 'Выберите правильный ответ.', en: 'Choose the correct answer.', kk: 'Дұрыс жауапты таңдаңыз.' },
  translate: { ru: 'Переведите фразу.', en: 'Translate the phrase.', kk: 'Сөйлемді аударыңыз.' },
  match_pairs: { ru: 'Соедините пары.', en: 'Match the pairs.', kk: 'Жұптарды сәйкестендіріңіз.' },
  listening: { ru: 'Прослушайте и введите ответ.', en: 'Listen and enter the answer.', kk: 'Тыңдап, жауапты енгізіңіз.' },
  fill_blank: { ru: 'Заполните пропуск.', en: 'Fill the blank.', kk: 'Бос орынды толтырыңыз.' },
  tap_words: { ru: 'Соберите фразу из слов.', en: 'Build the phrase from the words.', kk: 'Сөздерден сөйлем құрастырыңыз.' },
  story: { ru: 'Прочитайте и выберите ответ.', en: 'Read and choose an answer.', kk: 'Оқып, жауапты таңдаңыз.' },
  choose_definition: { ru: 'Выберите правильное определение.', en: 'Choose the correct definition.', kk: 'Дұрыс анықтаманы таңдаңыз.' },
  listen_choose_word: { ru: 'Прослушайте предложение и выберите звучащее слово.', en: 'Listen to the sentence and choose the word you hear.', kk: 'Сөйлемді тыңдап, естіген сөзді таңдаңыз.' },
  missing_word: { ru: 'Допишите пропущенное слово по первым буквам.', en: 'Complete the missing word using the first letters.', kk: 'Алғашқы әріптер бойынша қалып қойған сөзді толықтырыңыз.' },
  complete_chat: { ru: 'Выберите реплику, которая завершает диалог.', en: 'Choose the reply that completes the dialogue.', kk: 'Диалогті аяқтайтын репликаны таңдаңыз.' },
  task: { ru: 'Выполните задание.', en: 'Complete the task.', kk: 'Тапсырманы орындаңыз.' },
  brain_game: { ru: 'Выполните упражнение.', en: 'Complete the exercise.', kk: 'Жаттығуды орындаңыз.' },
  ai_writing: { ru: 'Напишите ответ.', en: 'Write your answer.', kk: 'Жауабыңызды жазыңыз.' },
  activity: { ru: 'Выполните упражнение.', en: 'Complete the exercise.', kk: 'Жаттығуды орындаңыз.' },
} as const;

export function stepTitle(type: string, language: string): string {
  const title = TITLES[type as keyof typeof TITLES];
  if (!title) return type;
  return title[language === 'en' || language === 'kk' ? language : 'ru'];
}

export function stepInstruction(type: string, language: string): string {
  const instruction = INSTRUCTIONS[type as keyof typeof INSTRUCTIONS];
  if (!instruction) return '';
  return instruction[language === 'en' || language === 'kk' ? language : 'ru'];
}
