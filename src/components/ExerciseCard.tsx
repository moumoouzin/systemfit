
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Exercise, ExerciseStatus } from "@/types";
import { ArrowUp, ArrowDown } from "lucide-react";

interface ExerciseCardProps {
  exercise: Exercise;
  status: ExerciseStatus;
  onToggleCompletion: (id: string) => void;
  onUpdateWeight: (id: string, weight: number) => void;
}

export const ExerciseCard = ({
  exercise,
  status,
  onToggleCompletion,
  onUpdateWeight
}: ExerciseCardProps) => {
  const hasPreviousWeight = status.previousWeight && status.previousWeight > 0;
  const weightDifference = status.weight - (status.previousWeight || 0);

  return (
    <Card className={status.completed ? "border-primary" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Checkbox 
              id={`exercise-${exercise.id}`}
              checked={status.completed}
              onCheckedChange={() => onToggleCompletion(exercise.id)}
              className="mr-2"
            />
            <label 
              htmlFor={`exercise-${exercise.id}`}
              className={`cursor-pointer ${status.completed ? "line-through text-muted-foreground" : ""}`}
            >
              {exercise.name}
            </label>
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {exercise.sets} séries × {exercise.reps} reps
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor={`weight-${exercise.id}`} className="text-sm font-medium">
              Carga atual (kg)
            </label>
            <Input
              id={`weight-${exercise.id}`}
              type="number"
              min="0"
              value={status.weight || 0}
              onChange={(e) => onUpdateWeight(exercise.id, Number(e.target.value))}
            />
          </div>
          
          {hasPreviousWeight && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Última carga</p>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold">{status.previousWeight} kg</span>
                {weightDifference > 0 && (
                  <span className="flex items-center text-rpg-vitality">
                    <ArrowUp className="h-4 w-4 mr-1" />
                    +{weightDifference}kg
                  </span>
                )}
                {weightDifference < 0 && (
                  <span className="flex items-center text-rpg-strength">
                    <ArrowDown className="h-4 w-4 mr-1" />
                    {weightDifference}kg
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
