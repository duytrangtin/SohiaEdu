export enum Topic {
  SEQUENTIAL = 'Tuần tự',
  BRANCHING = 'Rẽ nhánh',
  LOOP = 'Lặp',
  COMBINED = 'Tổng hợp'
}

export interface Question {
  id: string;
  text: string;
  topic: Topic;
  hint?: string;
  sampleInput?: string; // For the backend to test
  expectedOutputDescription?: string;
}

export interface EvaluationResult {
  correct: boolean;
  message: string;
  output: string;
}

export enum GameStatus {
  INTRO = 'INTRO',
  TOPIC_SELECTION = 'TOPIC_SELECTION',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}

export interface UserState {
  studentCode: string;
  score: number;
  totalQuestions: number;
  currentQuestionIndex: number;
  history: {
    questionId: string;
    isCorrect: boolean;
  }[];
}