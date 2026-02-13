"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, Plus, Zap, Timer } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  const activeWorkout = recentWorkouts?.find((w) => !w.ended_at);

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Workout Tracker</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Train hard, track everything.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Streak Card */}
        <Card className="overflow-hidden border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-500/15">
                  <Flame className="size-6 text-orange-500" />
                </div>
                <div>
                  {isStreakLoading ? (
                    <>
                      <div className="h-9 w-10 rounded-md bg-orange-500/15 animate-pulse" />
                      <div className="h-4 w-16 mt-1 rounded bg-muted animate-pulse" />
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold tabular-nums">
                        {streak?.current_streak ?? 0}
                      </p>
                      <p className="text-muted-foreground text-sm font-medium">
                        day streak
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                {isStreakLoading ? (
                  <>
                    <div className="h-3 w-12 mb-1 rounded bg-muted animate-pulse ml-auto" />
                    <div className="h-6 w-8 rounded bg-muted animate-pulse ml-auto" />
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground text-xs">Longest</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {streak?.longest_streak ?? 0}
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Workout Banner */}
        {activeWorkout && (
          <Link href={`/workouts/${activeWorkout.id}`}>
            <Card className="overflow-hidden border-green-500/30 bg-green-500/10 transition-colors hover:bg-green-500/15 active:bg-green-500/20">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Timer className="size-5 text-green-500" />
                    <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-medium text-green-600 dark:text-green-400">
                      Workout in progress
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Started {new Date(activeWorkout.started_at).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  Continue →
                </span>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Quick Start CTA */}
        <Card className="overflow-hidden border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="size-5 text-primary" />
              Quick start
            </CardTitle>
            <CardDescription>Start a new workout and log sets as you go.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full rounded-xl py-6 text-base font-medium" size="lg">
              <Link href="/workouts/new">
                <Plus className="mr-2 size-5" />
                Start workout
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Empty state hint */}
        {!activeWorkout && (!recentWorkouts || recentWorkouts.length === 0) && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              <p className="font-medium mb-1">Welcome! 💪</p>
              <p>Start your first workout to begin tracking your progress.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
