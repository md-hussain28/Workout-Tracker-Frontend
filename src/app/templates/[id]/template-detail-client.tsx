"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Play, Loader2 } from "lucide-react";
import { api, type WorkoutTemplate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function TemplateDetailClient({ template }: { template: WorkoutTemplate }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const instantiateMutation = useMutation({
    mutationFn: () => api.templates.instantiate(template.id),
    onSuccess: (res) => {
      router.push(`/workouts/${res.workout_id}`);
      router.refresh();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Failed to start workout"),
  });

  function handleStart() {
    if (instantiateMutation.isPending) return;
    setError(null);
    instantiateMutation.mutate();
  }

  const exercises = template.exercises
    .sort((a, b) => a.order_in_template - b.order_in_template)
    .map((te) => te.exercise?.name ?? `Exercise #${te.exercise_id}`);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">{template.name}</h1>

      <Card className="mb-6 overflow-hidden border-primary/20 bg-primary/5">
        <CardContent className="py-6">
          <Button
            type="button"
            className="w-full rounded-xl py-6 text-base font-medium"
            size="lg"
            onClick={handleStart}
            disabled={instantiateMutation.isPending}
          >
            {instantiateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                Starting…
              </>
            ) : (
              <>
                <Play className="mr-2 size-5" />
                Start workout from template
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm mb-4">{error}</p>}

      <h2 className="text-sm font-medium text-muted-foreground mb-2">Exercises in order</h2>
      <Card>
        <CardContent className="py-4">
          <ol className="list-decimal list-inside space-y-2">
            {exercises.map((name, i) => (
              <li key={i} className="font-medium">
                {name}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </>
  );
}
