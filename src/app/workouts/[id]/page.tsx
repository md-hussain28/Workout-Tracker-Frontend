"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  StopCircle,
  Trophy,
  LayoutTemplate,
  X,
  ChevronDown,
  Timer,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";
import { api, type Exercise, type WorkoutWithSets, type WorkoutSet, type WorkoutSetCreate } from "@/lib/api";
import { useWorkout, useAddSet, useEndWorkout } from "@/lib/hooks/use-workout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

// ── Exercise Card with Sets ──
function ExerciseSetCard({
  exerciseId,
  exerciseName,
  sets,
  workoutId,
  unit,
}: {
  exerciseId: number;
  exerciseName: string;
  sets: (WorkoutSet & { exercise?: Exercise })[];
  workoutId: number;
  unit: string;
}) {
  const queryClient = useQueryClient();
  const addSetMutation = useAddSet(workoutId);
  const [adding, setAdding] = useState(false);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [editingSetId, setEditingSetId] = useState<number | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editReps, setEditReps] = useState("");

  // Auto-populate from previous set
  useEffect(() => {
    if (sets.length > 0) {
      const last = sets[sets.length - 1];
      if (last.weight != null) setWeight(String(last.weight));
      if (last.reps != null) setReps(String(last.reps));
    }
  }, [sets.length]);

  function handleAddSet() {
    const nextOrder = sets.length;
    const payload: WorkoutSetCreate = {
      exercise_id: exerciseId,
      set_order: nextOrder,
    };
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (!isNaN(w)) payload.weight = w;
    if (!isNaN(r)) payload.reps = r;

    addSetMutation.mutate(payload);
    setAdding(false);
  }

  function startEditing(s: WorkoutSet) {
    if (s.id < 0) return;
    setEditingSetId(s.id);
    setEditWeight(s.weight != null ? String(s.weight) : "");
    setEditReps(s.reps != null ? String(s.reps) : "");
  }

  async function handleSaveEdit(setId: number) {
    const w = parseFloat(editWeight);
    const r = parseInt(editReps, 10);
    await api.workouts.updateSet(workoutId, setId, {
      weight: !isNaN(w) ? w : null,
      reps: !isNaN(r) ? r : null,
    });
    queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
    setEditingSetId(null);
  }

  async function handleDeleteSet(setId: number) {
    await api.workouts.deleteSet(workoutId, setId);
    queryClient.invalidateQueries({ queryKey: ["workout", workoutId] });
    setEditingSetId(null);
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold">{exerciseName}</p>
          <Badge variant="secondary" className="text-xs font-normal">
            {sets.length} set{sets.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Set Header */}
        {sets.length > 0 && (
          <div className="grid grid-cols-[40px_1fr_1fr_40px] gap-2 text-xs font-medium text-muted-foreground mb-1 px-1">
            <span>SET</span>
            <span>{unit.toUpperCase()}</span>
            <span>REPS</span>
            <span></span>
          </div>
        )}

        {/* Set Rows */}
        <ul className="space-y-1">
          {sets
            .sort((a, b) => a.set_order - b.set_order || a.id - b.id)
            .map((s, idx) =>
              editingSetId === s.id ? (
                <li key={s.id} className="pt-1">
                  <div className="grid grid-cols-[40px_1fr_1fr_40px] gap-2 items-center mb-2 px-1">
                    <span className="text-muted-foreground text-sm font-medium">{idx + 1}</span>
                    <Input
                      type="number"
                      step="0.5"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      className="h-9 rounded-lg text-sm"
                      autoFocus
                    />
                    <Input
                      type="number"
                      value={editReps}
                      onChange={(e) => setEditReps(e.target.value)}
                      className="h-9 rounded-lg text-sm"
                    />
                    <Button size="sm" variant="ghost" className="size-8 p-0" onClick={() => setEditingSetId(null)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 rounded-lg" onClick={() => handleSaveEdit(s.id)}>Save</Button>
                    <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => handleDeleteSet(s.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ) : (
                <li
                  key={s.id}
                  onClick={() => startEditing(s)}
                  className={`grid grid-cols-[40px_1fr_1fr_40px] gap-2 items-center py-2 px-1 rounded-lg text-sm cursor-pointer hover:bg-muted/50 transition-colors ${s.id < 0 ? "opacity-50 pointer-events-none" : ""
                    }`}
                >
                  <span className="text-muted-foreground font-medium">{idx + 1}</span>
                  <span className="font-medium tabular-nums">{s.weight != null ? s.weight : "—"}</span>
                  <span className="font-medium tabular-nums">
                    {s.reps != null ? s.reps : s.duration_seconds ? `${s.duration_seconds}s` : "—"}
                  </span>
                  <div className="flex items-center justify-end gap-1">
                    {s.is_pr && <Trophy className="size-4 text-amber-500" />}
                    <Pencil className="size-3 text-muted-foreground/40" />
                  </div>
                </li>
              )
            )}
        </ul>

        {/* Inline Add Set */}
        {adding ? (
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="grid grid-cols-[40px_1fr_1fr_40px] gap-2 items-center mb-2">
              <span className="text-muted-foreground text-sm font-medium">
                {sets.length + 1}
              </span>
              <Input
                type="number"
                step="0.5"
                placeholder="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="h-9 rounded-lg text-sm"
                autoFocus
              />
              <Input
                type="number"
                placeholder="0"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="h-9 rounded-lg text-sm"
              />
              <Button
                size="sm"
                variant="ghost"
                className="size-8 p-0"
                onClick={() => setAdding(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <Button
              size="sm"
              className="w-full rounded-lg"
              onClick={handleAddSet}
              disabled={addSetMutation.isPending}
            >
              {addSetMutation.isPending ? "Adding…" : "Save Set"}
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-primary hover:text-primary rounded-lg"
            onClick={() => setAdding(true)}
          >
            <Plus className="mr-1 size-4" />
            Add Set
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── Exercise Picker Sheet ──
function ExercisePickerSheet({
  workoutId,
  open,
  onOpenChange,
}: {
  workoutId: number;
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

  function handleSelect(ex: Exercise) {
    addSetMutation.mutate({
      exercise_id: ex.id,
      set_order: 0,
    });
    onOpenChange(false);
    setSearch("");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t pt-6 pb-[max(env(safe-area-inset-bottom),24px)] max-h-[80dvh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Add Exercise</SheetTitle>
        </SheetHeader>
        <div className="relative mt-4 mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
            autoFocus
          />
        </div>
        <ul className="space-y-1">
          {filtered.map((ex) => (
            <li key={ex.id}>
              <button
                onClick={() => handleSelect(ex)}
                className="w-full flex items-center justify-between py-3 px-3 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors text-left"
              >
                <div>
                  <p className="font-medium text-sm">{ex.name}</p>
                  {ex.primary_muscle_group && (
                    <p className="text-muted-foreground text-xs">
                      {ex.primary_muscle_group.name}
                    </p>
                  )}
                </div>
                <Plus className="size-5 text-muted-foreground" />
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="text-center py-6 text-muted-foreground text-sm">
              No exercises found.
            </li>
          )}
        </ul>
      </SheetContent>
    </Sheet>
  );
}

// ── Save As Template Dialog ──
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
      router.push("/settings");
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

// ── Main Page ──
export default function WorkoutDetailPage() {
  const params = useParams<{ id: string }>();
  const workoutId = parseInt(params.id, 10);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);

  const { data: workout, isLoading } = useWorkout(workoutId);
  const endWorkoutMutation = useEndWorkout(workoutId);

  if (isNaN(workoutId)) return null;

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

  // Group sets by exercise
  const groupedSets = (workout.sets ?? []).reduce<
    { exercise: { id: number; name: string; unit: string }; sets: typeof workout.sets }[]
  >((acc, set) => {
    const name = set.exercise?.name ?? `Exercise #${set.exercise_id}`;
    const unit = set.exercise?.unit ?? "kg";
    const existing = acc.find((g) => g.exercise.id === set.exercise_id);
    if (existing) {
      existing.sets.push(set);
    } else {
      acc.push({ exercise: { id: set.exercise_id, name, unit }, sets: [set] });
    }
    return acc;
  }, []);

  const started = new Date(workout.started_at).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {isActive ? "Workout" : "Workout Summary"}
          </h1>
          <p className="text-muted-foreground text-sm">{started}</p>
          {workout.notes && (
            <p className="text-muted-foreground text-sm mt-0.5">{workout.notes}</p>
          )}
        </div>
        {isActive && <LiveTimer startedAt={workout.started_at} />}
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
            onClick={() => endWorkoutMutation.mutate()}
            disabled={endWorkoutMutation.isPending}
          >
            <StopCircle className="mr-2 size-5" />
            End
          </Button>
        </div>
      )}

      {/* Exercise Cards */}
      {groupedSets.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            No exercises yet. Tap &quot;Add Exercise&quot; to get started.
          </CardContent>
        </Card>
      )}

      {/* Add Exercise Button - always visible */}
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
            <ExerciseSetCard
              key={exercise.id}
              exerciseId={exercise.id}
              exerciseName={exercise.name}
              sets={sets}
              workoutId={workout.id}
              unit={exercise.unit}
            />
          ))}
        </div>
      )}

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
          {groupedSets.length > 0 && (
            <SaveAsTemplateButton workoutId={workout.id} />
          )}
        </div>
      )}

      {/* Exercise Picker */}
      <ExercisePickerSheet
        workoutId={workout.id}
        open={exercisePickerOpen}
        onOpenChange={setExercisePickerOpen}
      />
    </div>
  );
}
