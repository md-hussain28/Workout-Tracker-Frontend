"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between rounded-xl px-3 font-normal", className)}
                    disabled={disabled}
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
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-4 py-3 border-b">
                    <DialogTitle className="text-base">Select Muscle Group</DialogTitle>
                </DialogHeader>
                <div className="p-2 border-b">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search muscles..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 rounded-xl border-none bg-muted/50 h-9"
                            autoFocus
                        />
                    </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2">
                    {value && value !== "none" && (
                        <button
                            onClick={() => {
                                onValueChange("none");
                                setOpen(false);
                            }}
                            className="w-full flex items-center px-2 py-2 text-sm text-muted-foreground hover:bg-muted/50 rounded-lg mb-1"
                        >
                            Clear selection
                        </button>
                    )}
                    {filtered.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-6">
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
                                    "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg hover:bg-muted/50 transition-colors",
                                    String(mg.id) === value && "bg-muted font-medium"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    {mg.color && (
                                        <div
                                            className="size-2.5 rounded-full"
                                            style={{ backgroundColor: mg.color }}
                                        />
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
            </DialogContent>
        </Dialog>
    );
}
