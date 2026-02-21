"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, TrendingUp, Droplets, Target } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

// --- Configuration ---
const ALGORITHMS = [
    {
        key: "bf_army",
        name: "U.S. Army (2024)",
        color: "#3b82f6", // blue-500
        description: "2024 validated equation. Uses your logged Waist, Hips, and Weight.",
        formula: "Men: -38.32 + 2.23×abdomen + 0.68×hip - 0.43×waist - 0.16×weight (abdomen/waist/hip = your Waist & Hips)",
    },
    {
        key: "bf_cun_bae",
        name: "CUN-BAE",
        color: "#8b5cf6", // violet-500
        description: "Clinica Universidad de Navarra. Uses BMI, age, and sex. Superior to standalone BMI in diverse populations.",
        formula: "-44.988 + (0.503×age) + (10.689×sex) + (3.172×BMI) - (0.026×BMI²) + ...",
    },
    {
        key: "bf_rfm",
        name: "Relative Fat Mass (RFM)",
        color: "#f59e0b", // amber-500
        description: "Simple, waist-focused. Correlates very well with DEXA scans.",
        formula: "Men: 64 - (20 × height/waist)",
    },
    {
        key: "bf_multi",
        name: "Multi-Girth proxy",
        color: "#ef4444", // red-500
        description: "Proxy regression utilizing waist, chest, hips and BMI for detailed approximation.",
        formula: "0.5×BMI + 0.4×waist + 0.2×hips - 0.3×chest - 15",
    },
    {
        key: "bf_navy",
        name: "U.S. Navy",
        color: "#10b981", // emerald-500
        description: "Standard equation historically used by the military. Relies heavily on waist and neck measurements.",
        formula: "Men: 86.010×log10(waist−neck) − 70.041×log10(height) + 36.76",
    },
];

export default function BodyFatAnalyticsPage() {
    const { data: history = [], isLoading: isHistoryLoading } = useQuery({
        queryKey: ["body-history"],
        queryFn: () => api.body.listLogs(),
    });

    const { data: latest, isLoading: isLatestLoading } = useQuery({
        queryKey: ["body-latest"],
        queryFn: () => api.body.getLatest(),
    });

    const isLoading = isHistoryLoading || isLatestLoading;

    // --- Chart Data Processing ---
    const chartData = useMemo(() => {
        return [...history]
            .reverse() // Oldest to newest
            .map((log) => {
                const dateObj = new Date(log.created_at);
                const point: Record<string, string | number | null> = {
                    date: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    timestamp: dateObj.getTime(),
                };

                // Attach stats if present
                if (log.computed_stats) {
                    ALGORITHMS.forEach(({ key }) => {
                        point[key] = (log.computed_stats as unknown as Record<string, number | null>)[key] ?? null;
                    });
                }
                return point;
            })
            // Filter out points where ALL algorithms are null
            .filter((point) => ALGORITHMS.some(({ key }) => point[key] !== null));
    }, [history]);

    // Format tooltip to 1 decimal place
    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-xl border border-border/40 bg-card/95 p-3 shadow-xl backdrop-blur-md">
                    <p className="mb-2 text-sm font-semibold text-foreground">{label}</p>
                    <div className="flex flex-col gap-1.5">
                        {payload.map((entry: any) => (
                            <div key={entry.name} className="flex items-center justify-between gap-4 text-xs">
                                <span style={{ color: entry.color }} className="font-medium">
                                    {entry.name}
                                </span>
                                <span className="font-bold">{entry.value.toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="mx-auto max-w-xl px-4 pt-6 pb-12 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link href="/me">
                    <Button variant="ghost" size="icon" className="rounded-full size-8 -ml-2 shrink-0">
                        <ArrowLeft className="size-4" />
                    </Button>
                </Link>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                    Predictive Models
                </h1>
            </div>

            {/* Introductory Explanation */}
            <p className="text-sm text-muted-foreground leading-relaxed">
                Evaluating body composition through circumference equations gives a reliable alternative to DEXA scans. We run your logs through five structurally different, clinically-validated regression algorithms to minimize error variance.
            </p>

            {/* Historical Comparison Chart */}
            <Card className="border-border/40 shadow-sm overflow-hidden">
                <CardHeader className="pb-2 bg-muted/20">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="size-4 text-primary" />
                        <CardTitle className="text-base font-semibold">Longitudinal Tracking</CardTitle>
                    </div>
                    <CardDescription>
                        Compare the trajectory of different body fat equations over time.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 px-4">
                    {isLoading ? (
                        <Skeleton className="h-[300px] w-full rounded-xl" />
                    ) : chartData.length > 0 ? (
                        <div className="h-[320px] w-full -ml-3">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/40 opacity-50" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="currentColor"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        className="text-muted-foreground"
                                        minTickGap={20}
                                    />
                                    <YAxis
                                        stroke="currentColor"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        className="text-muted-foreground"
                                        width={36}
                                        domain={['auto', 'auto']}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                                    {ALGORITHMS.map(({ key, name, color }) => (
                                        <Line
                                            key={key}
                                            type="monotone"
                                            dataKey={key}
                                            name={name}
                                            stroke={color}
                                            strokeWidth={2.5}
                                            dot={{ r: 3, fill: color, strokeWidth: 0 }}
                                            activeDot={{ r: 5, strokeWidth: 0 }}
                                            connectNulls
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex h-[250px] flex-col items-center justify-center text-center">
                            <Droplets className="size-8 text-muted/40 mb-3" />
                            <p className="text-sm font-medium text-foreground">No data available</p>
                            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                                Add weight and circumferences to generate predictive charts.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Algorithm Details List */}
            <div className="space-y-4 pt-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    Latest Predictions & Inner Workings
                </h2>

                {isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-28 w-full rounded-2xl" />
                        <Skeleton className="h-28 w-full rounded-2xl" />
                    </div>
                ) : (
                    <Accordion type="single" collapsible className="w-full space-y-3">
                        {ALGORITHMS.map((algo) => {
                            const latestValue = latest?.computed_stats?.[algo.key as keyof typeof latest.computed_stats] as number | null | undefined;
                            return (
                                <AccordionItem
                                    key={algo.key}
                                    value={algo.key}
                                    className="border border-border/40 rounded-2xl bg-card overflow-hidden shadow-sm"
                                >
                                    <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center w-full justify-between pr-2">
                                            <div className="flex items-center gap-3">
                                                <div className="size-3 rounded-full shadow-sm" style={{ backgroundColor: algo.color }} />
                                                <span className="font-semibold text-sm">{algo.name}</span>
                                            </div>
                                            <div className="text-right">
                                                {latestValue != null ? (
                                                    <span className="text-lg font-bold tracking-tight">
                                                        {latestValue.toFixed(1)}<span className="text-sm text-muted-foreground font-medium ml-0.5">%</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-sm font-medium text-muted-foreground italic">
                                                        Missing data
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-5 pb-5 pt-1 border-t border-border/40 bg-muted/10">
                                        <div className="space-y-3 pt-3">
                                            <p className="text-sm text-foreground leading-relaxed">
                                                {algo.description}
                                            </p>
                                            <div className="rounded-lg bg-card border border-border/40 p-3 font-mono text-[11px] text-muted-foreground overflow-x-auto shadow-inner">
                                                <code>{algo.formula}</code>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                )}
            </div>

            <div className="pt-6 pb-8 text-center">
                <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5 opacity-80">
                    <Target className="size-3.5" />
                    Algorithms dynamically calculate upon logging.
                </p>
            </div>
        </div>
    );
}
