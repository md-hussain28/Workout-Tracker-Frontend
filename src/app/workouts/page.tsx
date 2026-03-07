"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Calendar, ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import { api, type Workout, type MuscleGroup } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Default colors for muscle groups that don't have one assigned (by index). */
const DEFAULT_MUSCLE_COLORS = [
  "#ef4444", "#f97316", "#22c55e", "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#06b6d4", "#64748b",
];

type ViewMode = "day" | "week" | "month";

function getDateRange(
  mode: ViewMode,
  dateParam?: string | null,
  calendarYear?: number,
  calendarMonth?: number
): { from_date: string; to_date: string } {
  const now = new Date();
  let from: Date;
  let to: Date;

  if (dateParam) {
    const [y, m, d] = dateParam.split("-").map(Number);
    from = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
    to = new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999);
  } else {
    to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    switch (mode) {
      case "day":
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        from = new Date(now);
        from.setDate(now.getDate() - 6);
        from.setHours(0, 0, 0, 0);
        break;
      case "month": {
        const y = calendarYear ?? now.getFullYear();
        const m = calendarMonth ?? now.getMonth() + 1;
        from = new Date(y, m - 1, 1, 0, 0, 0, 0);
        const lastDay = new Date(y, m, 0);
        to = new Date(y, m - 1, lastDay.getDate(), 23, 59, 59, 999);
        break;
      }
    }
  }

  return {
    from_date: from.toISOString(),
    to_date: to.toISOString(),
  };
}

function groupByDate(workouts: Workout[]): Map<string, Workout[]> {
  const groups = new Map<string, Workout[]>();
  for (const w of workouts) {
    const dateKey = new Date(w.started_at).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const existing = groups.get(dateKey) ?? [];
    existing.push(w);
    groups.set(dateKey, existing);
  }
  return groups;
}

/** e.g. "Morning", "Afternoon", "Evening" for a more meaningful workout label */
function getTimeOfDayLabel(date: Date): string {
  const h = date.getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

/** YYYY-MM-DD for a date (local date of the workout) */
function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

/** Build calendar cells for current month: empty slots + day numbers. month is 1-based. */
function getMonthCalendarCells(year: number, month: number): { type: "empty" | "day"; day?: number; dateKey?: string }[] {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const firstWeekday = first.getDay();
  const daysInMonth = last.getDate();
  const cells: { type: "empty" | "day"; day?: number; dateKey?: string }[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ type: "empty" });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${month.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
    cells.push({ type: "day", day: d, dateKey });
  }
  return cells;
}

export default function WorkoutsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const now = new Date();
  const [mode, setMode] = useState<ViewMode>("week");
  const [calendarYear, setCalendarYear] = useState(() => now.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => now.getMonth() + 1);

  // Displayed month: from URL date or from calendar state
  const displayYear = dateParam ? parseInt(dateParam.slice(0, 4), 10) : calendarYear;
  const displayMonth = dateParam ? parseInt(dateParam.slice(5, 7), 10) : calendarMonth;

  const { from_date, to_date } = useMemo(
    () => getDateRange(dateParam ? "day" : mode, dateParam, calendarYear, calendarMonth),
    [mode, dateParam, calendarYear, calendarMonth]
  );

  useEffect(() => {
    if (dateParam) setMode("day");
  }, [dateParam]);

  // Keep calendar in sync when switching to month view
  useEffect(() => {
    if (mode === "month" && !dateParam) {
      setCalendarYear(now.getFullYear());
      setCalendarMonth(now.getMonth() + 1);
    }
  }, [mode, dateParam]);

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ["workouts", mode, from_date, to_date],
    queryFn: () => api.workouts.list(0, 200, from_date, to_date),
  });

  // For calendar muscle colors: fetch volume by muscle for the displayed month
  const monthStart = new Date(displayYear, displayMonth - 1, 1);
  const monthEnd = new Date(displayYear, displayMonth, 0, 23, 59, 59, 999);
  const { data: volumeHistory = [] } = useQuery({
    queryKey: ["analytics", "volume-history-by-muscle", displayYear, displayMonth],
    queryFn: () => api.analytics.volumeHistory(monthStart.toISOString(), monthEnd.toISOString()),
    enabled: mode === "month" || !!dateParam,
  });
  const { data: muscleGroups = [] } = useQuery({
    queryKey: ["muscleGroups"],
    queryFn: () => api.muscleGroups.list(),
    enabled: mode === "month" || !!dateParam,
  });

  const grouped = useMemo(() => groupByDate(workouts), [workouts]);
  const workoutDateKeys = useMemo(
    () => new Set(workouts.map((w) => toDateKey(w.started_at))),
    [workouts]
  );

  // Per-day muscles (name → volume), sorted by volume desc; and muscle name → color
  const dayMuscles = useMemo(() => {
    const byDate: Record<string, { name: string; volume: number }[]> = {};
    for (const row of volumeHistory as { date: string; [k: string]: unknown }[]) {
      const dateKey = toDateKey(row.date);
      const entries = Object.entries(row)
        .filter(([k]) => k !== "date")
        .map(([name, vol]) => ({ name, volume: Number(vol) || 0 }))
        .filter((e) => e.volume > 0)
        .sort((a, b) => b.volume - a.volume);
      if (entries.length) byDate[dateKey] = entries;
    }
    return byDate;
  }, [volumeHistory]);

  const muscleNameToColor = useMemo(() => {
    const map: Record<string, string> = {};
    muscleGroups.forEach((mg: MuscleGroup, i: number) => {
      map[mg.name] = mg.color ?? DEFAULT_MUSCLE_COLORS[i % DEFAULT_MUSCLE_COLORS.length];
    });
    return map;
  }, [muscleGroups]);

  const currentMonthLabel =
    mode === "month" || dateParam
      ? new Date(displayYear, displayMonth - 1, 1).toLocaleString(undefined, { month: "long", year: "numeric" })
      : null;
  const monthCells =
    mode === "month" || dateParam
      ? getMonthCalendarCells(displayYear, displayMonth)
      : [];

  const goPrevMonth = () => {
    if (dateParam) {
      const d = new Date(displayYear, displayMonth - 1, 0);
      router.push(`/workouts?date=${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    } else {
      if (calendarMonth <= 1) {
        setCalendarYear((y) => y - 1);
        setCalendarMonth(12);
      } else {
        setCalendarMonth((m) => m - 1);
      }
    }
  };
  const goNextMonth = () => {
    const isCurrent = displayYear === now.getFullYear() && displayMonth === now.getMonth() + 1;
    if (isCurrent && !dateParam) return;
    if (dateParam) {
      const d = new Date(displayYear, displayMonth, 1);
      if (d > now) return;
      router.push(`/workouts?date=${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    } else {
      if (calendarMonth >= 12) {
        setCalendarYear((y) => y + 1);
        setCalendarMonth(1);
      } else {
        setCalendarMonth((m) => m + 1);
      }
    }
  };
  const isNextDisabled = displayYear === now.getFullYear() && displayMonth >= now.getMonth() + 1;

  return (
    <>
      <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Workouts</h1>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-muted rounded-xl">
          {(["day", "week", "month"] as ViewMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                if (dateParam && m !== "day") router.push("/workouts");
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === m || (dateParam && m === "day")
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {m === "day" ? (dateParam ? "Selected Day" : "Today") : m === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>

        {/* Month view or single-date view: header + calendar strip */}
        {(mode === "month" || dateParam) && (
          <div className="mb-6">
            <div className="flex items-center justify-between gap-2 mb-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 rounded-lg"
                onClick={goPrevMonth}
                aria-label="Previous month"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <p className="text-sm font-semibold text-muted-foreground min-w-[140px] text-center">
                {currentMonthLabel}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 rounded-lg disabled:opacity-50"
                onClick={goNextMonth}
                disabled={isNextDisabled}
                aria-label="Next month"
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                <span key={d} className="text-[10px] font-medium text-muted-foreground/70 uppercase">
                  {d}
                </span>
              ))}
              {monthCells.map((cell, i) =>
                cell.type === "empty" ? (
                  <div key={`e-${i}`} className="aspect-square" />
                ) : (
                  <Link
                    key={cell.dateKey}
                    href={`/workouts?date=${cell.dateKey}`}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-colors hover:ring-2 hover:ring-primary/50 min-w-0 ${
                      workoutDateKeys.has(cell.dateKey!)
                        ? "bg-primary/15 text-foreground"
                        : "bg-muted/50 text-muted-foreground"
                    } ${dateParam === cell.dateKey ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                  >
                    <span>{cell.day}</span>
                    {workoutDateKeys.has(cell.dateKey!) && dayMuscles[cell.dateKey!] && (
                      <div className="flex w-full gap-0.5 mt-1 px-0.5">
                        {dayMuscles[cell.dateKey!].slice(0, 4).map((m, idx) => (
                          <div
                            key={m.name}
                            className="flex-1 min-w-0 h-1 rounded-full shrink-0"
                            style={{
                              backgroundColor: muscleNameToColor[m.name] ?? DEFAULT_MUSCLE_COLORS[idx % DEFAULT_MUSCLE_COLORS.length],
                            }}
                            title={m.name}
                          />
                        ))}
                      </div>
                    )}
                  </Link>
                )
              )}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-xl">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-3 w-[80px]" />
                  </div>
                </div>
                <Skeleton className="h-4 w-[40px]" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && workouts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Calendar className="size-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No workouts</p>
              <p className="text-sm mt-1">
                {mode === "day"
                  ? "No workouts today yet."
                  : mode === "week"
                    ? "No workouts this week."
                    : "No workouts this month."}
              </p>
              <Button asChild className="mt-4 rounded-xl">
                <Link href="/workouts/new">Start workout</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && workouts.length > 0 && (
          <div className="space-y-5">
            {Array.from(grouped.entries()).map(([dateLabel, dayWorkouts]) => (
              <div key={dateLabel}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {dateLabel}
                </p>
                <ul className="space-y-2">
                  {dayWorkouts.map((w) => (
                    <li key={w.id}>
                      <Link href={`/workouts/${w.id}`}>
                        <Card className="transition-colors hover:bg-muted/50 active:bg-muted">
                          <CardContent className="flex items-center justify-between py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                                <Dumbbell className="size-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {w.duration_seconds != null ? (
                                    <>
                                      {getTimeOfDayLabel(new Date(w.started_at))} · {Math.round(w.duration_seconds / 60)} min
                                    </>
                                  ) : (
                                    <span className="text-green-500">In progress</span>
                                  )}
                                </p>
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                  <span>
                                    {new Date(w.started_at).toLocaleTimeString(undefined, {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span className="text-muted-foreground text-sm">View</span>
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
      </div>

      {/* Floating Action Button */}
      <Link
        href="/workouts/new"
        className="fixed bottom-[calc(72px+max(env(safe-area-inset-bottom),8px)+16px)] right-5 z-40 flex size-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/25 text-primary-foreground transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="size-6" />
      </Link>
    </>
  );
}
