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
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, TrendingUp, ChevronRight, BarChart3, Flame } from "lucide-react";
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

    const isLoading =
        volumeQuery.isLoading ||
        distQuery.isLoading ||
        densityQuery.isLoading ||
        radarQuery.isLoading ||
        caloriesHistoryQuery.isLoading ||
        caloriesSummaryQuery.isLoading;

    const isLoadingConsistency = consistencyQuery.isLoading;

    return (
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Volume, consistency, and intensity.
                    </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
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
            </div>

            <Tabs defaultValue="volume" className="space-y-6">
                <TabsList className="h-11 p-1 rounded-xl bg-muted/60 border border-border/60 w-full sm:w-auto grid grid-cols-3">
                    <TabsTrigger
                        value="volume"
                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium"
                    >
                        <BarChart3 className="size-4 mr-1.5 sm:mr-2 opacity-80" />
                        Volume
                    </TabsTrigger>
                    <TabsTrigger
                        value="consistency"
                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium"
                    >
                        <Calendar className="size-4 mr-1.5 sm:mr-2 opacity-80" />
                        Consistency
                    </TabsTrigger>
                    <TabsTrigger
                        value="intensity"
                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium"
                    >
                        <Flame className="size-4 mr-1.5 sm:mr-2 opacity-80" />
                        Intensity
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="volume" className="space-y-6 mt-0">
                    {isLoading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Skeleton className="w-full h-[320px] rounded-2xl" />
                            <Skeleton className="w-full h-[320px] rounded-2xl" />
                        </div>
                    ) : (
                        <>
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
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <TotalVolumeChart data={volumeQuery.data || []} />
                                <VolumeGrowthChart data={volumeQuery.data || []} />
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="consistency" className="space-y-6 mt-0">
                    {isLoadingConsistency ? (
                        <Skeleton className="w-full min-h-[340px] rounded-2xl" />
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm text-muted-foreground">Workout days by month — darker = more volume</p>
                                <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1">
                                    <button
                                        type="button"
                                        onClick={() => setConsistencyYear((y) => y - 1)}
                                        className="px-2 py-1 text-xs font-medium rounded-md hover:bg-background transition-colors"
                                    >
                                        ← {consistencyYear - 1}
                                    </button>
                                    <span className="px-2 py-1 text-xs font-semibold tabular-nums">{consistencyYear}</span>
                                    <button
                                        type="button"
                                        onClick={() => setConsistencyYear((y) => y + 1)}
                                        className={cn(
                                            "px-2 py-1 text-xs font-medium rounded-md hover:bg-background transition-colors",
                                            consistencyYear >= new Date().getFullYear() && "opacity-50 pointer-events-none"
                                        )}
                                    >
                                        {consistencyYear + 1} →
                                    </button>
                                </div>
                            </div>
                            <ConsistencyHeatmap
                                year={consistencyYear}
                                days={consistencyQuery.data?.days ?? []}
                                className="rounded-2xl border-border/80 shadow-sm overflow-hidden"
                            />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="intensity" className="space-y-6 mt-0">
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
                </TabsContent>
            </Tabs>
        </div>
    );
}
