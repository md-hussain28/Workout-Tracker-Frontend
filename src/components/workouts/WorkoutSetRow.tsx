"use client";

import { useState, useEffect } from "react";
import { Check, MoreHorizontal, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type WorkoutSet, type Exercise } from "@/lib/api";
import { NumericKeypad } from "./NumericKeypad";

interface WorkoutSetRowProps {
    set: WorkoutSet;
    exercise?: Exercise | null;
    index: number;
    isLast: boolean;
    onUpdate: (
        id: string,
        weight: number | null,
        reps: number | null,
        duration_seconds?: number | null,
        time_under_tension_seconds?: number | null,
        rest_seconds_after?: number | null,
    ) => void;
    onDelete: (id: string) => void;
}

type ActiveField = "weight" | "reps" | "duration" | "tut" | "rest";

export function WorkoutSetRow({ set, exercise, index, isLast, onUpdate, onDelete }: WorkoutSetRowProps) {
    const isTimeMode = exercise?.measurement_mode === "time";

    // ── State ──
    const [isEditing, setIsEditing] = useState(false);
    const [weight, setWeight] = useState(set.weight?.toString() ?? "");
    const [reps, setReps] = useState(set.reps?.toString() ?? "");
    const [durationSec, setDurationSec] = useState(set.duration_seconds?.toString() ?? "");
    const [tut, setTut] = useState(set.time_under_tension_seconds?.toString() ?? "");
    const [restSec, setRestSec] = useState(set.rest_seconds_after?.toString() ?? "");
    const [activeField, setActiveField] = useState<ActiveField>(isTimeMode ? "duration" : "weight");

    // ── Effects ──
    const isOptimistic = set.id.startsWith("temp-");

    useEffect(() => {
        if (!isEditing) {
            setWeight(set.weight?.toString() ?? "");
            setReps(set.reps?.toString() ?? "");
            setDurationSec(set.duration_seconds?.toString() ?? "");
            setTut(set.time_under_tension_seconds?.toString() ?? "");
            setRestSec(set.rest_seconds_after?.toString() ?? "");
        }
    }, [set.weight, set.reps, set.duration_seconds, set.time_under_tension_seconds, set.rest_seconds_after, isEditing]);

    // ── Handlers ──
    function handleSave() {
        const w = parseFloat(weight);
        const r = parseInt(reps, 10);
        const d = durationSec.trim() ? parseInt(durationSec, 10) : null;
        const tutNum = tut.trim() ? parseInt(tut, 10) : null;
        const restNum = restSec.trim() ? parseInt(restSec, 10) : null;
        if (isTimeMode) {
            onUpdate(
                set.id,
                isNaN(w) ? null : w,
                null,
                d != null && !isNaN(d) ? d : undefined,
                tutNum != null && !isNaN(tutNum) ? tutNum : undefined,
                restNum != null && !isNaN(restNum) ? restNum : undefined,
            );
        } else {
            onUpdate(
                set.id,
                isNaN(w) ? null : w,
                isNaN(r) ? null : r,
                undefined,
                tutNum != null && !isNaN(tutNum) ? tutNum : undefined,
                restNum != null && !isNaN(restNum) ? restNum : undefined,
            );
        }
        setIsEditing(false);
    }

    function handleCancel() {
        setWeight(set.weight?.toString() ?? "");
        setReps(set.reps?.toString() ?? "");
        setDurationSec(set.duration_seconds?.toString() ?? "");
        setTut(set.time_under_tension_seconds?.toString() ?? "");
        setRestSec(set.rest_seconds_after?.toString() ?? "");
        setIsEditing(false);
    }

    const activeValue =
        activeField === "weight" ? weight
        : activeField === "reps" ? reps
        : activeField === "duration" ? durationSec
        : activeField === "tut" ? tut
        : restSec;
    const setActiveValue =
        activeField === "weight" ? setWeight
        : activeField === "reps" ? setReps
        : activeField === "duration" ? setDurationSec
        : activeField === "tut" ? setTut
        : setRestSec;

    // ── Render ──
    const setQuality = () => {
        // This could be passed down as a prop if we want comparison logic
        return null;
    };

    if (isOptimistic) {
        return (
            <div className="grid grid-cols-[32px_1fr_1fr_40px] gap-3 items-center py-3 px-2 opacity-50 pointer-events-none">
                <span className="text-xs font-mono text-muted-foreground text-center">...</span>
                <div className="h-4 bg-muted rounded animate-pulse w-12" />
                <div className="h-4 bg-muted rounded animate-pulse w-8" />
                <div className="size-4 rounded-full border-2 border-muted border-t-primary animate-spin ml-auto" />
            </div>
        );
    }

    if (isEditing) {
        const col1Label = isTimeMode ? "Duration (sec)" : "Weight";
        const col2Label = isTimeMode ? "Weight (optional)" : "Reps";
        const col1Value = isTimeMode ? (durationSec ? `${durationSec}s` : "sec") : (weight || "kg");
        const col2Value = isTimeMode ? (weight || "kg") : (reps || "reps");
        const col1Field: ActiveField = isTimeMode ? "duration" : "weight";
        const col2Field: ActiveField = isTimeMode ? "weight" : "reps";

        return (
            <div className={cn(isLast ? "mb-0" : "mb-1")}>
                <div className={cn(
                    "rounded-lg bg-accent/20 border border-primary/10 transition-all min-w-0 py-2 px-2 space-y-2"
                )}>
                    <div className="grid grid-cols-[32px_1fr_1fr_72px] gap-2 sm:gap-3 items-center min-w-0">
                        <span className="text-xs font-mono text-muted-foreground text-center shrink-0">{index + 1}</span>
                        <button
                            type="button"
                            onClick={() => setActiveField(col1Field)}
                            className={cn(
                                "h-9 rounded-lg text-center font-mono text-base tabular-nums bg-background border border-input px-2 min-w-0",
                                activeField === col1Field && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            )}
                        >
                            {col1Value}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveField(col2Field)}
                            className={cn(
                                "h-9 rounded-lg text-center font-mono text-base tabular-nums bg-background border border-input px-2 min-w-0",
                                activeField === col2Field && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            )}
                        >
                            {col2Value}
                        </button>
                        <div className="flex items-center justify-end gap-1 shrink-0 w-[72px]">
                            <Button size="icon" variant="ghost" className="size-8 hover:text-primary hover:bg-primary/10 flex-shrink-0" onClick={handleSave}>
                                <Check className="size-4 shrink-0" />
                            </Button>
                            <Button size="icon" variant="ghost" className="size-8 hover:text-destructive hover:bg-destructive/10 flex-shrink-0" onClick={handleCancel}>
                                <X className="size-4 shrink-0" />
                            </Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-[32px_1fr_1fr_72px] gap-2 sm:gap-3 items-center min-w-0">
                        <span className="text-[10px] font-medium text-muted-foreground text-center shrink-0">TUT</span>
                        <button
                            type="button"
                            onClick={() => setActiveField("tut")}
                            className={cn(
                                "h-8 rounded-lg text-center font-mono text-sm tabular-nums bg-background border border-input px-2 min-w-0",
                                activeField === "tut" && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            )}
                        >
                            {tut ? `${tut}s` : <span className="text-muted-foreground text-xs">sec</span>}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveField("rest")}
                            className={cn(
                                "h-8 rounded-lg text-center font-mono text-sm tabular-nums bg-background border border-input px-2 min-w-0",
                                activeField === "rest" && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            )}
                        >
                            {restSec ? `${restSec}s` : <span className="text-muted-foreground text-xs">sec</span>}
                        </button>
                        <div className="w-[72px]" />
                    </div>
                </div>
                <div className="mt-2 px-1">
                    <NumericKeypad
                        value={activeValue}
                        onChange={setActiveValue}
                        onDone={handleSave}
                        allowDecimal={activeField === "weight"}
                        showWeightSteppers={activeField === "weight"}
                    />
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={cn(
                "group grid grid-cols-[32px_1fr_1fr_40px] gap-3 items-center py-3 px-2 rounded-lg hover:bg-accent/40 cursor-pointer transition-colors active:scale-[0.99]",
                isLast ? "mb-0" : "mb-1"
            )}
        >
            <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors text-center">{index + 1}</span>

            {isTimeMode ? (
                <>
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "font-mono font-medium text-base tabular-nums",
                            set.duration_seconds == null && "text-muted-foreground/40 italic text-sm"
                        )}>
                            {set.duration_seconds != null ? `${set.duration_seconds}s` : "—"}
                        </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "font-mono font-medium text-base tabular-nums",
                                set.weight == null && "text-muted-foreground/40 italic text-sm"
                            )}>
                                {set.weight != null ? `${set.weight} kg` : "—"}
                            </span>
                            {set.is_pr && (
                                <Badge variant="secondary" className="px-1 py-0 h-4 text-[9px] bg-amber-500/10 text-amber-600 border-amber-200">
                                    PR
                                </Badge>
                            )}
                        </div>
                        {(set.time_under_tension_seconds != null || set.rest_seconds_after != null) && (
                            <div className="text-[10px] text-muted-foreground font-mono">
                                {set.time_under_tension_seconds != null && <span>TUT {set.time_under_tension_seconds}s</span>}
                                {set.time_under_tension_seconds != null && set.rest_seconds_after != null && " · "}
                                {set.rest_seconds_after != null && <span>Rest {set.rest_seconds_after}s</span>}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "font-mono font-medium text-base tabular-nums",
                            set.weight === null && "text-muted-foreground/40 italic text-sm"
                        )}>
                            {set.weight ?? "—"}
                        </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "font-mono font-medium text-base tabular-nums",
                                set.reps === null && "text-muted-foreground/40 italic text-sm"
                            )}>
                                {set.reps ?? "—"}
                            </span>
                            {set.is_pr && (
                                <Badge variant="secondary" className="px-1 py-0 h-4 text-[9px] bg-amber-500/10 text-amber-600 border-amber-200">
                                    PR
                                </Badge>
                            )}
                        </div>
                        {(set.time_under_tension_seconds != null || set.rest_seconds_after != null) && (
                            <div className="text-[10px] text-muted-foreground font-mono">
                                {set.time_under_tension_seconds != null && <span>TUT {set.time_under_tension_seconds}s</span>}
                                {set.time_under_tension_seconds != null && set.rest_seconds_after != null && " · "}
                                {set.rest_seconds_after != null && <span>Rest {set.rest_seconds_after}s</span>}
                            </div>
                        )}
                    </div>
                </>
            )}

            <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="size-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                            Edit Set
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => onDelete(set.id)}>
                            <Trash2 className="mr-2 size-3.5" />
                            Delete Set
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
