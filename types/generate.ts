export type StudyMode = 'study' | 'quiz';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type GenerateDeckOptions = {
  topic: string;
  mode: StudyMode;
  difficulty: DifficultyLevel;
  customPrompt?: string;
};
