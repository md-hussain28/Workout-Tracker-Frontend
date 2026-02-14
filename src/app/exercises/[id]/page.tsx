"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  TrendingUp,
  Hash,
  Calendar,
  ArrowLeft,
  CalendarRange,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const TIME_RANGES = [
  { value: "1w", label: "1 week" },
  { value: "1m", label: "1 month" },
  { value: "2m", label: "2 months" },
  { value: "3m", label: "3 months" },
  { value: "1y", label: "1 year" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom range" },
] as const;

type TimeRangeValue = (typeof TIME_RANGES)[number]["value"];

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
  const exerciseId = params.id;
  const [timeRange, setTimeRange] = useState<TimeRangeValue>("1m");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

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
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link href={`/exercises/${exercise.id}/edit`}>Edit</Link>
          </Button>
        </div>
      </div>

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
        <div className="space-y-4">
          {/* Time range */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarRange className="size-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Time range</Label>
              </div>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRangeValue)}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGES.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="rounded-lg">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {timeRange === "custom" && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="rounded-xl mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="rounded-xl mt-0.5"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overview Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="py-4 text-center">
                <Hash className="size-5 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold tabular-nums">{stats.total_sets}</p>
                <p className="text-muted-foreground text-xs">Total Sets</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <Calendar className="size-5 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold tabular-nums">{stats.total_workouts}</p>
                <p className="text-muted-foreground text-xs">Workouts</p>
              </CardContent>
            </Card>
          </div>

          {/* PRs */}
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="size-5 text-amber-500" />
                Personal Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-lg font-bold">
                    {stats.prs.best_weight != null ? `${stats.prs.best_weight} ${exercise.unit}` : "—"}
                  </p>
                  <p className="text-muted-foreground text-xs">Best Weight</p>
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {stats.prs.best_1rm != null ? `${Math.round(stats.prs.best_1rm)} ${exercise.unit}` : "—"}
                  </p>
                  <p className="text-muted-foreground text-xs">Est. 1RM</p>
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {stats.prs.best_volume != null ? stats.prs.best_volume.toLocaleString() : "—"}
                  </p>
                  <p className="text-muted-foreground text-xs">Best Volume</p>
                </div>
                <div>
                  <p className="text-lg font-bold">
                    {stats.prs.best_reps != null ? stats.prs.best_reps : "—"}
                  </p>
                  <p className="text-muted-foreground text-xs">Best Reps</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 1RM Progression Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-5 text-primary" />
                1RM Progression
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredStats.one_rm_progression.length > 1 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={filteredStats.one_rm_progression}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v: string) =>
                        new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                      }
                    />
                    <YAxis tick={{ fontSize: 10 }} width={40} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                        fontSize: 12,
                      }}
                      labelFormatter={(v) =>
                        new Date(String(v)).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })
                      }
                      formatter={(value) => [`${Number(value).toFixed(1)} ${exercise.unit}`, "Est. 1RM"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="estimated_1rm"
                      stroke="hsl(262, 80%, 55%)"
                      strokeWidth={2}
                      dot={{ fill: "hsl(262, 80%, 55%)", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
                  <TrendingUp className="size-8 mb-2 opacity-20" />
                  <p className="text-sm font-medium">Not enough data</p>
                  <p className="text-xs">Log more workouts to see progress chart</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Volume History Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Hash className="size-5 text-primary" />
                Volume History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredStats.volume_history && filteredStats.volume_history.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={filteredStats.volume_history}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v: string) =>
                        new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                      }
                    />
                    <YAxis tick={{ fontSize: 10 }} width={40} />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                        fontSize: 12,
                      }}
                      labelFormatter={(v) =>
                        new Date(String(v)).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })
                      }
                      formatter={(value) => [Number(value).toLocaleString(), "Volume"]}
                    />
                    <Bar
                      dataKey="volume"
                      fill="hsl(262, 80%, 55%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
                  <Hash className="size-8 mb-2 opacity-20" />
                  <p className="text-sm font-medium">No volume data</p>
                  <p className="text-xs">Log workouts to see volume history</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Max Weight History Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="size-5 text-amber-500" />
                Max Weight History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredStats.max_weight_history && filteredStats.max_weight_history.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={filteredStats.max_weight_history}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v: string) =>
                        new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                      }
                    />
                    <YAxis tick={{ fontSize: 10 }} width={40} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                        fontSize: 12,
                      }}
                      labelFormatter={(v) =>
                        new Date(String(v)).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })
                      }
                      formatter={(value) => [`${Number(value)} ${exercise.unit}`, "Max Weight"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(45, 93%, 47%)"
                      fillOpacity={1}
                      fill="url(#colorWeight)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
                  <Trophy className="size-8 mb-2 opacity-20" />
                  <p className="text-sm font-medium">No weight data</p>
                  <p className="text-xs">Log workouts to see weight progression</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent History */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredStats.recent_history.length > 0 ? (
                filteredStats.recent_history.map((h) => (
                  <Link
                    key={h.workout_id}
                    href={`/workouts/${h.workout_id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors">
                      <div>
                        <p className="text-sm font-medium">
                          {h.started_at
                            ? new Date(h.started_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })
                            : "Unknown"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {h.sets.length} set{h.sets.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        {h.sets.map((s, i) => (
                          <span key={i} className="text-muted-foreground">
                            {s.weight != null && s.reps != null
                              ? `${s.weight}×${s.reps}`
                              : s.duration_seconds
                                ? `${s.duration_seconds}s`
                                : "—"}
                            {i < h.sets.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-6 text-center text-muted-foreground text-sm">
                  No recent history.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
