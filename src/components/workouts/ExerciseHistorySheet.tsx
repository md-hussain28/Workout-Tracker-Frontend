"use client";

import { useState } from "react";
import Link from "next/link";
import { History, TrendingUp, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

interface ExerciseHistorySheetProps {
    exerciseId: string;
    exerciseName: string;
    workoutId: string;
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onApplyStats?: (weight: number, reps: number) => void;
}

export function ExerciseHistorySheet({
    exerciseId,
    exerciseName,
    workoutId,
    open,
    onOpenChange,
    onApplyStats,
}: ExerciseHistorySheetProps) {
    const { data: stats, isLoading, isError, error } = useQuery({
        queryKey: ["exerciseStats", exerciseId],
        queryFn: () => api.exercises.getStats(exerciseId),
        enabled: open,
        retry: false,
    });

    const { data: prev } = useQuery({
        queryKey: ["previousSession", exerciseId, workoutId],
        queryFn: () => api.previousSession.get(exerciseId, workoutId),
        enabled: open,
    });

    const [showError, setShowError] = useState(false);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="rounded-t-3xl border-t pt-6 pb-[max(env(safe-area-inset-bottom),24px)] max-h-[80dvh] overflow-y-auto"
            >
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <History className="size-5" />
                        {exerciseName}
                    </SheetTitle>
                    {onApplyStats && <p className="text-xs text-muted-foreground font-normal">Tap a set to copy stats</p>}
                </SheetHeader>

                {isLoading && (
                    <div className="mt-4 space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 bg-muted/50 animate-pulse rounded-xl" />
                        ))}
                    </div>
                )}

                {isError && (
                    <div className="mt-6 flex flex-col items-center justify-center text-center p-4 bg-destructive/10 rounded-xl space-y-3">
                        <div className="size-10 rounded-full bg-destructive/20 flex items-center justify-center">
                            <History className="size-5 text-destructive" />
                        </div>
                        <div>
                            <p className="font-semibold text-destructive">Failed to load history</p>
                            <p className="text-xs text-muted-foreground mb-2">Something went wrong fetching stats.</p>
                            <button
                                onClick={() => setShowError(!showError)}
                                className="text-[10px] text-muted-foreground underline"
                            >
                                {showError ? "Hide details" : "Know more"}
                            </button>
                            {showError && (
                                <div className="mt-2 text-left bg-background/50 p-2 rounded-md border text-[10px] font-mono text-muted-foreground break-all">
                                    {error instanceof Error ? error.message : "Unknown error"}
                                </div>
                            )}
                        </div>
                        <Link href={`/exercises/${exerciseId}`}>
                            <Button variant="outline" size="sm" className="w-full">
                                See Full Details
                            </Button>
                        </Link>
                    </div>
                )}

                {stats && (
                    <div className="mt-4 space-y-4">
                        {/* PRs & Stats */}
                        <div className="grid grid-cols-3 gap-2">
                            {stats.prs.best_weight != null && (
                                <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                                    <p className="text-xs text-muted-foreground">Best Weight</p>
                                    <p className="font-bold tabular-nums">{stats.prs.best_weight}</p>
                                </div>
                            )}
                            {stats.prs.best_1rm != null && (
                                <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                                    <p className="text-xs text-muted-foreground">Est. 1RM</p>
                                    <p className="font-bold tabular-nums">{Math.round(stats.prs.best_1rm)}</p>
                                </div>
                            )}
                            {stats.prs.best_reps != null && (
                                <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                                    <p className="text-xs text-muted-foreground">Best Reps</p>
                                    <p className="font-bold tabular-nums">{stats.prs.best_reps}</p>
                                </div>
                            )}
                        </div>

                        {/* Recent History / Previous Session */}
                        {prev && prev.sets.length > 0 && (
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                    Last Session{prev.workout_started_at ? ` · ${new Date(prev.workout_started_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
                                </p>
                                <div className="space-y-1">
                                    {prev.sets
                                        .sort((a, b) => a.set_order - b.set_order)
                                        .map((s, idx) => (
                                            <button
                                                key={s.id}
                                                className="w-full flex items-center gap-3 text-sm bg-muted/30 rounded-lg px-3 py-2 hover:bg-muted/50 active:bg-muted transition-colors"
                                                onClick={() => s.weight != null && s.reps != null && onApplyStats?.(s.weight, s.reps)}
                                            >
                                                <span className="text-muted-foreground w-6 text-xs text-left">{idx + 1}</span>
                                                <span className="font-medium tabular-nums">{s.weight ?? "—"}</span>
                                                <span className="text-muted-foreground">×</span>
                                                <span className="font-medium tabular-nums">{s.reps ?? (s.duration_seconds ? `${s.duration_seconds}s` : "—")}</span>
                                                {s.set_label && (
                                                    <Badge variant="outline" className="text-[10px] ml-auto">{s.set_label}</Badge>
                                                )}
                                            </button>
                                        ))}
                                </div>
                            </div>
                        )}

                        <Link href={`/exercises/${exerciseId}`} className="block mt-4">
                            <Button variant="outline" className="w-full">
                                See Full Stats
                            </Button>
                        </Link>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
