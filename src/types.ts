export interface Chapter {
  id: number;
  title: string;
  lessons: LessonSummary[];
}

export interface LessonSummary {
  id: number;
  title: string;
}

export interface Formula {
  id: number;
  content: string;
}

export interface ExampleItem {
  problem: string;
  solution: string;
}

export interface Example {
  id: number;
  title: string;
  items: ExampleItem[];
}

export interface PracticeItem {
  problem: string;
  hint?: string;
  answer?: string;
}

export interface PracticeExercise {
  id: number;
  title: string;
  items: PracticeItem[];
}

export interface FullLesson {
  id: number;
  title: string;
  description: string;
  formulas: Formula[];
  examples: Example[];
  practice: PracticeExercise[];
}
