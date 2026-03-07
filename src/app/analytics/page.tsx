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
import { Calendar, TrendingUp, ChevronRight, BarChart3, Flame, Trophy, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";

type TimeRange = "1m" | "3m" | "6m" | "1y" | "all";

export default function AnalyticsPage() {
    const [range, setRange] = useState<TimeRange>("3m");
    const [consistencyYear, setConsistencyYear] = useState(() => new Date().getFullYear());

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

    const prQuery = useQuery({
        queryKey: ["pr", "trophy-room", "month"],
        queryFn: () => api.pr.trophyRoom("month"),
    });

    // Stats-tab-only: streak, this month summary, top muscles this month
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const streakQuery = useQuery({
        queryKey: ["streak"],
        queryFn: () => api.streak.get(),
    });
    const thisMonthConsistencyQuery = useQuery({
        queryKey: ["analytics", "consistency", now.getFullYear(), now.getMonth() + 1],
        queryFn: () => api.analytics.consistency(now.getFullYear(), now.getMonth() + 1),
    });
    const thisMonthTonnageQuery = useQuery({
        queryKey: ["analytics", "tonnage", "month", now.getFullYear(), now.getMonth()],
        queryFn: () => api.analytics.tonnage(thisMonthStart.toISOString(), thisMonthEnd.toISOString()),
    });
    const thisMonthMusclesQuery = useQuery({
        queryKey: ["analytics", "muscle-distribution", "month", now.getFullYear(), now.getMonth()],
        queryFn: () => api.analytics.muscleDistribution(thisMonthStart.toISOString(), thisMonthEnd.toISOString()),
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

                        {/* Streak */}
                        {streakQuery.isLoading ? (
                            <Skeleton className="h-24 rounded-2xl" />
                        ) : streakQuery.data && (
                            <Card className="rounded-2xl border-border/80">
                                <CardContent className="py-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Zap className="size-5 text-amber-500" />
                                        <span className="font-semibold text-sm">Streak</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <p className="text-2xl font-bold tabular-nums">{streakQuery.data.current_streak}</p>
                                            <p className="text-xs text-muted-foreground">current (days)</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold tabular-nums">{streakQuery.data.longest_streak}</p>
                                            <p className="text-xs text-muted-foreground">best ever</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium tabular-nums truncate">
                                                {streakQuery.data.last_workout_date
                                                    ? (() => {
                                                          const d = new Date(streakQuery.data.last_workout_date);
                                                          const days = Math.floor((Date.now() - d.getTime()) / 86400000);
                                                          if (days === 0) return "Today";
                                                          if (days === 1) return "Yesterday";
                                                          return `${days}d ago`;
                                                      })()
                                                    : "—"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">last workout</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* This month summary */}
                        {(thisMonthConsistencyQuery.isLoading || thisMonthTonnageQuery.isLoading) ? (
                            <Skeleton className="h-24 rounded-2xl" />
                        ) : (
                            <Card className="rounded-2xl border-border/80">
                                <CardContent className="py-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Calendar className="size-5 text-primary" />
                                        <span className="font-semibold text-sm">This month</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div>
                                            <p className="text-xl font-bold tabular-nums">{thisMonthTonnageQuery.data?.workouts?.length ?? 0}</p>
                                            <p className="text-xs text-muted-foreground">workouts</p>
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold tabular-nums">{thisMonthConsistencyQuery.data?.days?.length ?? 0}</p>
                                            <p className="text-xs text-muted-foreground">days trained</p>
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold tabular-nums">
                                                {thisMonthTonnageQuery.data?.workouts?.reduce((s, w) => s + (w.tonnage ?? 0), 0)
                                                    ? `${(thisMonthTonnageQuery.data.workouts.reduce((s, w) => s + (w.tonnage ?? 0), 0) / 1000).toFixed(1)}k`
                                                    : "0"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">kg volume</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Top muscles this month */}
                        {thisMonthMusclesQuery.isLoading ? (
                            <Skeleton className="h-28 rounded-2xl" />
                        ) : thisMonthMusclesQuery.data && thisMonthMusclesQuery.data.length > 0 && (
                            <Card className="rounded-2xl border-border/80">
                                <CardContent className="py-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Target className="size-5 text-primary" />
                                        <span className="font-semibold text-sm">Most trained this month</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">By sets (primary muscle)</p>
                                    <ul className="space-y-2">
                                        {thisMonthMusclesQuery.data.slice(0, 5).map((m, i) => (
                                            <li key={m.name} className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{m.name}</span>
                                                <span className="tabular-nums text-muted-foreground">{m.value} sets</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {prQuery.isLoading ? (
                            <Skeleton className="h-32 rounded-2xl" />
                        ) : prData && (prData.count > 0 || prData.records?.length > 0) ? (
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
                                </CardContent>
                            </Card>
                        ) : null}

                        <div className="space-y-4">
                            {isLoadingConsistency ? (
                                <Skeleton className="w-full min-h-[340px] rounded-2xl" />
                            ) : (
                                <ConsistencyHeatmap
                                    year={consistencyYear}
                                    days={consistencyQuery.data?.days ?? []}
                                    className="rounded-2xl border-border/80 shadow-sm overflow-hidden"
                                    onPrevYear={() => setConsistencyYear((y) => y - 1)}
                                    onNextYear={() => setConsistencyYear((y) => y + 1)}
                                    nextDisabled={consistencyYear >= new Date().getFullYear()}
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
