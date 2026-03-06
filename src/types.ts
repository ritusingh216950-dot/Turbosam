export interface Flashcard {
  question: string;
  answer: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface StudySet {
  id: string;
  title: string;
  source_type: 'text' | 'pdf' | 'link';
  source_content: string;
  notes: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  created_at: string;
}

export type ViewState = 'dashboard' | 'create' | 'study';
