"use client";

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
  CartesianGrid,
} from "recharts";
import Link from "next/link";
import { Trophy, TrendingUp, Hash, Calendar, CalendarRange } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { ExerciseStatsResponse } from "@/lib/api";

const TIME_RANGES = [
  { value: "1w", label: "1 week" },
  { value: "1m", label: "1 month" },
  { value: "2m", label: "2 months" },
  { value: "3m", label: "3 months" },
  { value: "1y", label: "1 year" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom range" },
] as const;

export type TimeRangeValue = (typeof TIME_RANGES)[number]["value"];

// Modern chart colors (work in light/dark)
const CHART = {
  primary: "hsl(var(--primary))",
  primaryMuted: "hsl(var(--primary) / 0.15)",
  volume: "hsl(142, 76%, 46%)", // emerald
  volumeMuted: "hsl(142, 76%, 46% / 0.2)",
  maxWeight: "hsl(38, 92%, 50%)", // amber
  maxWeightMuted: "hsl(38, 92%, 50% / 0.25)",
  grid: "hsl(var(--border) / 0.6)",
  tooltipBg: "hsl(var(--card))",
  tooltipBorder: "hsl(var(--border))",
};

const formatDateShort = (v: string) =>
  new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const formatDateLong = (v: string) =>
  new Date(v).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

interface ExerciseProgressionChartsProps {
  exercise: { id: string; name: string; unit: string };
  stats: ExerciseStatsResponse;
  filteredStats: ExerciseStatsResponse;
  timeRange: TimeRangeValue;
  onTimeRangeChange: (v: TimeRangeValue) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (v: string) => void;
  onCustomToChange: (v: string) => void;
}

export function ExerciseProgressionCharts({
  exercise,
  stats,
  filteredStats,
  timeRange,
  onTimeRangeChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}: ExerciseProgressionChartsProps) {
  return (
    <div className="space-y-5">
      {/* Time range */}
      <Card className="rounded-2xl border-border/80 shadow-sm">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarRange className="size-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Time range</Label>
          </div>
          <Select value={timeRange} onValueChange={(v) => onTimeRangeChange(v as TimeRangeValue)}>
            <SelectTrigger className="w-full rounded-xl h-11">
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
                  onChange={(e) => onCustomFromChange(e.target.value)}
                  className="rounded-xl mt-0.5 h-10"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => onCustomToChange(e.target.value)}
                  className="rounded-xl mt-0.5 h-10"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
          <CardContent className="py-5 text-center">
            <div className="inline-flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary mb-2">
              <Hash className="size-5" />
            </div>
            <p className="text-2xl font-bold tabular-nums tracking-tight">{stats.total_sets}</p>
            <p className="text-muted-foreground text-xs font-medium mt-0.5">Total Sets</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
          <CardContent className="py-5 text-center">
            <div className="inline-flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary mb-2">
              <Calendar className="size-5" />
            </div>
            <p className="text-2xl font-bold tabular-nums tracking-tight">{stats.total_workouts}</p>
            <p className="text-muted-foreground text-xs font-medium mt-0.5">Workouts</p>
          </CardContent>
        </Card>
      </div>

      {/* PRs */}
      <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Trophy className="size-5 text-amber-500" />
            Personal Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-background/60 py-3 px-3">
              <p className="text-lg font-bold tabular-nums">
                {stats.prs.best_weight != null ? `${stats.prs.best_weight} ${exercise.unit}` : "—"}
              </p>
              <p className="text-muted-foreground text-xs font-medium">Best Weight</p>
            </div>
            <div className="rounded-xl bg-background/60 py-3 px-3">
              <p className="text-lg font-bold tabular-nums">
                {stats.prs.best_1rm != null ? `${Math.round(stats.prs.best_1rm)} ${exercise.unit}` : "—"}
              </p>
              <p className="text-muted-foreground text-xs font-medium">Est. 1RM</p>
            </div>
            <div className="rounded-xl bg-background/60 py-3 px-3">
              <p className="text-lg font-bold tabular-nums">
                {stats.prs.best_volume != null ? stats.prs.best_volume.toLocaleString() : "—"}
              </p>
              <p className="text-muted-foreground text-xs font-medium">Best Volume</p>
            </div>
            <div className="rounded-xl bg-background/60 py-3 px-3">
              <p className="text-lg font-bold tabular-nums">
                {stats.prs.best_reps != null ? stats.prs.best_reps : "—"}
              </p>
              <p className="text-muted-foreground text-xs font-medium">Best Reps</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 1RM Progression */}
      <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="size-5 text-primary" />
            1RM Progression
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredStats.one_rm_progression.length > 1 ? (
            <div className="h-[220px] w-full rounded-xl bg-muted/20 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredStats.one_rm_progression}
                  margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={formatDateShort}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    width={36}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (Number(v) >= 1000 ? `${v / 1000}k` : String(v))}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: CHART.tooltipBg,
                      border: `1px solid ${CHART.tooltipBorder}`,
                      borderRadius: "1rem",
                      fontSize: 13,
                      boxShadow: "0 10px 40px -10px rgba(0,0,0,0.2)",
                    }}
                    labelFormatter={(v) => formatDateLong(String(v))}
                    formatter={(value) => [
                      `${Number(value ?? 0).toFixed(1)} ${exercise.unit}`,
                      "Est. 1RM",
                    ]}
                    cursor={{ stroke: CHART.grid, strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="estimated_1rm"
                    stroke={CHART.primary}
                    strokeWidth={2.5}
                    dot={{ fill: CHART.primary, strokeWidth: 2, r: 3.5 }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground rounded-xl border-2 border-dashed border-border bg-muted/10">
              <TrendingUp className="size-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">Not enough data</p>
              <p className="text-xs mt-0.5">Log more workouts to see progress</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Volume History */}
      <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Hash className="size-5 text-emerald-500" />
            Volume History
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredStats.volume_history?.length > 0 ? (
            <div className="h-[220px] w-full rounded-xl bg-muted/20 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredStats.volume_history}
                  margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={formatDateShort}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    width={36}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (Number(v) >= 1000 ? `${v / 1000}k` : String(v))}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: CHART.tooltipBg,
                      border: `1px solid ${CHART.tooltipBorder}`,
                      borderRadius: "1rem",
                      fontSize: 13,
                      boxShadow: "0 10px 40px -10px rgba(0,0,0,0.2)",
                    }}
                    labelFormatter={(v) => formatDateLong(String(v))}
                    formatter={(value) => [Number(value ?? 0).toLocaleString(), "Volume"]}
                    cursor={{ fill: CHART.volumeMuted }}
                  />
                  <Bar
                    dataKey="volume"
                    fill={CHART.volume}
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground rounded-xl border-2 border-dashed border-border bg-muted/10">
              <Hash className="size-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No volume data</p>
              <p className="text-xs mt-0.5">Log workouts to see volume history</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Max Weight History */}
      <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Trophy className="size-5 text-amber-500" />
            Max Weight History
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredStats.max_weight_history?.length > 0 ? (
            <div className="h-[220px] w-full rounded-xl bg-muted/20 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredStats.max_weight_history}
                  margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="areaGradientWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.maxWeight} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CHART.maxWeight} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={formatDateShort}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    width={36}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: CHART.tooltipBg,
                      border: `1px solid ${CHART.tooltipBorder}`,
                      borderRadius: "1rem",
                      fontSize: 13,
                      boxShadow: "0 10px 40px -10px rgba(0,0,0,0.2)",
                    }}
                    labelFormatter={(v) => formatDateLong(String(v))}
                    formatter={(value) => [`${Number(value ?? 0)} ${exercise.unit}`, "Max Weight"]}
                    cursor={{ stroke: CHART.grid, strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke={CHART.maxWeight}
                    strokeWidth={2.5}
                    fill="url(#areaGradientWeight)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground rounded-xl border-2 border-dashed border-border bg-muted/10">
              <Trophy className="size-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No weight data</p>
              <p className="text-xs mt-0.5">Log workouts to see weight progression</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent History */}
      <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Recent History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {filteredStats.recent_history.length > 0 ? (
            <ul className="divide-y divide-border/50">
              {filteredStats.recent_history.map((h) => (
                <li key={h.workout_id}>
                  <Link
                    href={`/workouts/${h.workout_id}`}
                    className="flex items-center justify-between py-3 px-1 -mx-1 rounded-lg hover:bg-muted/50 transition-colors"
                  >
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
                    <div className="text-right text-sm text-muted-foreground">
                      {h.sets
                        .map((s) =>
                          s.weight != null && s.reps != null
                            ? `${s.weight}×${s.reps}`
                            : s.duration_seconds
                              ? `${s.duration_seconds}s`
                              : "—"
                        )
                        .join(", ")}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No recent history in this range.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
