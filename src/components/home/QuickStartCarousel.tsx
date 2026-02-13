"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Play, Timer } from "lucide-react";
import { api, type Workout /* , type WorkoutTemplate */ } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

interface QuickStartCarouselProps {
    activeWorkout: Workout | undefined;
}

export function QuickStartCarousel({ activeWorkout }: QuickStartCarouselProps) {
    const router = useRouter();

    const { data: templates = [] } = useQuery({
        queryKey: ["templates"],
        queryFn: () => api.templates.list(),
    });

    async function handleStartBlank() {
        try {
            const workout = await api.workouts.create({});
            router.push(`/workouts/${workout.id}`);
        } catch { /* noop */ }
    }

    async function handleStartFromTemplate(templateId: number) {
        try {
            const result = await api.templates.instantiate(templateId);
            router.push(`/workouts/${result.workout_id}`);
        } catch { /* noop */ }
    }

    return (
        <div className="overflow-x-auto snap-x scrollbar-hide -mx-4 px-4">
            <div className="flex gap-3" style={{ width: "max-content" }}>
                {/* Card 1: New / Resume */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    onClick={() => {
                        if (activeWorkout) {
                            router.push(`/workouts/${activeWorkout.id}`);
                        } else {
                            handleStartBlank();
                        }
                    }}
                    className={`snap-start flex flex-col items-center justify-center gap-2 w-[160px] h-[120px] rounded-2xl transition-all shrink-0 ${activeWorkout
                            ? "bg-primary text-primary-foreground animate-pulse-glow"
                            : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                        }`}
                >
                    {activeWorkout ? (
                        <>
                            <Timer className="size-7" />
                            <span className="text-sm font-semibold">Resume</span>
                            <span className="text-[10px] opacity-80">
                                {new Date(activeWorkout.started_at).toLocaleTimeString(undefined, {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </>
                    ) : (
                        <>
                            <Plus className="size-7" strokeWidth={2.5} />
                            <span className="text-sm font-semibold">New Session</span>
                        </>
                    )}
                </motion.button>

                {/* Template Cards */}
                {templates.map((t, i) => (
                    <motion.button
                        key={t.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (i + 1) * 0.06, type: "spring", stiffness: 300, damping: 30 }}
                        onClick={() => {
                            if (!activeWorkout) handleStartFromTemplate(t.id);
                        }}
                        disabled={!!activeWorkout}
                        className={`snap-start flex flex-col items-start justify-between p-4 w-[160px] h-[120px] rounded-2xl glass shrink-0 text-left transition-all ${activeWorkout ? "opacity-40" : "hover:bg-card/70 active:scale-[0.97]"
                            }`}
                    >
                        <div className="flex size-8 items-center justify-center rounded-xl bg-primary/15">
                            <Play className="size-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold leading-tight line-clamp-1">{t.name}</p>
                            {t.exercises && t.exercises.length > 0 && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {t.exercises.length} exercise{t.exercises.length !== 1 ? "s" : ""}
                                </p>
                            )}
                        </div>
                    </motion.button>
                ))}

                {/* Spacer for scroll padding */}
                <div className="w-4 shrink-0" />
            </div>
        </div>
    );
}
