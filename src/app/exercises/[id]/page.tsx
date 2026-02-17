"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notFound, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Loader2, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExerciseProgressionCharts, type TimeRangeValue } from "@/components/ExerciseProgressionCharts";

function getRangeDates(
  range: TimeRangeValue,
  customFrom?: string,
  customTo?: string
): { from: Date; to: Date } | null {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  if (range === "custom" && customFrom && customTo) {
    const from = new Date(customFrom);
    const toDate = new Date(customTo);
    toDate.setHours(23, 59, 59, 999);
    return { from, to: toDate };
  }
  const from = new Date();
  if (range === "1w") from.setDate(from.getDate() - 7);
  else if (range === "1m") from.setMonth(from.getMonth() - 1);
  else if (range === "2m") from.setMonth(from.getMonth() - 2);
  else if (range === "3m") from.setMonth(from.getMonth() - 3);
  else if (range === "1y") from.setFullYear(from.getFullYear() - 1);
  else if (range === "all") return null;
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

function modeLabel(mode: string) {
  switch (mode) {
    case "weight_reps": return "Weight × Reps";
    case "time": return "Time";
    case "bodyweight_reps": return "Bodyweight";
    default: return mode;
  }
}

export default function ExerciseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const exerciseId = params.id;
  const [timeRange, setTimeRange] = useState<TimeRangeValue>("1m");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.exercises.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      setDeleteDialogOpen(false);
      router.push("/exercises");
    },
  });

  const { data: exercise, isLoading: exLoading } = useQuery({
    queryKey: ["exercise", exerciseId],
    queryFn: () => api.exercises.get(exerciseId),
    enabled: !!exerciseId,
  });

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorObj,
  } = useQuery({
    queryKey: ["exerciseStats", exerciseId],
    queryFn: () => api.exercises.getStats(exerciseId),
    enabled: !!exerciseId,
  });

  const range = useMemo(
    () => getRangeDates(timeRange, customFrom, customTo),
    [timeRange, customFrom, customTo]
  );

  const filteredStats = useMemo(() => {
    if (!stats) return null;
    if (!range) return stats;
    const { from, to } = range;
    const inRange = (dateStr: string) => {
      const d = new Date(dateStr);
      return d >= from && d <= to;
    };
    return {
      ...stats,
      one_rm_progression: stats.one_rm_progression.filter((p) => inRange(p.date)),
      volume_history: stats.volume_history.filter((p) => inRange(p.date)),
      max_weight_history: stats.max_weight_history.filter((p) => inRange(p.date)),
      recent_history: stats.recent_history.filter((h) =>
        h.started_at ? inRange(h.started_at) : false
      ),
    };
  }, [stats, range]);

  if (!exerciseId) return notFound();

  if (exLoading) {
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

  if (!exercise) return notFound();

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/exercises"
          className="inline-flex items-center gap-1 text-muted-foreground text-sm mb-3 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          All Exercises
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{exercise.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="font-normal">
                {modeLabel(exercise.measurement_mode)}
              </Badge>
              {exercise.primary_muscle_group && (
                <Link
                  href={`/muscle-groups/${exercise.primary_muscle_group.id}`}
                  className="text-muted-foreground text-sm hover:underline hover:text-primary transition-colors"
                >
                  {exercise.primary_muscle_group.name}
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href={`/stats/progression?exercise=${exercise.id}`}>
                <TrendingUp className="mr-1.5 size-4" />
                Progression
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href={`/exercises/${exercise.id}/edit`}>Edit</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete exercise</DialogTitle>
            <DialogDescription>
              Delete &quot;{exercise.name}&quot;? This cannot be undone. Any sets logged for this exercise will remain in workout history, but the exercise definition will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={() => deleteMutation.mutate(exercise.id)}
              disabled={deleteMutation.isPending}
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

      {exercise.description && (
        <Card className="mb-4">
          <CardContent className="py-4">
            <p className="text-muted-foreground text-sm">{exercise.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Muscle groups */}
      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-6">
        {exercise.primary_muscle_group && (
          <Link href={`/muscle-groups/${exercise.primary_muscle_group.id}`}>
            <Badge variant="outline" className="hover:bg-muted cursor-pointer transition-colors">
              Primary: {exercise.primary_muscle_group.name}
            </Badge>
          </Link>
        )}
        {exercise.secondary_muscle_group && (
          <Link href={`/muscle-groups/${exercise.secondary_muscle_group.id}`}>
            <Badge variant="outline" className="hover:bg-muted cursor-pointer transition-colors">
              Secondary: {exercise.secondary_muscle_group.name}
            </Badge>
          </Link>
        )}
        {exercise.tertiary_muscle_group && (
          <Link href={`/muscle-groups/${exercise.tertiary_muscle_group.id}`}>
            <Badge variant="outline" className="hover:bg-muted cursor-pointer transition-colors">
              Tertiary: {exercise.tertiary_muscle_group.name}
            </Badge>
          </Link>
        )}
      </div>

      {statsError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading statistics</AlertTitle>
          <AlertDescription>
            {statsErrorObj instanceof Error
              ? statsErrorObj.message
              : "Failed to load exercise statistics."}
          </AlertDescription>
        </Alert>
      )}

      {statsLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      )}

      {stats && filteredStats && (
        <ExerciseProgressionCharts
          exercise={{ id: exercise.id, name: exercise.name, unit: exercise.unit }}
          stats={stats}
          filteredStats={filteredStats}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
        />
      )}
    </div>
  );
}
