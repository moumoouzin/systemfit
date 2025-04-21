
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface WorkoutNotesProps {
  notes: string;
  onChange: (value: string) => void;
}

export const WorkoutNotes = ({ notes, onChange }: WorkoutNotesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anotações do Treino</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Adicione suas observações sobre o treino..."
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[100px]"
        />
      </CardContent>
    </Card>
  );
};
