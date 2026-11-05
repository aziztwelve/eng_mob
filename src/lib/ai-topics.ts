/** Starter conversation curriculum. These are AI lessons, independent of course tracks. */
export const AI_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type AILevel = typeof AI_LEVELS[number];
export type AITopic = { id: string; title: string; lessons: readonly string[] };

export const AI_TOPICS: Record<AILevel, readonly AITopic[]> = {
  A1: [
    { id: 'greetings', title: 'Greetings', lessons: ['Saying hello', 'Introducing yourself', 'How are you?', 'Saying goodbye', 'Meeting someone'] },
    { id: 'about-me', title: 'About me', lessons: ['My name', 'Where I am from', 'My age', 'Languages I speak', 'Introducing a friend'] },
    { id: 'family', title: 'Family and friends', lessons: ['My family', 'Describing people', 'My friends', 'Talking about ages', 'Meeting the family'] },
    { id: 'food', title: 'Food and drink', lessons: ['Foods I like', 'Drinks', 'Ordering a drink', 'At a café', 'A simple meal'] },
    { id: 'routine', title: 'Daily life', lessons: ['Morning routine', 'Telling the time', 'Days of the week', 'After work or school', 'My day'] },
  ],
  A2: [
    { id: 'weekend', title: 'Weekend plans', lessons: ['Free time', 'Making plans', 'Inviting a friend', 'Accepting an invitation', 'A weekend together'] },
    { id: 'travel', title: 'Getting around', lessons: ['Asking for directions', 'Public transport', 'Buying a ticket', 'Finding a place', 'A journey'] },
    { id: 'shopping', title: 'Shopping', lessons: ['Clothes and sizes', 'Asking the price', 'Describing what you need', 'Paying', 'At the shop'] },
    { id: 'past', title: 'Past experiences', lessons: ['Yesterday', 'Last weekend', 'A trip', 'A memorable day', 'Asking about the past'] },
    { id: 'health', title: 'Health and habits', lessons: ['How I feel', 'Healthy habits', 'At the pharmacy', 'Making an appointment', 'Giving simple advice'] },
  ],
  B1: [
    { id: 'work', title: 'At work', lessons: ['First day at work', 'Workplace rules', 'Asking for help', 'Discussing tasks', 'A work conversation'] },
    { id: 'experiences', title: 'Life experiences', lessons: ['Things I have done', 'First experiences', 'Important changes', 'Sharing a story', 'Asking follow-up questions'] },
    { id: 'opinions', title: 'Opinions', lessons: ['Giving an opinion', 'Agreeing', 'Disagreeing politely', 'Giving reasons', 'A friendly discussion'] },
    { id: 'problems', title: 'Solving problems', lessons: ['Explaining a problem', 'Asking for help', 'Making suggestions', 'Comparing solutions', 'Choosing a solution'] },
    { id: 'future', title: 'Future plans', lessons: ['Plans and intentions', 'Predictions', 'Goals', 'Making arrangements', 'Discussing the future'] },
  ],
  B2: [
    { id: 'career', title: 'Career and growth', lessons: ['Career goals', 'Strengths and skills', 'A job interview', 'Giving feedback', 'Career decisions'] },
    { id: 'society', title: 'Society', lessons: ['Community issues', 'Comparing viewpoints', 'Cause and effect', 'Proposing changes', 'A balanced discussion'] },
    { id: 'technology', title: 'Technology', lessons: ['Digital habits', 'Benefits and risks', 'Explaining a process', 'Future technology', 'Discussing an innovation'] },
    { id: 'media', title: 'Media and culture', lessons: ['Books and films', 'Sharing a review', 'Cultural differences', 'Supporting an opinion', 'A recommendation'] },
    { id: 'negotiation', title: 'Working together', lessons: ['Setting priorities', 'Making a proposal', 'Handling disagreement', 'Reaching a compromise', 'Planning together'] },
  ],
  C1: [
    { id: 'leadership', title: 'Leadership', lessons: ['Leadership styles', 'Giving nuanced feedback', 'Managing conflict', 'Motivating a team', 'A difficult decision'] },
    { id: 'ethics', title: 'Ethics and choices', lessons: ['An ethical dilemma', 'Weighing consequences', 'Competing values', 'Defending a position', 'Finding common ground'] },
    { id: 'innovation', title: 'Innovation', lessons: ['Explaining an idea', 'Challenging assumptions', 'Assessing risks', 'Persuasive proposals', 'An innovation debate'] },
    { id: 'culture', title: 'Culture and identity', lessons: ['Cultural identity', 'Tradition and change', 'Intercultural communication', 'Subtle differences', 'A deeper conversation'] },
    { id: 'environment', title: 'Global challenges', lessons: ['Environmental issues', 'Policy choices', 'Long-term effects', 'Evaluating evidence', 'Proposing action'] },
  ],
  C2: [
    { id: 'argument', title: 'Advanced argument', lessons: ['Framing an argument', 'Evaluating evidence', 'Addressing objections', 'Qualifying claims', 'A structured debate'] },
    { id: 'language', title: 'Language and meaning', lessons: ['Tone and register', 'Implicit meaning', 'Idiomatic language', 'Ambiguity', 'Adapting your message'] },
    { id: 'policy', title: 'Public policy', lessons: ['Complex trade-offs', 'Stakeholder views', 'Unintended consequences', 'Evaluating proposals', 'A policy discussion'] },
    { id: 'research', title: 'Research and ideas', lessons: ['Explaining a concept', 'Interpreting evidence', 'Questioning methods', 'Synthesising ideas', 'A critical discussion'] },
    { id: 'persuasion', title: 'Persuasion', lessons: ['Audience and purpose', 'Building a case', 'Responding under pressure', 'Negotiating nuance', 'A persuasive conversation'] },
  ],
};

export function findAILesson(level: string, topicId: string, lessonIndex: number) {
  if (!AI_LEVELS.includes(level as AILevel)) return null;
  const topic = AI_TOPICS[level as AILevel].find(item => item.id === topicId);
  const lesson = topic?.lessons[lessonIndex];
  return topic && lesson ? { level: level as AILevel, topic, lesson, lessonIndex } : null;
}
