import Link from "next/link";
import { Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

const APP_NAME = "Workout Tracker";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let recentWorkouts: Awaited<ReturnType<typeof api.workouts.list>> = [];
  let error: string | null = null;
  try {
    recentWorkouts = await api.workouts.list(0, 5);
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load workouts";
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Start a session or pick up where you left off.
        </p>
      </div>

      <div className="flex flex-col gap-4">
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

        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Recent workouts</h2>
          {error && (
            <p className="text-destructive text-sm py-4">{error}</p>
          )}
          {!error && recentWorkouts.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                No workouts yet. Tap &quot;Start workout&quot; to begin.
              </CardContent>
            </Card>
          )}
          {!error && recentWorkouts.length > 0 && (
            <ul className="space-y-2">
              {recentWorkouts.map((w) => (
                <li key={w.id}>
                  <Link href={`/workouts/${w.id}`}>
                    <Card className="transition-colors hover:bg-muted/50 active:bg-muted">
                      <CardContent className="flex items-center justify-between py-4">
                        <div>
                          <p className="font-medium">
                            {new Date(w.started_at).toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {w.duration_seconds != null
                              ? `${Math.round(w.duration_seconds / 60)} min`
                              : "In progress"}
                          </p>
                        </div>
                        <span className="text-muted-foreground text-sm">View</span>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
