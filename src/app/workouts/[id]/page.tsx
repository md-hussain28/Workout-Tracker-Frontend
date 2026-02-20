"use client";

import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  StopCircle,
  Trophy,
  LayoutTemplate,
  X,
  Timer,
  Search,
  Pencil,
  Trash2,
  History,
  Check,
  TrendingUp,
  Award,
  Sparkles,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { api, type Exercise, type WorkoutWithSets, type WorkoutSet, type WorkoutSetCreate } from "@/lib/api";
import { useWorkout, useAddSet, useUpdateSet, useDeleteSet, useEndWorkout, useDeleteWorkout, useDeleteExerciseSets } from "@/lib/hooks/use-workout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Live Timer ──
function LiveTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return (
    <div className="flex items-center gap-2 text-lg font-mono font-semibold tabular-nums">
      <Timer className="size-5 text-primary" />
      {formatDuration(elapsed)}
    </div>
  );
}

// ── PR Celebration Toast ──
function PrToast({ prType, onDismiss }: { prType: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black px-4 py-2.5 rounded-xl shadow-lg">
        <Trophy className="size-5" />
        <span className="font-semibold text-sm">
          New PR! 🎉 Best {prType === "weight" ? "Weight" : prType === "volume" ? "Volume" : "Duration"}
        </span>
        <Sparkles className="size-4" />
      </div>
    </div>
  );
}

import { WorkoutExerciseCard } from "@/components/workouts/WorkoutExerciseCard";
import { ExerciseHistorySheet } from "@/components/workouts/ExerciseHistorySheet";

// ── Exercise Picker (Modal – works well on mobile, no auto keyboard) ──
function ExercisePickerModal({
  workoutId,
  existingExerciseIds,
  open,
  onOpenChange,
}: {
  workoutId: string;
  existingExerciseIds: Set<string>;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const addSetMutation = useAddSet(workoutId);

  const { data: exercises = [] } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => api.exercises.list(),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return exercises;
    return exercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        ex.primary_muscle_group?.name.toLowerCase().includes(q)
    );
  }, [exercises, search]);

  // Group filtered exercises by muscle group
  const grouped = useMemo(() => {
    const map = new Map<string, typeof exercises>();
    for (const ex of filtered) {
      const key = ex.primary_muscle_group?.name ?? "Uncategorized";
      const arr = map.get(key) ?? [];
      arr.push(ex);
      map.set(key, arr);
    }
    return map;
  }, [filtered]);

  function handleSelect(ex: Exercise) {
    if (addSetMutation.isPending) return;
    addSetMutation.mutate({
      exercise_id: ex.id,
      set_order: 0,
      weight: null,
      reps: null,
    });
    onOpenChange(false);
    setSearch("");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSearch(""); }}>
      <DialogContent
        className="flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-h-[80vh]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 border-b px-4 py-4 pb-3">
          <DialogTitle>Add Exercise</DialogTitle>
          <div className="relative pt-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-muted bg-muted/50 pl-10 rounded-xl"
              autoComplete="off"
            />
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 pb-6">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No exercises found.
            </p>
          )}
          {Array.from(grouped.entries()).map(([group, exs]) => (
            <div key={group} className="mb-3">
              <p className="sticky top-0 z-10 bg-background/95 px-1 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
                {group}
              </p>
              <div className="space-y-0.5">
                {exs.map((ex) => {
                  const alreadyAdded = existingExerciseIds.has(ex.id);
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => handleSelect(ex)}
                      disabled={addSetMutation.isPending || alreadyAdded}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted disabled:pointer-events-none disabled:opacity-50"
                    >
                      <div>
                        <p className="text-sm font-medium">{ex.name}</p>
                        {alreadyAdded && (
                          <Badge variant="outline" className="mt-0.5 py-0 text-[10px]">already in workout</Badge>
                        )}
                      </div>
                      <Plus className="size-5 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Save As Template Dialog ──
function SaveAsTemplateButton({ workoutId }: { workoutId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (name: string) =>
      api.templates.createFromWorkout({ name, workout_id: workoutId }),
    onSuccess: () => {
      setOpen(false);
      router.push("/settings");
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to save template"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || saveMutation.isPending) return;
    setError(null);
    saveMutation.mutate(name.trim());
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
              disabled={saveMutation.isPending}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button
            type="submit"
            className="w-full rounded-xl"
            disabled={!name.trim() || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──
export default function WorkoutDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const workoutId = params.id;
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [editingEndDate, setEditingEndDate] = useState(false);
  const [historyExercise, setHistoryExercise] = useState<{ id: string; name: string } | null>(null);
  const [endDialogOpen, setEndDialogOpen] = useState(false);

  const { data: workout, isLoading } = useWorkout(workoutId);
  const endWorkoutMutation = useEndWorkout(workoutId);
  const deleteWorkoutMutation = useDeleteWorkout();

  function handleDeleteWorkout() {
    if (deleteWorkoutMutation.isPending) return;
    if (!window.confirm("Delete this entire workout? This cannot be undone.")) return;
    deleteWorkoutMutation.mutate(workoutId, {
      onSuccess: () => router.push("/workouts"),
    });
  }

  if (!workoutId) return null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
        <p className="text-muted-foreground">Workout not found.</p>
      </div>
    );
  }

  const isActive = !workout.ended_at;
  const endWorkoutWithIntensity = (intensity?: "light" | "moderate" | "vigorous") => {
    endWorkoutMutation.mutate(intensity);
    setEndDialogOpen(false);
  };

  // Group sets by exercise
  const groupedSets = (workout.sets ?? []).reduce<
    { exercise: Exercise; sets: typeof workout.sets }[]
  >((acc, set) => {
    // We trust that set.exercise is populated because of the backend query
    if (!set.exercise) return acc;

    const existing = acc.find((g) => g.exercise.id === set.exercise_id);
    if (existing) {
      existing.sets.push(set);
    } else {
      acc.push({ exercise: set.exercise, sets: [set] });
    }
    return acc;
  }, []);

  const existingExerciseIds = new Set(groupedSets.map((g) => g.exercise.id));

  const started = new Date(workout.started_at).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Format datetime for native input
  const startedLocalIso = (() => {
    const d = new Date(workout.started_at);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  })();

  const endedLocalIso = workout.ended_at
    ? (() => {
        const d = new Date(workout.ended_at);
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - offset * 60000);
        return local.toISOString().slice(0, 16);
      })()
    : "";

  const endedDisplay = workout.ended_at
    ? new Date(workout.ended_at).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  async function handleDateChange(value: string) {
    if (!value) return;
    const newDate = new Date(value).toISOString();
    // Optimistic update
    queryClient.setQueryData<WorkoutWithSets>(["workout", workoutId], (old) => {
      if (!old) return old;
      return { ...old, started_at: newDate };
    });
    setEditingDate(false);
    try {
      await api.workouts.update(workoutId, { started_at: newDate });
    } finally {
      queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    }
  }

  async function handleEndDateChange(value: string) {
    if (!value) return;
    const newDate = new Date(value).toISOString();
    queryClient.setQueryData<WorkoutWithSets>(["workout", workoutId], (old) => {
      if (!old) return old;
      const started = new Date(old.started_at).getTime();
      const ended = new Date(newDate).getTime();
      const duration_seconds = Math.max(0, Math.floor((ended - started) / 1000));
      return { ...old, ended_at: newDate, duration_seconds };
    });
    setEditingEndDate(false);
    try {
      await api.workouts.update(workoutId, { ended_at: newDate });
    } finally {
      queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {isActive ? "Workout" : "Workout Summary"}
          </h1>
          {editingDate ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="datetime-local"
                defaultValue={startedLocalIso}
                onChange={(e) => handleDateChange(e.target.value)}
                className="text-sm rounded-lg border border-border bg-background px-2 py-1"
                autoFocus
              />
              <Button size="sm" variant="ghost" className="size-7 p-0" onClick={() => setEditingDate(false)}>
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setEditingDate(true)}
              className="flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground transition-colors group"
            >
              <CalendarDays className="size-3.5 opacity-50 group-hover:opacity-100" />
              Started: {started}
              <Pencil className="size-3 opacity-0 group-hover:opacity-50" />
            </button>
          )}
          {!isActive && endedDisplay && (
            editingEndDate ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="datetime-local"
                  defaultValue={endedLocalIso}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="text-sm rounded-lg border border-border bg-background px-2 py-1"
                  autoFocus
                />
                <Button size="sm" variant="ghost" className="size-7 p-0" onClick={() => setEditingEndDate(false)}>
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setEditingEndDate(true)}
                className="flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground transition-colors group mt-0.5"
              >
                <CalendarDays className="size-3.5 opacity-50 group-hover:opacity-100" />
                Ended: {endedDisplay}
                <Pencil className="size-3 opacity-0 group-hover:opacity-50" />
              </button>
            )
          )}
          {workout.notes && (
            <p className="text-muted-foreground text-sm mt-0.5">{workout.notes}</p>
          )}
        </div>
        {isActive && <LiveTimer startedAt={workout.started_at} />}
        {!isActive && (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            onClick={handleDeleteWorkout}
            disabled={deleteWorkoutMutation.isPending}
          >
            {deleteWorkoutMutation.isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Trash2 className="size-5" />
            )}
          </Button>
        )}
      </div>

      {/* Action Buttons for Active Workout */}
      {isActive && (
        <div className="flex gap-2 mb-5">
          <Button
            className="flex-1 rounded-xl py-5"
            size="lg"
            onClick={() => setExercisePickerOpen(true)}
          >
            <Plus className="mr-2 size-5" />
            Add Exercise
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-xl py-5"
            onClick={() => setEndDialogOpen(true)}
            disabled={endWorkoutMutation.isPending}
          >
            {endWorkoutMutation.isPending ? (
              <Loader2 className="mr-2 size-5 animate-spin" />
            ) : (
              <StopCircle className="mr-2 size-5" />
            )}
            End
          </Button>
        </div>
      )}

      {/* End workout: optional intensity */}
      <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>End workout</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Optional: How intense was this workout? (Improves calorie estimate)</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => endWorkoutWithIntensity("light")} disabled={endWorkoutMutation.isPending}>
              Light
            </Button>
            <Button size="sm" variant="outline" onClick={() => endWorkoutWithIntensity("moderate")} disabled={endWorkoutMutation.isPending}>
              Moderate
            </Button>
            <Button size="sm" variant="outline" onClick={() => endWorkoutWithIntensity("vigorous")} disabled={endWorkoutMutation.isPending}>
              Vigorous
            </Button>
            <Button size="sm" variant="ghost" onClick={() => endWorkoutWithIntensity()} disabled={endWorkoutMutation.isPending}>
              Skip
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exercise Cards */}
      {groupedSets.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No exercises yet. Tap &quot;Add Exercise&quot; to get started.
          </CardContent>
        </Card>
      )}

      {/* Add Exercise Button - always visible for completed */}
      {!isActive && (
        <Button
          variant="outline"
          className="w-full rounded-xl mt-4"
          size="lg"
          onClick={() => setExercisePickerOpen(true)}
        >
          <Plus className="mr-2 size-5" />
          Add Exercise
        </Button>
      )}

      {groupedSets.length > 0 && (
        <div className="space-y-3">
          {groupedSets.map(({ exercise, sets }) => (
            <WorkoutExerciseCard
              key={exercise.id}
              workoutId={workout.id}
              exercise={exercise}
              sets={sets}
              onOpenHistory={() => {
                // We'll implemented a local state for this if needed, 
                // but since the HistorySheet is now independent, we can let the card handle it
                // OR we can lift the state up if we want only one sheet.
                // For now, let's use a simple per-exercise state inside the map?
                // Actually, duplicate sheets are heavy. Ideally we use one global sheet state in this Page.
                setHistoryExercise({ id: exercise.id, name: exercise.name });
              }}
            />
          ))}
        </div>
      )}

      {/* Shared History Key */}
      <ExerciseHistorySheet
        exerciseId={historyExercise?.id ?? ""}
        exerciseName={historyExercise?.name ?? ""}
        workoutId={workout.id}
        open={!!historyExercise}
        onOpenChange={(v) => !v && setHistoryExercise(null)}
      />

      {/* Completed workout footer */}
      {!isActive && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Duration:{" "}
              {workout.duration_seconds != null
                ? formatDuration(workout.duration_seconds)
                : "—"}
            </span>
            <span>
              {groupedSets.length} exercise{groupedSets.length !== 1 ? "s" : ""} ·{" "}
              {workout.sets.length} set{workout.sets.length !== 1 ? "s" : ""}
            </span>
          </div>
          {workout.estimated_calories != null && (
            <p className="text-sm text-muted-foreground">
              Est. calories burned: ~{Math.round(workout.estimated_calories)} kcal
            </p>
          )}
          {groupedSets.length > 0 && (
            <SaveAsTemplateButton workoutId={workout.id} />
          )}
        </div>
      )}

      {/* Exercise Picker Modal */}
      <ExercisePickerModal
        workoutId={workout.id}
        existingExerciseIds={existingExerciseIds}
        open={exercisePickerOpen}
        onOpenChange={setExercisePickerOpen}
      />
    </div>
  );
}
