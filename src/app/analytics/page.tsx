"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    VolumeGrowthChart,
    MuscleSplitChart,
    RepDensityChart,
    PlateauRadarChart,
} from "@/components/AnalyticsCharts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"; // New import
import { Calendar, AlertCircle } from "lucide-react"; // Added AlertCircle

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
        queryKey: ["analytics", "radar"], // Radar is always all-time vs recent
        queryFn: () => api.analytics.plateauRadar(),
    });

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Row 1: Volume Growth (Wide) */}
                <div className="md:col-span-2">
                    <VolumeGrowthChart data={volumeQuery.data || []} />
                </div>

                {/* Row 2: Split & Density */}
                <div className="md:col-span-1">
                    <MuscleSplitChart data={distQuery.data || []} />
                </div>
                <div className="md:col-span-1">
                    <RepDensityChart data={densityQuery.data || []} />
                </div>

                {/* Row 3: Radar (Wide) */}
                <div className="md:col-span-2">
                    <PlateauRadarChart data={radarQuery.data || []} />
                </div>
            </div>
        </div>
    );
}
