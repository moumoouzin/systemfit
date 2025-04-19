
export interface User {
  id: string;
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
  reps: number;
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

export interface WorkoutHistory {
  date: string;
  workoutId: string;
  workoutName: string;
  completed: boolean;
  xpEarned: number;
}
