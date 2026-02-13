"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api, type Workout } from "@/lib/api";

// Recovery time constants
const FULL_RECOVERY_HOURS = 72; // 100% recovered after 72h

function getRecoveryPct(lastTrainedDate: string | null): number {
    if (!lastTrainedDate) return 100; // Never trained = fully recovered
    const hoursSince = (Date.now() - new Date(lastTrainedDate).getTime()) / 3600000;
    return Math.min(100, Math.round((hoursSince / FULL_RECOVERY_HOURS) * 100));
}

function getBarColor(pct: number): string {
    if (pct >= 70) return "bg-green-400";
    if (pct >= 30) return "bg-amber-400";
    return "bg-red-400";
}

function getBarBg(pct: number): string {
    if (pct >= 70) return "bg-green-400/10";
    if (pct >= 30) return "bg-amber-400/10";
    return "bg-red-400/10";
}

function getLabel(pct: number): string {
    if (pct >= 70) return "Ready";
    if (pct >= 30) return "Partial";
    return "Recovering";
}

interface MuscleRecoveryData {
    name: string;
    color: string | null;
    recovery: number;
}

export function MuscleRecovery() {
    // Get muscle groups
    const { data: muscleGroups = [] } = useQuery({
        queryKey: ["muscleGroups"],
        queryFn: () => api.muscleGroups.list(),
    });

    // Get recent workouts with sets to determine last-trained dates per muscle
    const { data: recentWorkouts = [] } = useQuery({
        queryKey: ["workouts", "recovery-check"],
        queryFn: () => api.workouts.list(0, 20),
    });

    // Fetch full details for recent completed workouts (last 10)
    const completedIds = useMemo(
        () => recentWorkouts.filter((w) => w.ended_at).slice(0, 10).map((w) => w.id),
        [recentWorkouts]
    );

    const workoutQueries = useQuery({
        queryKey: ["workouts", "details-for-recovery", completedIds],
        queryFn: async () => {
            const results = await Promise.all(completedIds.map((id) => api.workouts.get(id)));
            return results;
        },
        enabled: completedIds.length > 0,
    });

    const recoveryData = useMemo((): MuscleRecoveryData[] => {
        if (muscleGroups.length === 0) return [];

        // Build a map of muscle group id → last trained date
        const lastTrained = new Map<number, string>();
        const workouts = workoutQueries.data ?? [];

        for (const workout of workouts) {
            if (!workout.sets) continue;
            for (const set of workout.sets) {
                const exercise = set.exercise;
                if (!exercise) continue;

                const muscleIds = [
                    exercise.primary_muscle_group_id,
                    exercise.secondary_muscle_group_id,
                    exercise.tertiary_muscle_group_id,
                ].filter(Boolean) as number[];

                for (const mgId of muscleIds) {
                    const existing = lastTrained.get(mgId);
                    const setDate = workout.started_at;
                    if (!existing || new Date(setDate) > new Date(existing)) {
                        lastTrained.set(mgId, setDate);
                    }
                }
            }
        }

        return muscleGroups.map((mg) => ({
            name: mg.name,
            color: mg.color,
            recovery: getRecoveryPct(lastTrained.get(mg.id) ?? null),
        }));
    }, [muscleGroups, workoutQueries.data]);

    if (recoveryData.length === 0) return null;

    // Sort: least recovered first
    const sorted = [...recoveryData].sort((a, b) => a.recovery - b.recovery);

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Muscle Recovery
                </h3>
                <span className="text-[10px] text-muted-foreground">72h cycle</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {sorted.map((m, i) => (
                    <motion.div
                        key={m.name}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 30 }}
                        className="glass-light rounded-xl px-3 py-2.5"
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                                {m.color && (
                                    <div className="size-2 rounded-full" style={{ backgroundColor: m.color }} />
                                )}
                                <span className="text-xs font-medium leading-tight line-clamp-1">{m.name}</span>
                            </div>
                            <span className={`text-[10px] font-semibold tabular-nums ${m.recovery >= 70 ? "text-green-400" : m.recovery >= 30 ? "text-amber-400" : "text-red-400"
                                }`}>
                                {m.recovery}%
                            </span>
                        </div>
                        <div className={`h-1.5 rounded-full ${getBarBg(m.recovery)} overflow-hidden`}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${m.recovery}%` }}
                                transition={{ delay: i * 0.04 + 0.2, duration: 0.6, ease: "easeOut" }}
                                className={`h-full rounded-full ${getBarColor(m.recovery)}`}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
