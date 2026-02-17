"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    VolumeGrowthChart,
    MuscleSplitChart,
    RepDensityChart,
    PlateauRadarChart,
    CaloriesBurnedChart,
    CaloriesSummaryCard,
} from "@/components/AnalyticsCharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, TrendingUp, ChevronRight } from "lucide-react";

type TimeRange = "1m" | "3m" | "6m" | "1y" | "all";

export default function AnalyticsPage() {
    const [range, setRange] = useState<TimeRange>("3m");

    // Calculate dates based on range
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

    // Queries
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

    const isLoading =
        volumeQuery.isLoading ||
        distQuery.isLoading ||
        densityQuery.isLoading ||
        radarQuery.isLoading ||
        caloriesHistoryQuery.isLoading ||
        caloriesSummaryQuery.isLoading;

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Track your progress, balance, and intensity.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <Select value={range} onValueChange={(v) => setRange(v as TimeRange)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Select Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1m">Last Month</SelectItem>
                            <SelectItem value="3m">Last 3 Months</SelectItem>
                            <SelectItem value="6m">Last 6 Months</SelectItem>
                            <SelectItem value="1y">Last Year</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <Skeleton className="w-full h-[320px] rounded-xl" />
                    </div>
                    <div className="md:col-span-2">
                        <Skeleton className="w-full h-[320px] rounded-xl" />
                    </div>
                    <div className="md:col-span-1">
                        <Skeleton className="w-full h-[300px] rounded-xl" />
                    </div>
                    <div className="md:col-span-1">
                        <Skeleton className="w-full h-[300px] rounded-xl" />
                    </div>
                    <div className="md:col-span-1">
                        <Skeleton className="w-full h-[300px] rounded-xl" />
                    </div>
                    <div className="md:col-span-1">
                        <Skeleton className="w-full h-[300px] rounded-xl" />
                    </div>
                    <div className="md:col-span-2">
                        <Skeleton className="w-full h-[300px] rounded-xl" />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <Link href="/stats/progression">
                            <Card className="mb-6 overflow-hidden border-border/80 shadow-sm transition-colors hover:bg-muted/30 hover:border-primary/30 cursor-pointer">
                                <CardContent className="py-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <TrendingUp className="size-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">Exercise progression</p>
                                            <p className="text-muted-foreground text-sm">View 1RM, volume & max weight by exercise</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="size-5 text-muted-foreground" />
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                    <div className="md:col-span-2">
                        <VolumeGrowthChart data={volumeQuery.data || []} />
                    </div>
                    <div className="md:col-span-2">
                        <CaloriesBurnedChart
                            data={caloriesHistoryQuery.data || []}
                            emptyMessage="Log weight in Me to see calorie estimates."
                        />
                    </div>
                    <div className="md:col-span-1">
                        <CaloriesSummaryCard data={caloriesSummaryQuery.data} />
                    </div>
                    <div className="md:col-span-1">
                        <MuscleSplitChart data={distQuery.data || []} />
                    </div>
                    <div className="md:col-span-1">
                        <RepDensityChart data={densityQuery.data || []} />
                    </div>
                    <div className="md:col-span-1">
                        <PlateauRadarChart data={radarQuery.data || []} />
                    </div>
                </div>
            )}
        </div>
    );
}
