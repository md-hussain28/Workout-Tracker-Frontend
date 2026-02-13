"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Flame, TrendingUp, TrendingDown, Trophy, Activity } from "lucide-react";
import { api, type StreakResponse } from "@/lib/api";

// ── SVG Circular Progress ──
function CircleProgress({
    value,
    max,
    size = 80,
    stroke = 5,
}: {
    value: number;
    max: number;
    size?: number;
    stroke?: number;
}) {
    const r = (size - stroke) / 2;
    const circumference = 2 * Math.PI * r;
    const pct = Math.min(value / Math.max(max, 1), 1);
    const offset = circumference * (1 - pct);

    return (
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
            <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke="currentColor"
                strokeWidth={stroke}
                className="text-muted/30"
            />
            <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke="currentColor"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="text-primary"
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
        </svg>
    );
}

// ── Mini Sparkline ──
function Sparkline({ data, color = "var(--primary)" }: { data: number[]; color?: string }) {
    if (data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 100;
    const h = 32;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}

interface BentoGridProps {
    streak: StreakResponse | undefined;
}

export function BentoGrid({ streak }: BentoGridProps) {
    const now = new Date();

    // Workouts this month (for the streak ring)
    const { data: monthConsistency } = useQuery({
        queryKey: ["analytics", "consistency", now.getFullYear(), now.getMonth() + 1],
        queryFn: () => api.analytics.consistency(now.getFullYear(), now.getMonth() + 1),
    });

    const workoutsThisMonth = monthConsistency?.days?.length ?? 0;
    const monthlyGoal = 16; // ~4 per week

    // Tonnage for "Volume" tile
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const { data: tonnage } = useQuery({
        queryKey: ["analytics", "tonnage", "30d"],
        queryFn: () => api.analytics.tonnage(thirtyDaysAgo.toISOString(), now.toISOString()),
    });

    const sortedWorkouts = useMemo(() => {
        return (tonnage?.workouts ?? []).slice().sort((a, b) => new Date(b.started_at!).getTime() - new Date(a.started_at!).getTime());
    }, [tonnage]);

    const lastSessionVolume = sortedWorkouts[0]?.tonnage ?? 0;
    const avgVolume = sortedWorkouts.length >= 2
        ? sortedWorkouts.slice(1, 4).reduce((s, w) => s + w.tonnage, 0) / Math.min(sortedWorkouts.length - 1, 3)
        : 0;
    const volumeTrend = avgVolume > 0 ? ((lastSessionVolume - avgVolume) / avgVolume) * 100 : 0;
    const volumeUp = volumeTrend >= 0;

    // Plateau radar for "PR Bounty" tile
    const { data: plateauData } = useQuery({
        queryKey: ["analytics", "radar"],
        queryFn: () => api.analytics.plateauRadar(),
    });

    // Find the exercise with highest plateau score (most stagnant)
    const prTarget = useMemo(() => {
        if (!plateauData || plateauData.length === 0) return null;
        const sorted = [...plateauData].sort((a: any, b: any) => (b.plateau_score ?? b.staleness ?? 0) - (a.plateau_score ?? a.staleness ?? 0));
        return sorted[0];
    }, [plateauData]);

    // Volume history for body weight / sparkline tile
    const volumeHistory = useMemo(() => {
        return sortedWorkouts.slice().reverse().map((w) => w.tonnage);
    }, [sortedWorkouts]);

    const cardVariants = {
        hidden: { opacity: 0, y: 16, scale: 0.96 },
        visible: (i: number) => ({
            opacity: 1, y: 0, scale: 1,
            transition: { delay: i * 0.08, type: "spring" as const, stiffness: 300, damping: 30 },
        }),
    };

    return (
        <div className="grid grid-cols-4 grid-rows-[auto_auto_auto] gap-3">
            {/* Tile A — Streak (2×2) */}
            <motion.div
                custom={0}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="col-span-2 row-span-2 glass rounded-2xl p-4 relative flex flex-col items-center justify-center min-h-[170px]"
            >
                <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
                    <CircleProgress value={workoutsThisMonth} max={monthlyGoal} />
                    <div className="flex flex-col items-center z-10">
                        <Flame className="size-5 text-orange-400 mb-0.5" />
                        <span className="text-2xl font-bold tabular-nums leading-none">
                            {streak?.current_streak ?? 0}
                        </span>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">day streak</p>
                <div className="flex items-center gap-3 mt-2">
                    <div className="text-center">
                        <p className="text-lg font-bold tabular-nums">{workoutsThisMonth}</p>
                        <p className="text-[10px] text-muted-foreground">this month</p>
                    </div>
                    <div className="w-px h-6 bg-border" />
                    <div className="text-center">
                        <p className="text-lg font-bold tabular-nums">{streak?.longest_streak ?? 0}</p>
                        <p className="text-[10px] text-muted-foreground">best</p>
                    </div>
                </div>
            </motion.div>

            {/* Tile B — Volume Trend (2×1) */}
            <motion.div
                custom={1}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="col-span-2 glass rounded-2xl p-3.5 flex flex-col justify-between"
            >
                <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Last Session</p>
                    {volumeUp ? (
                        <TrendingUp className="size-3.5 text-green-400" />
                    ) : (
                        <TrendingDown className="size-3.5 text-red-400" />
                    )}
                </div>
                <div className="mt-1">
                    <span className="text-xl font-bold tabular-nums">
                        {lastSessionVolume >= 1000 ? `${(lastSessionVolume / 1000).toFixed(1)}k` : lastSessionVolume.toFixed(0)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">kg</span>
                </div>
                {avgVolume > 0 && (
                    <p className={`text-[10px] font-medium ${volumeUp ? "text-green-400" : "text-red-400"}`}>
                        {volumeUp ? "+" : ""}{volumeTrend.toFixed(0)}% vs avg
                    </p>
                )}
            </motion.div>

            {/* Tile C — PR Bounty (2×1) */}
            <motion.div
                custom={2}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="col-span-2 rounded-2xl p-3.5 flex flex-col justify-between border border-amber-500/20 bg-amber-500/5"
            >
                <div className="flex items-center gap-1.5">
                    <Trophy className="size-3.5 text-amber-400" />
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">PR Bounty</p>
                </div>
                {prTarget ? (
                    <div className="mt-1">
                        <p className="text-sm font-semibold leading-tight line-clamp-1">{(prTarget as any).exercise_name ?? (prTarget as any).name ?? "Target"}</p>
                        <p className="text-[10px] text-amber-400/80 mt-0.5">
                            {(prTarget as any).best_weight != null ? `Beat ${(prTarget as any).best_weight}kg` : "Break through plateau"}
                        </p>
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground mt-1">Keep training!</p>
                )}
            </motion.div>

            {/* Tile D — Volume Sparkline (4×1 wide) */}
            <motion.div
                custom={3}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="col-span-4 glass rounded-2xl p-3.5"
            >
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                        <Activity className="size-3.5 text-primary" />
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Volume Trend</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{sortedWorkouts.length} sessions</p>
                </div>
                {volumeHistory.length >= 2 ? (
                    <Sparkline data={volumeHistory} />
                ) : (
                    <div className="h-8 flex items-center justify-center">
                        <p className="text-[10px] text-muted-foreground">Not enough data yet</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
