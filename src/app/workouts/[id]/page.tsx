"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";
import { api, type Exercise, type WorkoutWithSets, type WorkoutSet, type WorkoutSetCreate } from "@/lib/api";
import { useWorkout, useAddSet, useUpdateSet, useDeleteSet, useEndWorkout, useDeleteWorkout, useDeleteExerciseSets } from "@/lib/hooks/use-workout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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

// ── Exercise History Sheet ──
function ExerciseHistorySheet({
  exerciseId,
  exerciseName,
  workoutId,
  open,
  onOpenChange,
  onApplyStats,
}: {
  exerciseId: number;
  exerciseName: string;
  workoutId: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onApplyStats?: (weight: number, reps: number) => void;
}) {
  const { data: stats } = useQuery({
    queryKey: ["exerciseStats", exerciseId],
    queryFn: () => api.exercises.getStats(exerciseId),
    enabled: open,
  });

  const { data: prev } = useQuery({
    queryKey: ["previousSession", exerciseId, workoutId],
    queryFn: () => api.previousSession.get(exerciseId, workoutId),
    enabled: open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t pt-6 pb-[max(env(safe-area-inset-bottom),24px)] max-h-[80dvh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="size-5" />
            {exerciseName}
          </SheetTitle>
          {onApplyStats && <p className="text-xs text-muted-foreground font-normal">Tap a set to copy stats</p>}
        </SheetHeader>

        {stats && (
          <div className="mt-4 space-y-4">
            {/* PRs & Stats */}
            <div className="grid grid-cols-3 gap-2">
              {stats.prs.best_weight != null && (
                <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-muted-foreground">Best Weight</p>
                  <p className="font-bold tabular-nums">{stats.prs.best_weight}</p>
                </div>
              )}
              {stats.prs.best_1rm != null && (
                <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-muted-foreground">Est. 1RM</p>
                  <p className="font-bold tabular-nums">{Math.round(stats.prs.best_1rm)}</p>
                </div>
              )}
              {stats.prs.best_reps != null && (
                <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-muted-foreground">Best Reps</p>
                  <p className="font-bold tabular-nums">{stats.prs.best_reps}</p>
                </div>
              )}
              {stats.prs.best_volume != null && (
                <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-muted-foreground">Best Vol</p>
                  <p className="font-bold tabular-nums">{stats.prs.best_volume}</p>
                </div>
              )}
              <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                <p className="text-xs text-muted-foreground">Total Sets</p>
                <p className="font-bold tabular-nums">{stats.total_sets}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                <p className="text-xs text-muted-foreground">Workouts</p>
                <p className="font-bold tabular-nums">{stats.total_workouts}</p>
              </div>
            </div>

            {/* 1RM Progression mini */}
            {stats.one_rm_progression.length > 0 ? (
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <TrendingUp className="size-3" /> 1RM Progression
                </p>
                <div className="flex items-end gap-[2px] h-10">
                  {stats.one_rm_progression.length > 1 ? (
                    (() => {
                      const points = stats.one_rm_progression;
                      const max = Math.max(...points.map((p) => p.estimated_1rm));
                      const min = Math.min(...points.map((p) => p.estimated_1rm));
                      const range = max - min || 1;
                      // Show last 20 points
                      const recent = points.slice(-20);
                      return recent.map((p, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-primary/60 rounded-t-sm min-w-[3px]"
                          style={{ height: `${Math.max(10, ((p.estimated_1rm - min) / range) * 100)}%` }}
                          title={`${Math.round(p.estimated_1rm)} · ${p.date ? new Date(p.date).toLocaleDateString() : ""}`}
                        />
                      ));
                    })()
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground/60 italic">
                      More data needed for graph
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-muted/30 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground italic">No 1RM data yet</p>
              </div>
            )}


            {/* Previous Session */}
            {prev && prev.sets.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Last Session{prev.workout_started_at ? ` · ${new Date(prev.workout_started_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
                </p>
                <div className="space-y-1">
                  {prev.sets
                    .sort((a, b) => a.set_order - b.set_order)
                    .map((s, idx) => (
                      <button
                        key={s.id}
                        className="w-full flex items-center gap-3 text-sm bg-muted/30 rounded-lg px-3 py-1.5 hover:bg-muted/50 active:bg-muted transition-colors"
                        onClick={() => s.weight != null && s.reps != null && onApplyStats?.(s.weight, s.reps)}
                      >
                        <span className="text-muted-foreground w-6 text-xs text-left">{idx + 1}</span>
                        <span className="font-medium tabular-nums">{s.weight ?? "—"}</span>
                        <span className="text-muted-foreground">×</span>
                        <span className="font-medium tabular-nums">{s.reps ?? (s.duration_seconds ? `${s.duration_seconds}s` : "—")}</span>
                        {s.set_label && (
                          <Badge variant="outline" className="text-[10px] ml-auto">{s.set_label}</Badge>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Recent History */}
            {/* Recent History */}
            {stats.recent_history.filter((h) => h.workout_id !== workoutId).length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Recent History</p>
                {stats.recent_history
                  .filter((h) => h.workout_id !== workoutId)
                  .slice(0, 5)
                  .map((h) => (
                    <div key={h.workout_id} className="mb-2">
                      <p className="text-xs text-muted-foreground mb-1">
                        {h.started_at
                          ? new Date(h.started_at).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })
                          : "—"}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {h.sets.map((s, idx) => (
                          <button
                            key={idx}
                            className={`text-xs px-2 py-0.5 rounded-md tabular-nums hover:opacity-80 active:opacity-60 transition-opacity ${s.is_pr ? "bg-amber-500/15 text-amber-600 font-medium" : "bg-muted/50"
                              }`}
                            onClick={() => s.weight != null && s.reps != null && onApplyStats?.(s.weight, s.reps)}
                          >
                            {s.weight ?? "BW"}×
                            {s.reps ?? (s.duration_seconds ? `${s.duration_seconds}s` : "—")}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {!stats && (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted/50 animate-pulse rounded-xl" />
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
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
  const addSetMutation = useAddSet(workoutId);
  const updateSetMutation = useUpdateSet(workoutId);
  const deleteSetMutation = useDeleteSet(workoutId);
  const deleteExerciseSetsMutation = useDeleteExerciseSets(workoutId);

  const [adding, setAdding] = useState(false);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [editingSetId, setEditingSetId] = useState<number | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editReps, setEditReps] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [prToast, setPrToast] = useState<string | null>(null);

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

    addSetMutation.mutate(payload, {
      onSuccess: (newSet) => {
        if (newSet.is_pr && newSet.pr_type) {
          setPrToast(newSet.pr_type);
        }
      },
    });
    setAdding(false);
  }

  function startEditing(s: WorkoutSet) {
    if (s.id < 0) return;
    setEditingSetId(s.id);
    setEditWeight(s.weight != null ? String(s.weight) : "");
    setEditReps(s.reps != null ? String(s.reps) : "");
  }

  function handleSaveEdit(setId: number) {
    const w = parseFloat(editWeight);
    const r = parseInt(editReps, 10);
    updateSetMutation.mutate({
      setId,
      body: {
        weight: !isNaN(w) ? w : null,
        reps: !isNaN(r) ? r : null,
      },
    });
    setEditingSetId(null);
  }

  function handleDeleteSet(setId: number) {
    deleteSetMutation.mutate(setId);
    setEditingSetId(null);
  }

  function handleDeleteExercise() {
    if (!window.confirm("Remove this exercise and all its sets?")) return;
    const setIds = sets.map(s => s.id).filter(id => id > 0);
    deleteExerciseSetsMutation.mutate(setIds);
  }

  // Compute set quality indicator
  function setQuality(s: WorkoutSet): { label: string; color: string } | null {
    if (s.is_pr) return { label: "PR!", color: "text-amber-500" };
    // Compare to previous sets in this workout for this exercise
    const prevSets = sets.filter((ps) => ps.id !== s.id && ps.id > 0);
    if (prevSets.length === 0) return null;
    const lastSet = prevSets[prevSets.length - 1];
    if (s.weight != null && lastSet.weight != null) {
      if (s.weight > lastSet.weight) return { label: "↑", color: "text-green-500" };
      if (s.weight < lastSet.weight) return { label: "↓", color: "text-red-400" };
    }
    if (s.reps != null && lastSet.reps != null && s.weight === lastSet.weight) {
      if (s.reps > lastSet.reps) return { label: "+reps", color: "text-green-500" };
    }
    return null;
  }

  return (
    <>
      {prToast && <PrToast prType={prToast} onDismiss={() => setPrToast(null)} />}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold">{exerciseName}</p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setHistoryOpen(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50"
              >
                <History className="size-3.5" />
                History
              </button>
              <Badge variant="secondary" className="text-xs font-normal">
                {sets.length} set{sets.length !== 1 ? "s" : ""}
              </Badge>
              <Button size="icon" variant="ghost" className="size-6 text-muted-foreground hover:text-destructive" onClick={handleDeleteExercise}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          {/* Set Header */}
          <div className="grid grid-cols-[32px_1fr_1fr_56px] gap-2 text-xs font-medium text-muted-foreground mb-1 px-1">
            <span>SET</span>
            <span>{unit.toUpperCase()}</span>
            <span>REPS</span>
            <span></span>
          </div>

          {/* Set Rows */}
          <ul className="space-y-0.5">
            {sets
              .sort((a, b) => a.set_order - b.set_order || a.id - b.id)
              .map((s, idx) =>
                editingSetId === s.id ? (
                  <li key={s.id} className="py-1 px-1 bg-muted/30 rounded-lg">
                    <div className="grid grid-cols-[32px_1fr_1fr_32px] gap-2 items-center mb-2">
                      <span className="text-muted-foreground text-sm font-medium text-center">{idx + 1}</span>
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
                      <Button size="sm" className="flex-1 rounded-lg h-8" onClick={() => handleSaveEdit(s.id)}>
                        <Check className="size-4 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="destructive" className="rounded-lg h-8 px-3" onClick={() => handleDeleteSet(s.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                ) : (
                  <li
                    key={s.id}
                    onClick={() => startEditing(s)}
                    className={`grid grid-cols-[32px_1fr_1fr_56px] gap-2 items-center py-2 px-1 rounded-lg text-sm cursor-pointer hover:bg-muted/50 transition-colors ${s.id < 0 ? "opacity-50 pointer-events-none" : ""
                      }`}
                  >
                    <span className="text-muted-foreground font-medium text-center">{idx + 1}</span>
                    <span className="font-medium tabular-nums">{s.weight != null ? s.weight : "—"}</span>
                    <span className="font-medium tabular-nums">
                      {s.reps != null ? s.reps : s.duration_seconds ? `${s.duration_seconds}s` : "—"}
                    </span>
                    <div className="flex items-center justify-end gap-1">
                      {s.is_pr && <Trophy className="size-4 text-amber-500" />}
                      {(() => {
                        const q = setQuality(s);
                        if (q && !s.is_pr) return <span className={`text-xs font-medium ${q.color}`}>{q.label}</span>;
                        return null;
                      })()}
                      <Pencil className="size-3 text-muted-foreground/30" />
                    </div>
                  </li>
                )
              )}
          </ul>

          {/* Inline Add Set */}
          {adding ? (
            <div className="mt-2 pt-2 border-t border-border/50">
              <div className="grid grid-cols-[32px_1fr_1fr_32px] gap-2 items-center mb-2">
                <span className="text-muted-foreground text-sm font-medium text-center">
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
                <Button size="sm" variant="ghost" className="size-8 p-0" onClick={() => setAdding(false)}>
                  <X className="size-4" />
                </Button>
              </div>
              <Button
                size="sm"
                className="w-full rounded-lg"
                onClick={handleAddSet}
                disabled={addSetMutation.isPending}
              >
                <Check className="size-4 mr-1" />
                {addSetMutation.isPending ? "Adding…" : "Log Set"}
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

      <ExerciseHistorySheet
        exerciseId={exerciseId}
        exerciseName={exerciseName}
        workoutId={workoutId}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onApplyStats={(w, r) => {
          setWeight(String(w));
          setReps(String(r));
          setAdding(true);
          setHistoryOpen(false);
        }}
      />
    </>
  );
}

// ── Exercise Picker Modal ──
function ExercisePickerModal({
  workoutId,
  existingExerciseIds,
  open,
  onOpenChange,
}: {
  workoutId: number;
  existingExerciseIds: Set<number>;
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
    // Add first set with weight=0, reps=0 so it's immediately visible and editable
    addSetMutation.mutate({
      exercise_id: ex.id,
      set_order: 0,
      weight: 0,
      reps: 0,
    });
    onOpenChange(false);
    setSearch("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md max-h-[80dvh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle>Add Exercise</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
              autoFocus
            />
          </div>
        </div>
        <ul className="overflow-y-auto flex-1 px-4 pb-4 space-y-0.5">
          {filtered.map((ex) => {
            const alreadyAdded = existingExerciseIds.has(ex.id);
            return (
              <li key={ex.id}>
                <button
                  onClick={() => handleSelect(ex)}
                  className="w-full flex items-center justify-between py-3 px-3 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-sm">{ex.name}</p>
                    <div className="flex items-center gap-2">
                      {ex.primary_muscle_group && (
                        <p className="text-muted-foreground text-xs">{ex.primary_muscle_group.name}</p>
                      )}
                      {alreadyAdded && (
                        <Badge variant="outline" className="text-[10px] py-0">already in workout</Badge>
                      )}
                    </div>
                  </div>
                  <Plus className="size-5 text-muted-foreground" />
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="text-center py-8 text-muted-foreground text-sm">
              No exercises found.
            </li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
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
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const workoutId = parseInt(params.id, 10);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [editingDate, setEditingDate] = useState(false);

  const { data: workout, isLoading } = useWorkout(workoutId);
  const endWorkoutMutation = useEndWorkout(workoutId);
  const deleteWorkoutMutation = useDeleteWorkout();

  function handleDeleteWorkout() {
    if (!window.confirm("Delete this entire workout? This cannot be undone.")) return;
    deleteWorkoutMutation.mutate(workoutId, {
      onSuccess: () => router.push("/workouts"),
    });
  }

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
              {started}
              <Pencil className="size-3 opacity-0 group-hover:opacity-50" />
            </button>
          )}
          {workout.notes && (
            <p className="text-muted-foreground text-sm mt-0.5">{workout.notes}</p>
          )}
        </div>
        {isActive && <LiveTimer startedAt={workout.started_at} />}
        {!isActive && (
          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={handleDeleteWorkout}>
            <Trash2 className="size-5" />
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
