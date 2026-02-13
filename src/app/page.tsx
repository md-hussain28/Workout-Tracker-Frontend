"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type Workout } from "@/lib/api";
import { WeeklyRings } from "@/components/home/WeeklyRings";
import { QuickStartCarousel } from "@/components/home/QuickStartCarousel";
import { BentoGrid } from "@/components/home/BentoGrid";

export default function HomePage() {
  const { data: streak, isLoading: isStreakLoading } = useQuery({
    queryKey: ["streak"],
    queryFn: () => api.streak.get(),
  });

  const { data: recentWorkouts } = useQuery({
    queryKey: ["workouts", "recent"],
    queryFn: () => api.workouts.list(0, 5),
  });

  // Find active workout (no ended_at)
  const activeWorkout = useMemo(
    () => recentWorkouts?.find((w: Workout) => !w.ended_at),
    [recentWorkouts]
  );

  return (
    <div className="mx-auto max-w-lg px-4 pt-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold tracking-tight font-[family-name:var(--font-geist-mono)]">
            Strong
          </h1>
        </div>
        {activeWorkout && (
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
            <LiveTimer startedAt={activeWorkout.started_at} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {/* 1 — Weekly Activity Rings */}
        <section>
          <WeeklyRings />
        </section>

        {/* 2 — Bento Grid */}
        <section>
          <BentoGrid streak={streak} />
        </section>

        {/* 3 — Quick Start / Templates */}
        <section>
          <QuickStartCarousel activeWorkout={activeWorkout} />
        </section>
      </div>
    </div>
  );
}

// ── Live Timer Component ──
function LiveTimer({ startedAt }: { startedAt: string }) {
  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;

  return (
    <span className="text-xs font-mono text-green-400 tabular-nums font-semibold">
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}
