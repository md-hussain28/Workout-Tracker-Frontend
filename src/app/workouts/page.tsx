"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Calendar, Clock, Dumbbell } from "lucide-react";
import { api, type Workout } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ViewMode = "day" | "week" | "month";

function getDateRange(mode: ViewMode): { from_date: string; to_date: string } {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
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
      from = new Date(now.getFullYear(), now.getMonth(), 1);
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

export default function WorkoutsListPage() {
  const [mode, setMode] = useState<ViewMode>("week");

  const { from_date, to_date } = useMemo(() => getDateRange(mode), [mode]);

  const { data: workouts = [], isLoading } = useQuery({
    queryKey: ["workouts", mode, from_date],
    queryFn: () => api.workouts.list(0, 200, from_date, to_date),
  });

  const grouped = useMemo(() => groupByDate(workouts), [workouts]);

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

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
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
                                  {new Date(w.started_at).toLocaleTimeString(undefined, {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                  {w.duration_seconds != null ? (
                                    <span className="flex items-center gap-1">
                                      <Clock className="size-3" />
                                      {Math.round(w.duration_seconds / 60)} min
                                    </span>
                                  ) : (
                                    <span className="text-green-500 font-medium">In progress</span>
                                  )}
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
