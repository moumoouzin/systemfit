
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
  reps: number;
}

export interface ExerciseStatus {
  id: string;
  completed: boolean;
  weight: number;
  previousWeight?: number;
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
  reps: number;
  weight: number;
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
