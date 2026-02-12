"use client";

import { useQuery } from "@tanstack/react-query";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  TrendingUp,
  Hash,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PIE_COLORS = [
  "hsl(262, 80%, 55%)",
  "hsl(180, 60%, 50%)",
  "hsl(85, 60%, 55%)",
  "hsl(25, 80%, 55%)",
  "hsl(300, 55%, 50%)",
];

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
  const exerciseId = parseInt(params.id, 10);

  const { data: exercise, isLoading: exLoading } = useQuery({
    queryKey: ["exercise", exerciseId],
    queryFn: () => api.exercises.get(exerciseId),
    enabled: !isNaN(exerciseId),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["exerciseStats", exerciseId],
    queryFn: () => api.exercises.getStats(exerciseId),
    enabled: !isNaN(exerciseId),
  });

  if (isNaN(exerciseId)) return notFound();

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
                <span className="text-muted-foreground text-sm">
                  {exercise.primary_muscle_group.name}
                </span>
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
          <Badge variant="outline">Primary: {exercise.primary_muscle_group.name}</Badge>
        )}
        {exercise.secondary_muscle_group && (
          <Badge variant="outline">Secondary: {exercise.secondary_muscle_group.name}</Badge>
        )}
        {exercise.tertiary_muscle_group && (
          <Badge variant="outline">Tertiary: {exercise.tertiary_muscle_group.name}</Badge>
        )}
      </div>

      {statsLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      )}

      {stats && (
        <div className="space-y-4">
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
          {stats.prs && (stats.prs.best_weight || stats.prs.best_1rm || stats.prs.best_duration) && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="size-5 text-amber-500" />
                  Personal Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {stats.prs.best_weight != null && (
                    <div>
                      <p className="text-lg font-bold">{stats.prs.best_weight} {exercise.unit}</p>
                      <p className="text-muted-foreground text-xs">Best Weight</p>
                    </div>
                  )}
                  {stats.prs.best_1rm != null && (
                    <div>
                      <p className="text-lg font-bold">{stats.prs.best_1rm} {exercise.unit}</p>
                      <p className="text-muted-foreground text-xs">Est. 1RM</p>
                    </div>
                  )}
                  {stats.prs.best_volume != null && (
                    <div>
                      <p className="text-lg font-bold">{stats.prs.best_volume}</p>
                      <p className="text-muted-foreground text-xs">Best Volume</p>
                    </div>
                  )}
                  {stats.prs.best_reps != null && (
                    <div>
                      <p className="text-lg font-bold">{stats.prs.best_reps}</p>
                      <p className="text-muted-foreground text-xs">Best Reps</p>
                    </div>
                  )}
                  {stats.prs.best_duration != null && (
                    <div>
                      <p className="text-lg font-bold">{stats.prs.best_duration}s</p>
                      <p className="text-muted-foreground text-xs">Best Duration</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 1RM Progression Chart */}
          {stats.one_rm_progression.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="size-5 text-primary" />
                  1RM Progression
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={stats.one_rm_progression}>
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
              </CardContent>
            </Card>
          )}

          {/* Set Label Distribution Pie Chart */}
          {stats.set_label_distribution.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Set Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie
                        data={stats.set_label_distribution}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={50}
                        innerRadius={30}
                      >
                        {stats.set_label_distribution.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-1.5">
                    {stats.set_label_distribution.map((item, idx) => (
                      <div key={item.label} className="flex items-center gap-2 text-sm">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}
                        />
                        <span className="capitalize text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent History */}
          {stats.recent_history.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.recent_history.map((h) => (
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
                ))}
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {stats.total_sets === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                No data yet. Start using this exercise in workouts to see stats.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
