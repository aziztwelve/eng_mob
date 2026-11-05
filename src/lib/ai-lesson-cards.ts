/** Curated lesson material. A missing entry is a lesson without a prepared card. */
export interface AILessonCard {
  objective: string;
  vocabulary: readonly string[];
  grammar: string;
  examples: readonly string[];
  exercises: readonly string[];
  practice: string;
  success: string;
}

const LESSON_CARDS: Readonly<Record<string, AILessonCard>> = {
  'B1/work/0': {
    objective: 'Introduce yourself to colleagues and ask basic questions on the first day at work.',
    vocabulary: ['colleague', 'department', 'role', 'schedule', 'team'],
    grammar: 'Use present simple for roles and routines, and polite questions with can and could.',
    examples: ['I work in the sales department.', 'Could you show me where the meeting room is?'],
    exercises: ['Ask the learner to introduce their role in one sentence.', 'Ask the learner to form a polite question about their schedule.'],
    practice: 'Act as a new colleague welcoming the learner. Exchange introductions and answer one question about the workplace, one turn at a time.',
    success: 'The learner introduces their role and asks a clear, polite question about the workplace.',
  },
  'B1/work/1': {
    objective: 'Describe obligations and prohibitions in a workplace and ask about its rules.',
    vocabulary: ['rule', 'permission', 'deadline', 'manager', 'safety'],
    grammar: 'Use must and have to for obligations, must not for prohibition, and can or cannot for permission. Do not have to means no obligation, not prohibition.',
    examples: [
      'You must wear a safety badge at work.',
      'You must not share your password.',
      'You do not have to attend the optional meeting.',
    ],
    exercises: [
      'A safety badge is required. Choose: I must wear a badge / I must not wear a badge. Ask the learner to explain the choice.',
      'The meeting is optional. Ask the learner to make a sentence using do not have to, then distinguish it from must not.',
    ],
    practice: 'Act as a colleague on the learner’s first day. Ask about two workplace rules and permission to do something; invite the learner to ask one question. Speak one turn at a time and correct errors briefly.',
    success: 'The learner states at least one obligation and one prohibition correctly and asks or answers a question about permission.',
  },
  'B1/work/2': {
    objective: 'Ask a colleague for help and explain what assistance is needed.',
    vocabulary: ['help', 'task', 'explain', 'available', 'step'],
    grammar: 'Use could and would for polite requests, and because to give a simple reason.',
    examples: ['Could you explain the next step?', 'I need help because I cannot open the file.'],
    exercises: ['Ask the learner to change an imperative into a polite request.', 'Ask the learner to explain a specific problem using because.'],
    practice: 'Act as a colleague. Ask what the learner needs help with and agree on one next step, waiting for each answer.',
    success: 'The learner explains a problem and makes one clear, polite request for help.',
  },
  'B1/work/3': {
    objective: 'Discuss a work task, its deadline and the next step.',
    vocabulary: ['task', 'deadline', 'priority', 'update', 'finish'],
    grammar: 'Use present continuous for current work and will for a simple immediate decision or offer.',
    examples: ['I am preparing the report.', 'I will send you an update this afternoon.'],
    exercises: ['Ask the learner what they are working on now.', 'Ask for a sentence offering an update and a time.'],
    practice: 'Act as a teammate checking on a task. Ask what is in progress, when it is due and what the next step is.',
    success: 'The learner describes a current task and communicates a deadline or next step.',
  },
  'B1/work/4': {
    objective: 'Take part in a short workplace conversation about a task and ask a follow-up question.',
    vocabulary: ['project', 'meeting', 'progress', 'question', 'tomorrow'],
    grammar: 'Combine present simple and present continuous to contrast routine and current work; form clear follow-up questions.',
    examples: ['I usually work with the design team.', 'We are preparing for tomorrow’s meeting.'],
    exercises: ['Ask the learner to describe one routine and one current activity.', 'Ask the learner to form a follow-up question about a colleague’s task.'],
    practice: 'Act as a colleague before a meeting. Discuss current work, ask one follow-up question and agree on a simple next step.',
    success: 'The learner describes work, asks a relevant follow-up question and agrees on a next step.',
  },
};

export function getAILessonCard(level: string, topicId: string, lessonIndex: number): AILessonCard | null {
  return LESSON_CARDS[`${level}/${topicId}/${lessonIndex}`] ?? null;
}

export function buildLessonInstruction(card: AILessonCard): string {
  return [
    `Learning objective: ${card.objective}`,
    `Target vocabulary: ${card.vocabulary.join(', ')}.`,
    `Language focus: ${card.grammar}`,
    `Examples: ${card.examples.join(' ')}`,
    `Exercises: ${card.exercises.join(' ')}`,
    `Practice: ${card.practice}`,
    `Success criteria: ${card.success}`,
    'Teach interactively. Explain briefly, ask exercises one at a time, wait for the learner’s answer and provide feedback. Use the practice task when the learner starts practice. Do not claim the success criteria are met without evidence.',
  ].join('\n');
}
