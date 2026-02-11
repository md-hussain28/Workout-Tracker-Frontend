import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function modeLabel(mode: string) {
  switch (mode) {
    case "weight_reps": return "Weight × Reps";
    case "time": return "Time";
    case "bodyweight_reps": return "Bodyweight × Reps";
    default: return mode;
  }
}

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exerciseId = parseInt(id, 10);
  if (Number.isNaN(exerciseId)) notFound();

  let exercise: Awaited<ReturnType<typeof api.exercises.get>>;
  try {
    exercise = await api.exercises.get(exerciseId);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{exercise.name}</h1>
          <Badge variant="secondary" className="mt-1 font-normal">
            {modeLabel(exercise.measurement_mode)}
          </Badge>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-xl">
          <Link href={`/exercises/${exercise.id}/edit`}>Edit</Link>
        </Button>
      </div>

      {exercise.description && (
        <Card className="mb-6">
          <CardContent className="py-4">
            <p className="text-muted-foreground text-sm">{exercise.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        {exercise.primary_muscle_group && (
          <span>Primary: {exercise.primary_muscle_group.name}</span>
        )}
        {exercise.secondary_muscle_group && (
          <span>Secondary: {exercise.secondary_muscle_group.name}</span>
        )}
        {exercise.tertiary_muscle_group && (
          <span>Tertiary: {exercise.tertiary_muscle_group.name}</span>
        )}
      </div>
    </div>
  );
}
