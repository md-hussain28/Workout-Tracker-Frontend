"use client";

import { useEffect, useState } from "react";
import { api, type Exercise, type WorkoutSet, type WorkoutSetCreate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AddSetForm({
  workoutId,
  existingSets,
  onSuccess,
}: {
  workoutId: number;
  existingSets: WorkoutSet[];
  onSuccess: () => void;
}) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingEx, setLoadingEx] = useState(true);
  const [exerciseId, setExerciseId] = useState<string>("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedExercise = exercises.find((e) => e.id === parseInt(exerciseId, 10));
  const isTimeBased = selectedExercise?.measurement_mode === "time";
  const isBodyweightReps = selectedExercise?.measurement_mode === "bodyweight_reps";

  useEffect(() => {
    api.exercises.list().then(setExercises).finally(() => setLoadingEx(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!exerciseId) return;
    setError(null);
    setSubmitting(true);
    const nextOrder = existingSets.filter((s) => s.exercise_id === parseInt(exerciseId, 10)).length;
    const payload: WorkoutSetCreate = {
      exercise_id: parseInt(exerciseId, 10),
      set_order: nextOrder,
    };
    if (isTimeBased) {
      const sec = parseInt(durationSeconds, 10);
      if (!Number.isNaN(sec)) payload.duration_seconds = sec;
    } else {
      const w = parseFloat(weight);
      const r = parseInt(reps, 10);
      if (!Number.isNaN(w)) payload.weight = w;
      if (!Number.isNaN(r)) payload.reps = r;
    }
    try {
      await api.workouts.addSet(workoutId, payload);
      setWeight("");
      setReps("");
      setDurationSeconds("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add set");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingEx) {
    return <p className="text-muted-foreground text-sm py-4">Loading exercises…</p>;
  }

  if (exercises.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">
        No exercises yet. Add exercises from the Exercises tab first.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-1">
      <div className="space-y-2">
        <Label>Exercise</Label>
        <Select value={exerciseId} onValueChange={setExerciseId}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Choose exercise" />
          </SelectTrigger>
          <SelectContent>
            {exercises.map((ex) => (
              <SelectItem key={ex.id} value={String(ex.id)} className="rounded-lg">
                {ex.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedExercise && (
        <>
          {isTimeBased ? (
            <div className="space-y-2">
              <Label>Duration (seconds)</Label>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 60"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                className="rounded-xl"
              />
            </div>
          ) : (
            <>
              {!isBodyweightReps && (
                <div className="space-y-2">
                  <Label>Weight ({selectedExercise.unit})</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min={0}
                    placeholder="0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Reps</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </>
          )}
        </>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button
        type="submit"
        className="w-full rounded-xl py-6"
        size="lg"
        disabled={!exerciseId || submitting}
      >
        {submitting ? "Adding…" : "Add set"}
      </Button>
    </form>
  );
}
