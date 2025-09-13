
export interface User {
  id: string;
  username: string;  // Added username property
  name: string;
  avatarUrl: string;
  level: number;
  xp: number;
  attributes: {
    strength: number;
    vitality: number;
    focus: number;
  };
  daysTrainedThisWeek: number;
  streakDays: number;
}

export interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;  // Sempre string para aceitar texto livre
  notes?: string;  // Campo opcional para observações
}

export interface ExerciseStatus {
  id: string;
  completed: boolean;
  sets: SetStatus[];
  notes: string;
  previousWeight?: number;
  previousNotes?: ExerciseNotes[];
}

export interface SetStatus {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface ExerciseNotes {
  exerciseId: string;
  notes: string;
  workoutId: string;
  workoutName: string;
  date: string;
}

export interface WorkoutHistory {
  id: string;
  date: string;
  workoutId: string;
  workoutName: string;
  completed: boolean;
  xpEarned: number;
  exercises: WorkoutExerciseHistory[];
  notes?: string;
}

export interface WorkoutExerciseHistory {
  id: string;
  name: string;
  sets: number;
  reps: string;  // Sempre string para aceitar texto livre
  setsPerformed: SetPerformed[];
  completed: boolean;
}

export interface WorkoutSession {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string;
  exercises: ExercisePerformed[];
  completed: boolean;
  xpEarned: number;
}

export interface ExercisePerformed {
  id: string;
  exerciseId: string;
  name: string;
  sets: SetPerformed[];
}

export interface SetPerformed {
  reps: number;
  weight: number;
}

export interface ExerciseProgress {
  exercise: string;
  currentWeek: {
    weight: number;
    sets: number;
    totalReps: number;
  };
  previousWeek: {
    weight: number;
    sets: number;
    totalReps: number;
  };
  progress: 'increased' | 'decreased' | 'maintained';
}
