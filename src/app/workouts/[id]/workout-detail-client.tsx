"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, StopCircle, Trophy, LayoutTemplate } from "lucide-react";
import { api, type WorkoutWithSets } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddSetForm } from "./add-set-form";

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m}:${s.toString().padStart(2, "0")}` : `${m} min`;
}

function setSummary(set: { weight: number | null; reps: number | null; duration_seconds: number | null; is_pr?: boolean }) {
  if (set.duration_seconds != null) return `${set.duration_seconds}s`;
  const parts = [];
  if (set.weight != null) parts.push(`${set.weight}`);
  if (set.reps != null) parts.push(`${set.reps} reps`);
  return parts.join(" × ") || "—";
}

export function WorkoutDetailClient({
  workout,
  isActive,
}: {
  workout: WorkoutWithSets;
  isActive: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ending, setEnding] = useState(false);

  const groupedSets = (workout.sets ?? []).reduce<{ exercise: { id: number; name: string }; sets: typeof workout.sets }[]>(
    (acc, set) => {
      const name = set.exercise?.name ?? `Exercise #${set.exercise_id}`;
      const existing = acc.find((g) => g.exercise.id === set.exercise_id);
      if (existing) {
        existing.sets.push(set);
      } else {
        acc.push({ exercise: { id: set.exercise_id, name }, sets: [set] });
      }
      return acc;
    },
    []
  );

  async function handleEndWorkout() {
    setEnding(true);
    try {
      await api.workouts.update(workout.id, {
        ended_at: new Date().toISOString(),
      });
      router.refresh();
    } finally {
      setEnding(false);
    }
  }

  async function handleSetAdded() {
    setOpen(false);
    router.refresh();
  }

  const started = new Date(workout.started_at).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <div className="mb-6">
        <p className="text-muted-foreground text-sm">{started}</p>
        {workout.notes && (
          <p className="text-muted-foreground text-sm mt-1">{workout.notes}</p>
        )}
      </div>

      {isActive && (
        <div className="flex gap-2 mb-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button className="flex-1 rounded-xl py-6" size="lg">
                <Plus className="mr-2 size-5" />
                Add set
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-3xl border-t pt-6 pb-[max(env(safe-area-inset-bottom),24px)] max-h-[85dvh] overflow-y-auto"
            >
              <SheetHeader>
                <SheetTitle>Log set</SheetTitle>
              </SheetHeader>
              <AddSetForm
                workoutId={workout.id}
                existingSets={workout.sets ?? []}
                onSuccess={handleSetAdded}
              />
            </SheetContent>
          </Sheet>
          <Button
            variant="outline"
            size="lg"
            className="rounded-xl py-6"
            onClick={handleEndWorkout}
            disabled={ending}
          >
            <StopCircle className="mr-2 size-5" />
            End
          </Button>
        </div>
      )}

      {groupedSets.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No sets yet. Tap &quot;Add set&quot; to log your first set.
          </CardContent>
        </Card>
      )}

      {groupedSets.length > 0 && (
        <div className="space-y-4">
          {groupedSets.map(({ exercise, sets }) => (
            <Card key={exercise.id}>
              <CardContent className="p-4">
                <p className="font-medium mb-3">{exercise.name}</p>
                <ul className="space-y-2">
                  {sets
                    .sort((a, b) => a.set_order - b.set_order || a.id - b.id)
                    .map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          Set {s.set_order + 1}
                        </span>
                        <span className="font-medium">{setSummary(s)}</span>
                        {s.is_pr && (
                          <Badge variant="secondary" className="gap-0.5 text-xs">
                            <Trophy className="size-3" />
                            PR
                          </Badge>
                        )}
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isActive && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Duration: {formatDuration(workout.duration_seconds)}</span>
          </div>
          {groupedSets.length > 0 && (
            <SaveAsTemplateButton workoutId={workout.id} />
          )}
        </div>
      )}
    </>
  );
}

function SaveAsTemplateButton({ workoutId }: { workoutId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.templates.createFromWorkout({ name: name.trim(), workout_id: workoutId });
      setOpen(false);
      router.push("/templates");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full rounded-xl" size="sm">
          <LayoutTemplate className="mr-2 size-4" />
          Save as template
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template name</Label>
            <Input
              id="template-name"
              placeholder="e.g. Push Day"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" className="w-full rounded-xl" disabled={!name.trim() || loading}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
