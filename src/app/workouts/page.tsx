import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

export default async function WorkoutsListPage() {
  let workouts: Awaited<ReturnType<typeof api.workouts.list>> = [];
  let error: string | null = null;
  try {
    workouts = await api.workouts.list(0, 100);
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load workouts";
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Workouts</h1>
        <Button asChild size="sm" className="rounded-xl">
          <Link href="/workouts/new">
            <Plus className="mr-1 size-4" />
            New
          </Link>
        </Button>
      </div>

      {error && (
        <p className="text-destructive text-sm py-4">{error}</p>
      )}

      {!error && workouts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="font-medium">No workouts yet</p>
            <p className="text-sm mt-1">Start your first workout to see it here.</p>
            <Button asChild className="mt-4 rounded-xl">
              <Link href="/workouts/new">Start workout</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && workouts.length > 0 && (
        <ul className="space-y-2">
          {workouts.map((w) => (
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
                        })}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {new Date(w.started_at).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {w.duration_seconds != null && (
                          <> · {Math.round(w.duration_seconds / 60)} min</>
                        )}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-sm">Open</span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
