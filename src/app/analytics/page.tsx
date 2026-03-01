"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    VolumeGrowthChart,
    TotalVolumeChart,
    MuscleSplitChart,
    RepDensityChart,
    PlateauRadarChart,
    CaloriesBurnedChart,
    CaloriesSummaryCard,
    ConsistencyHeatmap,
} from "@/components/AnalyticsCharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, ChevronRight, BarChart3, Flame, Trophy, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type TimeRange = "1m" | "3m" | "6m" | "1y" | "all";

// Normalize API date to YYYY-MM-DD for lookup (handles "2025-03-01" or "2025-03-01T00:00:00Z")
function toDateKey(dateStr: string): string {
    return dateStr.slice(0, 10);
}

// Month calendar grid (this month's workout days)
function ThisMonthGrid({
    year,
    month,
    days,
}: {
    year: number;
    month: number;
    days: { date: string; duration_seconds: number | null; tonnage: number }[];
}) {
    // month is 1-indexed (1=Jan). JS Date uses 0-indexed month; last day of month M = new Date(year, M, 0)
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay();
    const byDate = Object.fromEntries(days.map((d) => [toDateKey(d.date), d]));

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
                    const data = byDate[toDateKey(date)];
                    const hasWorkout = !!data;
                    return (
                        <div
                            key={date}
                            className={cn(
                                "aspect-square rounded-lg flex items-center justify-center text-xs font-medium",
                                hasWorkout ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                            )}
                            title={
                                hasWorkout
                                    ? `${data.duration_seconds ? `${Math.round(data.duration_seconds / 60)} min` : ""} ${data.tonnage ? `· ${Math.round(data.tonnage)} kg` : ""}`
                                    : undefined
                            }
                        >
                            {new Date(date).getDate()}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function AnalyticsPage() {
    const [range, setRange] = useState<TimeRange>("3m");
    const [consistencyYear, setConsistencyYear] = useState(() => new Date().getFullYear());
    const [thisMonthYear, setThisMonthYear] = useState(() => new Date().getFullYear());
    const [thisMonthMonth, setThisMonthMonth] = useState(() => new Date().getMonth() + 1);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const isCurrentMonth = thisMonthYear === currentYear && thisMonthMonth === currentMonth;

    const goPrevMonth = () => {
        setThisMonthMonth((m) => {
            if (m <= 1) {
                setThisMonthYear((y) => y - 1);
                return 12;
            }
            return m - 1;
        });
    };
    const goNextMonth = () => {
        if (thisMonthYear > currentYear || (thisMonthYear === currentYear && thisMonthMonth >= currentMonth)) return;
        setThisMonthMonth((m) => {
            if (m >= 12) {
                setThisMonthYear((y) => y + 1);
                return 1;
            }
            return m + 1;
        });
    };
    const monthLabel = new Date(thisMonthYear, thisMonthMonth - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });

    const getDateRange = () => {
        if (range === "all") return { from: undefined, to: undefined };
        const now = new Date();
        const sub = new Date();
        if (range === "1m") sub.setMonth(now.getMonth() - 1);
        if (range === "3m") sub.setMonth(now.getMonth() - 3);
        if (range === "6m") sub.setMonth(now.getMonth() - 6);
        if (range === "1y") sub.setFullYear(now.getFullYear() - 1);
        return { from: sub.toISOString(), to: now.toISOString() };
    };

    const { from, to } = getDateRange();

    const volumeQuery = useQuery({
        queryKey: ["analytics", "volume", range],
        queryFn: () => api.analytics.volumeHistory(from, to),
    });

    const distQuery = useQuery({
        queryKey: ["analytics", "distribution", range],
        queryFn: () => api.analytics.muscleDistribution(from, to),
    });

    const densityQuery = useQuery({
        queryKey: ["analytics", "density", range],
        queryFn: () => api.analytics.workoutDensity(from, to),
    });

    const radarQuery = useQuery({
        queryKey: ["analytics", "radar"],
        queryFn: () => api.analytics.plateauRadar(),
    });

    const caloriesHistoryQuery = useQuery({
        queryKey: ["analytics", "calories-history", range],
        queryFn: () => api.analytics.caloriesHistory(from, to),
    });

    const caloriesSummaryQuery = useQuery({
        queryKey: ["analytics", "calories-summary", range],
        queryFn: () => api.analytics.caloriesSummary(from, to),
    });

    const consistencyQuery = useQuery({
        queryKey: ["analytics", "consistency", consistencyYear],
        queryFn: () => api.analytics.consistency(consistencyYear),
    });

    const thisMonthQuery = useQuery({
        queryKey: ["analytics", "consistency-month", thisMonthYear, thisMonthMonth],
        queryFn: () => api.analytics.consistency(thisMonthYear, thisMonthMonth),
    });

    const prQuery = useQuery({
        queryKey: ["pr", "trophy-room", "month"],
        queryFn: () => api.pr.trophyRoom("month"),
    });

    const isLoading =
        volumeQuery.isLoading ||
        distQuery.isLoading ||
        densityQuery.isLoading ||
        radarQuery.isLoading ||
        caloriesHistoryQuery.isLoading ||
        caloriesSummaryQuery.isLoading;

    const isLoadingConsistency = consistencyQuery.isLoading;
    const prData = prQuery.data;
    const thisMonthData = thisMonthQuery.data;
    const daysSet = new Set(thisMonthData?.days.map((d) => d.date) ?? []);

    return (
        <div className="flex flex-col h-[calc(100dvh-72px)] max-w-7xl mx-auto w-full overflow-hidden">
            <div className="flex-shrink-0 px-4 pt-6 pb-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics</h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                    Stats, volume, and intensity.
                </p>
            </div>

            <Tabs defaultValue="stats" className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-shrink-0 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/60 px-4 pb-2">
                    <TabsList className="h-11 p-1 rounded-xl bg-muted/60 border border-border/60 w-full sm:w-auto grid grid-cols-3">
                        <TabsTrigger
                            value="stats"
                            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium"
                        >
                            <TrendingUp className="size-4 mr-1.5 sm:mr-2 opacity-80" />
                            Stats
                        </TabsTrigger>
                        <TabsTrigger
                            value="volume"
                            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium"
                        >
                            <BarChart3 className="size-4 mr-1.5 sm:mr-2 opacity-80" />
                            Volume
                        </TabsTrigger>
                        <TabsTrigger
                            value="intensity"
                            className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium"
                        >
                            <Flame className="size-4 mr-1.5 sm:mr-2 opacity-80" />
                            Intensity
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Stats tab: Exercise progression, PRs, This month, Consistency heatmap */}
                <TabsContent value="stats" className="flex-1 min-h-0 overflow-y-auto mt-0 data-[state=inactive]:hidden">
                    <div className="px-4 py-6 space-y-6 pb-24">
                        <Link href="/stats/progression">
                            <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm transition-all hover:bg-muted/30 hover:border-primary/30 cursor-pointer hover:shadow-md">
                                <CardContent className="py-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <TrendingUp className="size-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Exercise progression</p>
                                            <p className="text-muted-foreground text-sm">1RM, volume & max weight by exercise</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="size-5 text-muted-foreground" />
                                </CardContent>
                            </Card>
                        </Link>

                        {prQuery.isLoading ? (
                            <Skeleton className="h-32 rounded-2xl" />
                        ) : prData && (
                            <Card className="overflow-hidden rounded-2xl border-primary/20">
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

                        {thisMonthQuery.isLoading ? (
                            <Skeleton className="h-48 rounded-2xl" />
                        ) : (
                            <Card className="rounded-2xl border-border/80">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <Calendar className="size-5" />
                                                {isCurrentMonth ? "This month" : monthLabel}
                                            </CardTitle>
                                            <CardDescription>
                                                {thisMonthQuery.isError
                                                    ? "Couldn't load this month."
                                                    : `Days with workouts: ${thisMonthData?.days?.length ?? 0}`}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5 shrink-0">
                                            <button
                                                type="button"
                                                onClick={goPrevMonth}
                                                className="size-8 flex items-center justify-center rounded-md hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
                                                aria-label="Previous month"
                                            >
                                                <ChevronLeft className="size-5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={goNextMonth}
                                                disabled={isCurrentMonth}
                                                className={cn(
                                                    "size-8 flex items-center justify-center rounded-md hover:bg-background transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:pointer-events-none"
                                                )}
                                                aria-label="Next month"
                                            >
                                                <ChevronRight className="size-5" />
                                            </button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {thisMonthQuery.isError ? (
                                        <p className="text-sm text-muted-foreground py-4 text-center">Try again later.</p>
                                    ) : (
                                        <ThisMonthGrid
                                            year={thisMonthYear}
                                            month={thisMonthMonth}
                                            days={thisMonthData?.days ?? []}
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center justify-end gap-2">
                                <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setConsistencyYear((y) => y - 1)}
                                        className="size-8 flex items-center justify-center rounded-md hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
                                        aria-label="Previous year"
                                    >
                                        ←
                                    </button>
                                    <span className="min-w-[3rem] text-center text-sm font-semibold tabular-nums">{consistencyYear}</span>
                                    <button
                                        type="button"
                                        onClick={() => setConsistencyYear((y) => y + 1)}
                                        disabled={consistencyYear >= new Date().getFullYear()}
                                        className={cn(
                                            "size-8 flex items-center justify-center rounded-md hover:bg-background transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:pointer-events-none"
                                        )}
                                        aria-label="Next year"
                                    >
                                        →
                                    </button>
                                </div>
                            </div>
                            {isLoadingConsistency ? (
                                <Skeleton className="w-full min-h-[340px] rounded-2xl" />
                            ) : (
                                <ConsistencyHeatmap
                                    year={consistencyYear}
                                    days={consistencyQuery.data?.days ?? []}
                                    className="rounded-2xl border-border/80 shadow-sm overflow-hidden"
                                />
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Volume tab */}
                <TabsContent value="volume" className="flex-1 min-h-0 overflow-y-auto mt-0 data-[state=inactive]:hidden">
                    <div className="px-4 py-6 space-y-6 pb-24">
                        <div className="flex items-center justify-end gap-2">
                            <Calendar className="size-4 text-muted-foreground shrink-0" />
                            <Select value={range} onValueChange={(v) => setRange(v as TimeRange)}>
                                <SelectTrigger className="w-full sm:w-[140px] rounded-xl border-border/80 bg-background/80">
                                    <SelectValue placeholder="Range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1m">Last month</SelectItem>
                                    <SelectItem value="3m">Last 3 months</SelectItem>
                                    <SelectItem value="6m">Last 6 months</SelectItem>
                                    <SelectItem value="1y">Last year</SelectItem>
                                    <SelectItem value="all">All time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {isLoading ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Skeleton className="w-full h-[320px] rounded-2xl" />
                                <Skeleton className="w-full h-[320px] rounded-2xl" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <TotalVolumeChart data={volumeQuery.data || []} />
                                <VolumeGrowthChart data={volumeQuery.data || []} />
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Intensity tab */}
                <TabsContent value="intensity" className="flex-1 min-h-0 overflow-y-auto mt-0 data-[state=inactive]:hidden">
                    <div className="px-4 py-6 space-y-6 pb-24">
                        <div className="flex items-center justify-end gap-2">
                            <Calendar className="size-4 text-muted-foreground shrink-0" />
                            <Select value={range} onValueChange={(v) => setRange(v as TimeRange)}>
                                <SelectTrigger className="w-full sm:w-[140px] rounded-xl border-border/80 bg-background/80">
                                    <SelectValue placeholder="Range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1m">Last month</SelectItem>
                                    <SelectItem value="3m">Last 3 months</SelectItem>
                                    <SelectItem value="6m">Last 6 months</SelectItem>
                                    <SelectItem value="1y">Last year</SelectItem>
                                    <SelectItem value="all">All time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Skeleton className="w-full h-[320px] rounded-2xl" />
                                <Skeleton className="w-full h-[300px] rounded-2xl" />
                                <Skeleton className="w-full h-[300px] rounded-2xl" />
                                <Skeleton className="w-full h-[300px] rounded-2xl" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <CaloriesBurnedChart
                                        data={caloriesHistoryQuery.data || []}
                                        emptyMessage="Log weight in Me to see calorie estimates."
                                    />
                                </div>
                                <CaloriesSummaryCard data={caloriesSummaryQuery.data} />
                                <MuscleSplitChart data={distQuery.data || []} />
                                <RepDensityChart data={densityQuery.data || []} />
                                <div className="md:col-span-2">
                                    <PlateauRadarChart data={radarQuery.data || []} />
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
