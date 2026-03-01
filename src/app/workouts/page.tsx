"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Calendar, Clock, Dumbbell } from "lucide-react";
import { api, type Workout } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ViewMode = "day" | "week" | "month";

function getDateRange(mode: ViewMode): { from_date: string; to_date: string } {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let from: Date;
  switch (mode) {
    case "day":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      from = new Date(now);
      from.setDate(now.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      break;
    case "month":
      from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
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
  const [mode, setMode] = useState<ViewMode>("week");

  const { from_date, to_date } = useMemo(() => getDateRange(mode), [mode]);

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ["workouts", mode, from_date, to_date],
    queryFn: () => api.workouts.list(0, 200, from_date, to_date),
  });

  const grouped = useMemo(() => groupByDate(workouts), [workouts]);
  const workoutDateKeys = useMemo(
    () => new Set(workouts.map((w) => toDateKey(w.started_at))),
    [workouts]
  );
  const now = new Date();
  const currentMonthLabel =
    mode === "month"
      ? new Date(now.getFullYear(), now.getMonth(), 1).toLocaleString(undefined, { month: "long", year: "numeric" })
      : null;
  const monthCells =
    mode === "month"
      ? getMonthCalendarCells(now.getFullYear(), now.getMonth() + 1)
      : [];

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
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === m
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {m === "day" ? "Today" : m === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>

        {/* Month view: header + calendar strip */}
        {mode === "month" && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-muted-foreground mb-3">{currentMonthLabel}</p>
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
                  <div
                    key={cell.dateKey}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                      workoutDateKeys.has(cell.dateKey!)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {cell.day}
                  </div>
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
