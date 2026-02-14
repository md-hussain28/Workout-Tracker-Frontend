"use client";

import { useState } from "react";
import { Plus, Trash2, History, TrendingUp, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { WorkoutSetRow } from "./WorkoutSetRow";
import { useAddSet, useUpdateSet, useDeleteSet, useDeleteExerciseSets } from "@/lib/hooks/use-workout";
import { type WorkoutSet, type Exercise } from "@/lib/api";

interface WorkoutExerciseCardProps {
    workoutId: string;
    exercise: Exercise;
    sets: WorkoutSet[];
    onOpenHistory: () => void;
}

export function WorkoutExerciseCard({ workoutId, exercise, sets, onOpenHistory }: WorkoutExerciseCardProps) {
    // ── Hooks ──
    const addSetMutation = useAddSet(workoutId);
    const updateSetMutation = useUpdateSet(workoutId);
    const deleteSetMutation = useDeleteSet(workoutId);
    const deleteExerciseSetsMutation = useDeleteExerciseSets(workoutId);

    // ── Handlers ──
    const handleAddSet = () => {
        const nextOrder = sets.length;
        addSetMutation.mutate({
            exercise_id: exercise.id,
            set_order: nextOrder,
            weight: null, // Explicitly null to avoid backend defaulting to 0
            reps: null,
        });
    };

    const handleUpdateSet = (setId: string, weight: number | null, reps: number | null) => {
        updateSetMutation.mutate({
            setId,
            body: { weight, reps },
        });
    };

    const handleDeleteSet = (setId: string) => {
        deleteSetMutation.mutate(setId);
    };

    const handleDeleteExercise = () => {
        // In a real app we might want a nicer confirmation dialog
        if (confirm("Remove this exercise and all sets?")) {
            const ids = sets.map(s => s.id).filter(id => !id.startsWith("temp-"));
            deleteExerciseSetsMutation.mutate(ids);
        }
    };

    // ── Computed ──
    const sortedSets = [...sets].sort((a, b) => a.set_order - b.set_order || a.id.localeCompare(b.id));
    const bestSet = sets.find(s => s.is_pr);

    return (
        <Card className="overflow-hidden border-border/60 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold leading-none">
                        {exercise.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {exercise.primary_muscle_group?.name || "Exercise"}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground/50 hover:text-primary"
                        onClick={onOpenHistory}
                    >
                        <History className="size-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50 hover:text-destructive">
                                <MoreVertical className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive" onClick={handleDeleteExercise}>
                                <Trash2 className="mr-2 size-4" />
                                Remove Exercise
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {/* Column Headers */}
                <div className="grid grid-cols-[32px_1fr_1fr_40px] gap-3 px-4 py-2 bg-muted/30 border-y border-border/50 text-[10px] font-semibold text-muted-foreground tracking-wider mb-2">
                    <div className="text-center">SET</div>
                    <div>{exercise.unit?.toUpperCase() || "KG"}</div>
                    <div>REPS</div>
                    <div></div>
                </div>

                {/* Sets List */}
                <div className="px-2 pb-2 space-y-1">
                    {sortedSets.map((set, i) => (
                        <WorkoutSetRow
                            key={set.id}
                            set={set}
                            index={i}
                            isLast={i === sortedSets.length - 1}
                            onUpdate={handleUpdateSet}
                            onDelete={handleDeleteSet}
                        />
                    ))}

                    {/* Add Set Button */}
                    <div className="mt-2 px-2">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-primary/5 h-9 rounded-lg border border-dashed border-border/50 hover:border-primary/30"
                            onClick={handleAddSet}
                            disabled={addSetMutation.isPending}
                        >
                            <Plus className="mr-2 size-4" />
                            Add Set
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
