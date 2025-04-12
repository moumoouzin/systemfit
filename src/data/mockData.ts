
import { User, Workout, WorkoutSession, ExerciseProgress, WorkoutHistory } from '../types';

// Sample user data
export const mockUser: User = {
  id: '1',
  name: 'Ricardo',
  avatarUrl: '/avatar1.png',
  level: 5,
  xp: 145,
  attributes: {
    strength: 7,
    vitality: 5,
    focus: 6
  },
  daysTrainedThisWeek: 3,
  streakDays: 12
};

// Sample workouts
export const mockWorkouts: Workout[] = [
  {
    id: '1',
    name: 'Treino A - Peito e Tríceps',
    exercises: [
      { id: '1', name: 'Supino Reto', sets: 4, reps: 10 },
      { id: '2', name: 'Crucifixo', sets: 3, reps: 12 },
      { id: '3', name: 'Tríceps Corda', sets: 3, reps: 15 },
      { id: '4', name: 'Tríceps Francês', sets: 3, reps: 12 }
    ],
    createdAt: '2023-09-01T10:00:00Z',
    updatedAt: '2023-09-01T10:00:00Z'
  },
  {
    id: '2',
    name: 'Treino B - Costas e Bíceps',
    exercises: [
      { id: '5', name: 'Puxada Frontal', sets: 4, reps: 10 },
      { id: '6', name: 'Remada Curvada', sets: 3, reps: 12 },
      { id: '7', name: 'Rosca Direta', sets: 3, reps: 12 },
      { id: '8', name: 'Rosca Martelo', sets: 3, reps: 12 }
    ],
    createdAt: '2023-09-02T10:00:00Z',
    updatedAt: '2023-09-02T10:00:00Z'
  },
  {
    id: '3',
    name: 'Treino C - Pernas',
    exercises: [
      { id: '9', name: 'Agachamento', sets: 4, reps: 10 },
      { id: '10', name: 'Leg Press', sets: 3, reps: 12 },
      { id: '11', name: 'Cadeira Extensora', sets: 3, reps: 15 },
      { id: '12', name: 'Panturrilha em Pé', sets: 4, reps: 20 }
    ],
    createdAt: '2023-09-03T10:00:00Z',
    updatedAt: '2023-09-03T10:00:00Z'
  }
];

// Sample workout sessions
export const mockSessions: WorkoutSession[] = [
  {
    id: '1',
    workoutId: '1',
    workoutName: 'Treino A - Peito e Tríceps',
    date: '2023-12-10T15:00:00Z',
    exercises: [
      {
        id: '1',
        exerciseId: '1',
        name: 'Supino Reto',
        sets: [
          { reps: 10, weight: 60 },
          { reps: 10, weight: 60 },
          { reps: 8, weight: 65 },
          { reps: 8, weight: 65 }
        ]
      },
      {
        id: '2',
        exerciseId: '2',
        name: 'Crucifixo',
        sets: [
          { reps: 12, weight: 15 },
          { reps: 12, weight: 15 },
          { reps: 10, weight: 17.5 }
        ]
      }
    ],
    completed: true,
    xpEarned: 25
  },
  {
    id: '2',
    workoutId: '2',
    workoutName: 'Treino B - Costas e Bíceps',
    date: '2023-12-12T16:30:00Z',
    exercises: [
      {
        id: '3',
        exerciseId: '5',
        name: 'Puxada Frontal',
        sets: [
          { reps: 10, weight: 50 },
          { reps: 10, weight: 55 },
          { reps: 8, weight: 60 },
          { reps: 8, weight: 60 }
        ]
      },
      {
        id: '4',
        exerciseId: '6',
        name: 'Remada Curvada',
        sets: [
          { reps: 12, weight: 40 },
          { reps: 12, weight: 45 },
          { reps: 10, weight: 45 }
        ]
      }
    ],
    completed: true,
    xpEarned: 25
  },
  {
    id: '3',
    workoutId: '3',
    workoutName: 'Treino C - Pernas',
    date: '2023-12-14T17:00:00Z',
    exercises: [
      {
        id: '5',
        exerciseId: '9',
        name: 'Agachamento',
        sets: [
          { reps: 10, weight: 70 },
          { reps: 10, weight: 80 },
          { reps: 8, weight: 90 },
          { reps: 8, weight: 90 }
        ]
      },
      {
        id: '6',
        exerciseId: '10',
        name: 'Leg Press',
        sets: [
          { reps: 12, weight: 120 },
          { reps: 12, weight: 140 },
          { reps: 10, weight: 160 }
        ]
      }
    ],
    completed: true,
    xpEarned: 25
  }
];

// Sample exercise progress data
export const mockExerciseProgress: ExerciseProgress[] = [
  {
    exercise: 'Supino Reto',
    currentWeek: {
      weight: 65,
      sets: 4,
      totalReps: 36
    },
    previousWeek: {
      weight: 60,
      sets: 4,
      totalReps: 40
    },
    progress: 'increased'
  },
  {
    exercise: 'Puxada Frontal',
    currentWeek: {
      weight: 60,
      sets: 4,
      totalReps: 36
    },
    previousWeek: {
      weight: 55,
      sets: 4,
      totalReps: 40
    },
    progress: 'increased'
  },
  {
    exercise: 'Agachamento',
    currentWeek: {
      weight: 90,
      sets: 4,
      totalReps: 36
    },
    previousWeek: {
      weight: 85,
      sets: 4,
      totalReps: 40
    },
    progress: 'increased'
  }
];

// Sample workout history
export const mockWorkoutHistory: WorkoutHistory[] = [
  {
    date: '2023-12-14T17:00:00Z',
    workoutId: '3',
    workoutName: 'Treino C - Pernas',
    completed: true,
    xpEarned: 25
  },
  {
    date: '2023-12-12T16:30:00Z',
    workoutId: '2',
    workoutName: 'Treino B - Costas e Bíceps',
    completed: true,
    xpEarned: 25
  },
  {
    date: '2023-12-10T15:00:00Z',
    workoutId: '1',
    workoutName: 'Treino A - Peito e Tríceps',
    completed: true,
    xpEarned: 25
  },
  {
    date: '2023-12-08T15:30:00Z',
    workoutId: '3',
    workoutName: 'Treino C - Pernas',
    completed: true,
    xpEarned: 25
  },
  {
    date: '2023-12-06T14:00:00Z',
    workoutId: '2',
    workoutName: 'Treino B - Costas e Bíceps',
    completed: true,
    xpEarned: 25
  },
  {
    date: '2023-12-04T16:30:00Z',
    workoutId: '1',
    workoutName: 'Treino A - Peito e Tríceps',
    completed: true,
    xpEarned: 25
  }
];
