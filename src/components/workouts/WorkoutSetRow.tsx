"use client";

import { useState, useRef, useEffect } from "react";
import { Check, MoreHorizontal, Trophy, X, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type WorkoutSet } from "@/lib/api";

interface WorkoutSetRowProps {
    set: WorkoutSet;
    index: number;
    isLast: boolean;
    onUpdate: (id: string, weight: number | null, reps: number | null) => void;
    onDelete: (id: string) => void;
}

export function WorkoutSetRow({ set, index, isLast, onUpdate, onDelete }: WorkoutSetRowProps) {
    // ── State ──
    const [isEditing, setIsEditing] = useState(false);
    const [weight, setWeight] = useState(set.weight?.toString() ?? "");
    const [reps, setReps] = useState(set.reps?.toString() ?? "");

    // ── Refs ──
    const weightInputRef = useRef<HTMLInputElement>(null);

    // ── Effects ──
    // If set ID starts with "temp-", we are likely just created.
    // We shouldn't be editable until the ID confirms to positive.
    const isOptimistic = set.id.startsWith("temp-");

    // Reset local state when prop updates (only if not currently editing to avoid fighting user)
    useEffect(() => {
        if (!isEditing) {
            setWeight(set.weight?.toString() ?? "");
            setReps(set.reps?.toString() ?? "");
        }
    }, [set.weight, set.reps, isEditing]);

    // Auto-enter edit mode if this is a newly created set (but confirmed)
    // We can track this if needed, but for now user must click to edit.

    // ── Handlers ──
    function handleSave() {
        const w = parseFloat(weight);
        const r = parseInt(reps, 10);
        onUpdate(set.id, isNaN(w) ? null : w, isNaN(r) ? null : r);
        setIsEditing(false);
    }

    function handleCancel() {
        setWeight(set.weight?.toString() ?? "");
        setReps(set.reps?.toString() ?? "");
        setIsEditing(false);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            handleCancel();
        }
    }

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
        return (
            <div className={cn(
                "grid grid-cols-[32px_1fr_1fr_64px] gap-3 items-center py-2 px-2 rounded-lg bg-accent/20 border border-primary/10 transition-all",
                isLast ? "mb-0" : "mb-1"
            )}>
                <span className="text-xs font-mono text-muted-foreground text-center">{index + 1}</span>
                <Input
                    ref={weightInputRef}
                    type="number"
                    step="0.5"
                    className="h-8 text-center font-mono tabular-nums bg-background"
                    placeholder="kg"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
                <Input
                    type="number"
                    className="h-8 text-center font-mono tabular-nums bg-background"
                    placeholder="reps"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="flex items-center justify-end gap-1">
                    <Button size="icon" variant="ghost" className="size-7 hover:text-primary hover:bg-primary/10" onClick={handleSave}>
                        <Check className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-7 hover:text-destructive hover:bg-destructive/10" onClick={handleCancel}>
                        <X className="size-4" />
                    </Button>
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

            <div className="flex items-center gap-2">
                <span className={cn(
                    "font-mono font-medium text-base tabular-nums",
                    set.weight === null && "text-muted-foreground/40 italic text-sm"
                )}>
                    {set.weight ?? "—"}
                </span>
            </div>

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
