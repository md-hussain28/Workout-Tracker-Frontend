"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import type { MuscleGroup } from "@/lib/api";

interface MuscleGroupPickerProps {
    muscleGroups: MuscleGroup[];
    value: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function MuscleGroupPicker({
    muscleGroups,
    value,
    onValueChange,
    placeholder = "Select muscle group",
    className,
    disabled = false,
}: MuscleGroupPickerProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    const filtered = React.useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return muscleGroups;
        return muscleGroups.filter((mg) => mg.name.toLowerCase().includes(q));
    }, [muscleGroups, search]);

    const selectedMuscle = muscleGroups.find((mg) => String(mg.id) === value);

    return (
        <>
            <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn("w-full justify-between rounded-xl px-3 font-normal", className)}
                disabled={disabled}
                onClick={() => setOpen(true)}
            >
                {selectedMuscle ? (
                    <div className="flex items-center gap-2">
                        {selectedMuscle.color && (
                            <div
                                className="size-2 rounded-full"
                                style={{ backgroundColor: selectedMuscle.color }}
                            />
                        )}
                        <span>{selectedMuscle.name}</span>
                    </div>
                ) : (
                    <span className="text-muted-foreground">{placeholder}</span>
                )}
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
            <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(""); }}>
                <SheetContent
                    side="bottom"
                    className="rounded-t-3xl border-t pt-6 pb-[max(env(safe-area-inset-bottom),24px)] max-h-[85dvh] flex flex-col overflow-hidden"
                >
                    <SheetHeader>
                        <SheetTitle className="text-base">Select Muscle Group</SheetTitle>
                    </SheetHeader>
                    <div className="px-4 pb-2 pt-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search muscles..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 rounded-xl bg-muted/50 border-muted"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
                        {value && value !== "none" && (
                            <button
                                onClick={() => {
                                    onValueChange("none");
                                    setOpen(false);
                                    setSearch("");
                                }}
                                className="w-full flex items-center px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted/50 active:bg-muted rounded-xl mb-1 transition-colors"
                            >
                                Clear selection
                            </button>
                        )}
                        {filtered.length === 0 && (
                            <p className="text-center text-sm text-muted-foreground py-8">
                                No muscle groups found.
                            </p>
                        )}
                        <div className="space-y-1">
                            {filtered.map((mg) => (
                                <button
                                    key={mg.id}
                                    onClick={() => {
                                        onValueChange(String(mg.id));
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-3 text-sm rounded-xl hover:bg-muted/50 active:bg-muted transition-colors",
                                        String(mg.id) === value && "bg-muted font-medium"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        {mg.color ? (
                                            <div
                                                className="size-3 rounded-full"
                                                style={{ backgroundColor: mg.color }}
                                            />
                                        ) : (
                                            <div className="size-3 rounded-full bg-muted-foreground/20" />
                                        )}
                                        {mg.name}
                                    </div>
                                    {String(mg.id) === value && (
                                        <Check className="size-4 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
