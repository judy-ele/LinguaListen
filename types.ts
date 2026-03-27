export enum ProficiencyLevel {
  A1 = 'A1 (Beginner)',
  A2 = 'A2 (Elementary)',
  B1 = 'B1 (Intermediate)',
  B2 = 'B2 (Upper Intermediate)',
  C1 = 'C1 (Advanced)',
  C2 = 'C2 (Proficiency)',
}

export const TOPICS = [
  'Daily Routine',
  'Travel & Transport',
  'Food & Dining',
  'Business & Work',
  'Technology',
  'Health & Wellness',
  'Environment',
  'Culture & Arts',
  'Education',
  'Social Issues',
];

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  FILL_IN_THE_BLANK = 'fill_in_the_blank',
  MATCHING = 'matching',
}

export interface DialogueLine {
  speaker: string;
  text: string;
}

export interface Option {
  id: string;
  text: string;
}

export interface MatchingPair {
  item: string;
  match: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: Option[]; // For Multiple Choice
  correctAnswer: string | string[]; // String for MC/Fill, JSON string or array for matching
  matches?: MatchingPair[]; // For Matching UI display (shuffled)
  explanation: string;
}

export interface ExerciseData {
  topic: string;
  level: ProficiencyLevel;
  dialogue: DialogueLine[];
  questions: Question[];
}

export interface AppState {
  screen: 'setup' | 'loading' | 'exercise' | 'results';
  config: {
    level: ProficiencyLevel | null;
    topic: string | null;
    exerciseCount: number;
  };
  currentExerciseIndex: number;
  exercises: ExerciseData[]; // We might load these one by one or all at once. Ideally one by one to save time.
  userAnswers: Record<string, any>; // questionId -> answer
  scores: boolean[]; // per exercise pass/fail or score
  audioUrl: string | null;
}
