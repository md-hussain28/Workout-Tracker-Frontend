"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Exercise, type MuscleGroup } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Dumbbell, Trash2, Loader2 } from "lucide-react";

type TabMode = "exercises" | "muscles";
type SortOption = "name" | "count";

function modeLabel(mode: string) {
  switch (mode) {
    case "weight_reps": return "Weight × Reps";
    case "time": return "Time";
    case "bodyweight_reps": return "Bodyweight";
    default: return mode;
  }
}

// ── Add Muscle Group Dialog ──
const MUSCLE_COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#22c55e", // Green
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#64748b", // Slate
];

function AddMuscleGroupDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (data: { name: string; color?: string | null }) =>
      api.muscleGroups.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["muscleGroups"] });
      setOpen(false);
      setName("");
      setColor(null);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="rounded-xl">
          <Plus className="mr-1 size-4" />
          Add Muscle
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add muscle group</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || createMutation.isPending) return;
            createMutation.mutate({ name: name.trim(), color });
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="mg-name">Name</Label>
            <Input
              id="mg-name"
              placeholder="e.g. Chest, Biceps, Quads"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Color (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c === color ? null : c)}
                  className={`size-8 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""
                    }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          {createMutation.isError && (
            <p className="text-destructive text-sm">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create"}
            </p>
          )}
          <Button
            type="submit"
            className="w-full rounded-xl"
            disabled={!name.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ExercisesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabMode>("exercises");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.exercises.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      setExerciseToDelete(null);
    },
  });

  const { data: exercises = [], isLoading: isLoadingExercises } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => api.exercises.list(),
  });

  const { data: muscleGroups = [], isLoading: isLoadingMuscleGroups } = useQuery({
    queryKey: ["muscleGroups"],
    queryFn: () => api.muscleGroups.list(),
  });

  const isLoading = isLoadingExercises || isLoadingMuscleGroups;

  const q = search.toLowerCase().trim();

  // Filter exercises
  const filteredExercises = useMemo(() => {
    if (!q) return exercises;
    return exercises.filter(
      (ex) =>
        ex.name.toLowerCase().includes(q) ||
        ex.primary_muscle_group?.name.toLowerCase().includes(q)
    );
  }, [exercises, q]);

  // Group exercises by primary muscle group
  const grouped = useMemo(() => {
    const map = new Map<string, Exercise[]>();
    for (const ex of filteredExercises) {
      const key = ex.primary_muscle_group?.name ?? "Uncategorized";
      const arr = map.get(key) ?? [];
      arr.push(ex);
      map.set(key, arr);
    }
    return map;
  }, [filteredExercises]);

  // Exercises per muscle group (for display counts)
  const exercisesByMuscle = useMemo(() => {
    const map = new Map<string, Exercise[]>();
    for (const ex of exercises) {
      if (ex.primary_muscle_group_id) {
        const arr = map.get(ex.primary_muscle_group_id) ?? [];
        arr.push(ex);
        map.set(ex.primary_muscle_group_id, arr);
      }
    }
    return map;
  }, [exercises]);

  // Filter & Sort muscle groups
  const filteredMuscleGroups = useMemo(() => {
    let result = [...muscleGroups];
    if (q) {
      result = result.filter((mg) => mg.name.toLowerCase().includes(q));
    }
    return result.sort((a, b) => {
      if (sortBy === "count") {
        const countA = exercisesByMuscle.get(a.id)?.length ?? 0;
        const countB = exercisesByMuscle.get(b.id)?.length ?? 0;
        if (countA !== countB) return countB - countA;
      }
      return a.name.localeCompare(b.name);
    });
  }, [muscleGroups, q, sortBy, exercisesByMuscle]);

  return (
    <div className="mx-auto max-w-lg flex flex-col h-[calc(100vh-72px)]">
      <div className="shrink-0 px-4 pt-6 pb-2 bg-background z-10">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Exercises</h1>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises or muscles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-2 p-1 bg-muted rounded-xl">
          <button
            onClick={() => setTab("exercises")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "exercises"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            My Exercises
          </button>
          <button
            onClick={() => setTab("muscles")}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "muscles"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Muscle Groups
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20 scrollbar-hide">
        {/* My Exercises Tab */}
        {tab === "exercises" && (
          <>
            {isLoading && (
              <div className="space-y-2 pt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded-xl">
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[140px]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!isLoading && filteredExercises.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Dumbbell className="size-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">
                    {exercises.length === 0 ? "No exercises yet" : "No matches"}
                  </p>
                  <p className="text-sm mt-1">
                    {exercises.length === 0
                      ? "Add exercises to log sets during workouts."
                      : "Try a different search term."}
                  </p>
                </CardContent>
              </Card>
            )}
            {!isLoading && filteredExercises.length > 0 && (
              <div className="space-y-5 pt-2">
                {Array.from(grouped.entries()).map(([group, exs]) => (
                  <div key={group}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                      {group}
                    </p>
                    <ul className="space-y-2">
                      {exs.map((ex) => (
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
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground text-sm">View</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      router.push(`/exercises/${ex.id}/edit`);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setExerciseToDelete(ex);
                                    }}
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Muscle Groups Tab */}
        {tab === "muscles" && (
          <div className="pt-2">
            <div className="mb-4 flex items-center justify-end gap-2">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[140px] rounded-xl h-9 text-xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Alphabetical</SelectItem>
                  <SelectItem value="count">Most Exercises</SelectItem>
                </SelectContent>
              </Select>
              <AddMuscleGroupDialog />
            </div>

            {isLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-xl">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-3 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-3 w-[60px]" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-8 rounded-full" />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && filteredMuscleGroups.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p className="font-medium">No muscle groups</p>
                  <p className="text-sm mt-1">
                    Add muscle groups to categorize your exercises.
                  </p>
                </CardContent>
              </Card>
            )}
            {!isLoading && filteredMuscleGroups.length > 0 && (
              <ul className="space-y-2">
                {filteredMuscleGroups.map((mg) => {
                  const count = exercisesByMuscle.get(mg.id)?.length ?? 0;
                  return (
                    <li key={mg.id}>
                      <Link href={`/muscle-groups/${mg.id}`}>
                        <Card className="transition-colors hover:bg-muted/50 active:bg-muted">
                          <CardContent className="flex items-center justify-between py-4">
                            <div className="flex items-center gap-3">
                              {mg.color && (
                                <div
                                  className="size-3 rounded-full"
                                  style={{ backgroundColor: mg.color }}
                                />
                              )}
                              <div>
                                <p className="font-medium">{mg.name}</p>
                                <p className="text-muted-foreground text-sm">
                                  {count} exercise{count !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {count}
                            </Badge>
                          </CardContent>
                        </Card>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Delete exercise confirmation */}
      <Dialog
        open={exerciseToDelete !== null}
        onOpenChange={(open) => !open && setExerciseToDelete(null)}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete exercise</DialogTitle>
            <DialogDescription>
              {exerciseToDelete
                ? `Delete "${exerciseToDelete.name}"? This cannot be undone. The exercise will be removed from your list.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setExerciseToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={() =>
                exerciseToDelete && deleteMutation.mutate(exerciseToDelete.id)
              }
              disabled={!exerciseToDelete || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button – Add Exercise */}
      <Link
        href="/exercises/new"
        className="fixed bottom-[calc(72px+max(env(safe-area-inset-bottom),8px)+16px)] right-5 z-40 flex size-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/25 text-primary-foreground transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="size-6" />
      </Link>
    </div>
  );
}
