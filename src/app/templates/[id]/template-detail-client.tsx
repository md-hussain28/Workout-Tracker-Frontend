"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Play } from "lucide-react";
import { api, type WorkoutTemplate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function TemplateDetailClient({ template }: { template: WorkoutTemplate }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.templates.instantiate(template.id);
      router.push(`/workouts/${res.workout_id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start workout");
    } finally {
      setLoading(false);
    }
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
            className="w-full rounded-xl py-6 text-base font-medium"
            size="lg"
            onClick={handleStart}
            disabled={loading}
          >
            <Play className="mr-2 size-5" />
            {loading ? "Starting…" : "Start workout from template"}
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
