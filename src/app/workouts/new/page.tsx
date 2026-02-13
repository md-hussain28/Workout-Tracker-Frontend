"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, LayoutTemplate, Zap, ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { api, type Workout } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function NewWorkoutPage() {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: () => api.templates.list(),
  });

  // Check for any in-progress workout
  const { data: recentWorkouts = [] } = useQuery({
    queryKey: ["workouts", "recent-check"],
    queryFn: () => api.workouts.list(0, 20),
  });

  const activeWorkout = useMemo(
    () => recentWorkouts.find((w: Workout) => !w.ended_at),
    [recentWorkouts]
  );

  async function handleStartBlank() {
    setLoading(true);
    setError(null);
    try {
      const workout = await api.workouts.create(notes ? { notes } : {});
      router.replace(`/workouts/${workout.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start workout");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartFromTemplate(templateId: number) {
    setLoading(true);
    setError(null);
    try {
      const result = await api.templates.instantiate(templateId);
      router.replace(`/workouts/${result.workout_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start from template");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-muted-foreground text-sm mb-3 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Home
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">New workout</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Start from a template or begin a blank session.
      </p>

      {/* Active Session Warning */}
      {activeWorkout && (
        <Card className="mb-4 border-amber-500/50 bg-amber-500/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                <AlertTriangle className="size-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Workout in progress</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  You already have an active session started{" "}
                  {new Date(activeWorkout.started_at).toLocaleString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    month: "short",
                    day: "numeric",
                  })}
                  . End it before starting a new one.
                </p>
                <Link href={`/workouts/${activeWorkout.id}`}>
                  <Button size="sm" className="mt-2 rounded-xl">
                    Resume workout
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {/* Start from Template */}
        {templates.length > 0 && (
          <Card className={activeWorkout ? "opacity-50 pointer-events-none" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <LayoutTemplate className="size-5 text-muted-foreground" />
                Start from template
              </CardTitle>
              <CardDescription>
                Pick a template to pre-load exercises.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleStartFromTemplate(t.id)}
                  disabled={loading || !!activeWorkout}
                  className="w-full flex items-center justify-between py-3 px-3 rounded-xl border border-border hover:bg-muted/50 active:bg-muted transition-colors text-left disabled:opacity-50"
                >
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    {t.exercises && t.exercises.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {t.exercises
                          .sort((a, b) => a.order_in_template - b.order_in_template)
                          .slice(0, 4)
                          .map((te) => (
                            <Badge
                              key={te.id}
                              variant="secondary"
                              className="text-xs font-normal"
                            >
                              {te.exercise?.name ?? `#${te.exercise_id}`}
                            </Badge>
                          ))}
                        {t.exercises.length > 4 && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            +{t.exercises.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <Play className="size-5 text-primary shrink-0 ml-3" />
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Blank Workout */}
        <Card className={activeWorkout ? "opacity-50 pointer-events-none" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="size-5 text-primary" />
              Blank workout
            </CardTitle>
            <CardDescription>
              Start empty and add exercises as you go.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs text-muted-foreground">
                Notes (optional)
              </Label>
              <Input
                id="notes"
                placeholder="e.g. Push day, how you feel..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl"
                disabled={!!activeWorkout}
              />
            </div>
            <Button
              className="w-full rounded-xl py-5 text-base font-medium"
              size="lg"
              onClick={handleStartBlank}
              disabled={loading || !!activeWorkout}
            >
              {loading ? "Starting…" : "Start blank workout"}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}
      </div>
    </div>
  );
}
