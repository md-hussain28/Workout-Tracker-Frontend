"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Dumbbell, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ExerciseProgressionCharts, type TimeRangeValue } from "@/components/ExerciseProgressionCharts";

const TIME_RANGES = [
  { value: "1w", label: "1 week" },
  { value: "1m", label: "1 month" },
  { value: "2m", label: "2 months" },
  { value: "3m", label: "3 months" },
  { value: "1y", label: "1 year" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom range" },
] as const;

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

export default function ExerciseProgressionPage() {
  const searchParams = useSearchParams();
  const exerciseParam = searchParams.get("exercise");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(exerciseParam || "");
  const [timeRange, setTimeRange] = useState<TimeRangeValue>("1m");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  useEffect(() => {
    if (exerciseParam) setSelectedExerciseId(exerciseParam);
  }, [exerciseParam]);

  const { data: exercises = [], isLoading: exercisesLoading } = useQuery({
    queryKey: ["exercises"],
    queryFn: () => api.exercises.list(),
  });

  const { data: exercise, isLoading: exerciseLoading } = useQuery({
    queryKey: ["exercise", selectedExerciseId],
    queryFn: () => api.exercises.get(selectedExerciseId),
    enabled: !!selectedExerciseId,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["exerciseStats", selectedExerciseId],
    queryFn: () => api.exercises.getStats(selectedExerciseId),
    enabled: !!selectedExerciseId,
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
      sets_reps_history: stats.sets_reps_history.filter((p) => inRange(p.date)),
      recent_history: stats.recent_history.filter((h) =>
        h.started_at ? inRange(h.started_at) : false
      ),
    };
  }, [stats, range]);

  const isLoading = exercisesLoading || (!!selectedExerciseId && (exerciseLoading || statsLoading));

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-24">
      <Link
        href="/analytics"
        className="inline-flex items-center gap-1 text-muted-foreground text-sm mb-4 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Stats
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Exercise progression</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Select an exercise to view its progress over time.
      </p>

      {/* Exercise selector */}
      <Card className="rounded-2xl border-border/80 shadow-sm mb-6">
        <CardContent className="py-4">
          <label className="text-sm font-medium mb-2 block">Exercise</label>
          <Select
            value={selectedExerciseId || "none"}
            onValueChange={(v) => setSelectedExerciseId(v === "none" ? "" : v)}
          >
            <SelectTrigger className="w-full rounded-xl h-12 text-base">
              <SelectValue placeholder="Choose an exercise..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="rounded-lg">
                <span className="text-muted-foreground">Choose an exercise...</span>
              </SelectItem>
              {exercises
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((ex) => (
                  <SelectItem key={ex.id} value={ex.id} className="rounded-lg">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="size-4 text-muted-foreground shrink-0" />
                      <span>{ex.name}</span>
                      {ex.primary_muscle_group && (
                        <span className="text-muted-foreground text-xs">
                          · {ex.primary_muscle_group.name}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {selectedExerciseId && exercise && (
            <Link
              href={`/exercises/${exercise.id}`}
              className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View exercise details
              <ChevronRight className="size-4" />
            </Link>
          )}
        </CardContent>
      </Card>

      {!selectedExerciseId && (
        <Card className="rounded-2xl border-dashed border-2 border-border/80">
          <CardContent className="py-16 text-center">
            <Dumbbell className="size-14 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">No exercise selected</p>
            <p className="text-muted-foreground text-sm mt-1">
              Pick an exercise above to see 1RM, volume, and max weight progression.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedExerciseId && isLoading && (
        <div className="space-y-5">
          <Skeleton className="h-24 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
          <Skeleton className="h-[280px] rounded-2xl" />
          <Skeleton className="h-[280px] rounded-2xl" />
        </div>
      )}

      {selectedExerciseId && exercise && stats && filteredStats && !isLoading && (
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
