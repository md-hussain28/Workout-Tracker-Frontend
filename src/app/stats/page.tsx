import { Trophy, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function StatsPage() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  let prData: Awaited<ReturnType<typeof api.pr.trophyRoom>> | null = null;
  let consistency: Awaited<ReturnType<typeof api.analytics.consistency>> | null = null;
  let error: string | null = null;

  try {
    [prData, consistency] = await Promise.all([
      api.pr.trophyRoom("month"),
      api.analytics.consistency(year, month),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load stats";
  }

  const daysSet = new Set(consistency?.days.map((d) => d.date) ?? []);

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Stats</h1>
      <p className="text-muted-foreground text-sm mb-6">
        PRs and workout consistency.
      </p>

      {error && <p className="text-destructive text-sm py-4">{error}</p>}

      {!error && prData && (
        <Card className="mb-6 overflow-hidden border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="size-5 text-primary" />
              PRs this month
            </CardTitle>
            <CardDescription>
              {prData.count} personal record{prData.count !== 1 ? "s" : ""} set.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {prData.records.length === 0 ? (
              <p className="text-muted-foreground text-sm py-2">No PRs yet this month.</p>
            ) : (
              <ul className="space-y-3">
                {prData.records.slice(0, 10).map((r) => (
                  <li key={r.set_id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{r.exercise_name ?? `Exercise #${r.exercise_id}`}</p>
                      <p className="text-muted-foreground">
                        {r.weight != null && r.reps != null && `${r.weight} × ${r.reps} reps`}
                        {r.duration_seconds != null && `${r.duration_seconds}s`}
                        {r.pr_type && (
                          <Badge variant="secondary" className="ml-2 text-xs">{r.pr_type}</Badge>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {!error && consistency && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="size-5" />
              This month
            </CardTitle>
            <CardDescription>
              Days with workouts: {daysSet.size}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConsistencyGrid year={year} month={month} days={consistency.days} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ConsistencyGrid({
  year,
  month,
  days,
}: {
  year: number;
  month: number;
  days: { date: string; duration_seconds: number | null; tonnage: number }[];
}) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  const byDate = Object.fromEntries(days.map((d) => [d.date, d]));

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${month.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
    cells.push(date);
  }

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-muted-foreground text-xs mb-2">
        {weekDays.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const data = byDate[date];
          const hasWorkout = !!data;
          return (
            <div
              key={date}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                hasWorkout
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground"
              }`}
              title={hasWorkout ? `${data.duration_seconds ? `${Math.round(data.duration_seconds / 60)} min` : ""} ${data.tonnage ? `· ${Math.round(data.tonnage)} kg` : ""}` : undefined}
            >
              {new Date(date).getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
