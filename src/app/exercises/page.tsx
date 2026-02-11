import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

function modeLabel(mode: string) {
  switch (mode) {
    case "weight_reps":
      return "Weight × Reps";
    case "time":
      return "Time";
    case "bodyweight_reps":
      return "Bodyweight × Reps";
    default:
      return mode;
  }
}

export default async function ExercisesPage() {
  let exercises: Awaited<ReturnType<typeof api.exercises.list>> = [];
  let error: string | null = null;
  try {
    exercises = await api.exercises.list();
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load exercises";
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Exercises</h1>
        <Button asChild size="sm" className="rounded-xl">
          <Link href="/exercises/new">
            <Plus className="mr-1 size-4" />
            Add
          </Link>
        </Button>
      </div>

      {error && <p className="text-destructive text-sm py-4">{error}</p>}

      {!error && exercises.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="font-medium">No exercises yet</p>
            <p className="text-sm mt-1">Add exercises to log sets during workouts.</p>
            <Button asChild className="mt-4 rounded-xl">
              <Link href="/exercises/new">Add exercise</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && exercises.length > 0 && (
        <ul className="space-y-2">
          {exercises.map((ex) => (
            <li key={ex.id}>
              <Link href={`/exercises/${ex.id}`}>
                <Card className="transition-colors hover:bg-muted/50 active:bg-muted">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{ex.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs font-normal">
                          {modeLabel(ex.measurement_mode)}
                        </Badge>
                        {ex.primary_muscle_group && (
                          <span className="text-muted-foreground text-sm">
                            {ex.primary_muscle_group.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-muted-foreground text-sm">Edit</span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
