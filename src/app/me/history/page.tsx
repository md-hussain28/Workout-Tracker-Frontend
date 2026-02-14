"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    Trash2,
    Pencil,
    Calendar,
    Scale,
    ChevronDown,
    ChevronUp,
    Ruler,
    X,
    Check,
} from "lucide-react";
import {
    api,
    type BodyLog,
    type BodyLogUpdate,
    type Measurements,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Lazy-load chart
import BodyPartChart from "../../../components/me/BodyPartChart";

// All trackable body parts for the chart selector
const BODY_PARTS: { key: string; label: string }[] = [
    { key: "weight", label: "Weight (kg)" },
    { key: "body_fat", label: "Body Fat (%)" },
    { key: "chest", label: "Chest" },
    { key: "waist", label: "Waist" },
    { key: "hips", label: "Hips" },
    { key: "neck", label: "Neck" },
    { key: "shoulder", label: "Shoulder" },
    { key: "bicep_l", label: "Bicep (L)" },
    { key: "bicep_r", label: "Bicep (R)" },
    { key: "forearm_l", label: "Forearm (L)" },
    { key: "forearm_r", label: "Forearm (R)" },
    { key: "thigh_l", label: "Thigh (L)" },
    { key: "thigh_r", label: "Thigh (R)" },
    { key: "calf_l", label: "Calf (L)" },
    { key: "calf_r", label: "Calf (R)" },
    { key: "wrist", label: "Wrist" },
    { key: "ankle", label: "Ankle" },
];

const MEASUREMENT_KEYS = BODY_PARTS.filter((b) => !["weight", "body_fat"].includes(b.key));

// ── Edit Dialog ─────────────────────────────────────────────────────
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

function EditLogDialog({
    log,
    open,
    onOpenChange,
}: {
    log: BodyLog | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (!log) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Log</DialogTitle>
                    <DialogDescription>
                        Update measurements for {new Date(log.created_at).toLocaleDateString()}.
                    </DialogDescription>
                </DialogHeader>
                <EditableLogForm log={log} onSuccess={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}

function EditableLogForm({ log, onSuccess }: { log: BodyLog; onSuccess: () => void }) {
    const queryClient = useQueryClient();
    const [weight, setWeight] = useState(log.weight_kg.toString());
    const [bodyFat, setBodyFat] = useState(log.body_fat_pct?.toString() ?? "");
    const [entryDate, setEntryDate] = useState(() => {
        const d = new Date(log.created_at);
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - offset * 60000);
        return local.toISOString().slice(0, 16);
    });
    const [measurements, setMeasurements] = useState<Record<string, string>>(() => {
        const m: Record<string, string> = {};
        if (log.measurements) {
            Object.entries(log.measurements).forEach(([k, v]) => {
                if (v != null) m[k] = v.toString();
            });
        }
        return m;
    });

    const mutation = useMutation({
        mutationFn: (data: BodyLogUpdate) => api.body.updateLog(log.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["body-history"] });
            queryClient.invalidateQueries({ queryKey: ["body-latest"] });
            onSuccess();
        },
    });

    const handleSave = () => {
        const w = parseFloat(weight);
        if (isNaN(w)) {
            alert("Valid weight is required");
            return;
        }

        const meas: Measurements = {};
        Object.entries(measurements).forEach(([k, v]) => {
            const val = parseFloat(v);
            if (!isNaN(val)) meas[k as keyof Measurements] = val;
        });

        // Convert local datetime back to UTC ISO string
        const dateObj = new Date(entryDate);
        const utcDate = dateObj.toISOString();

        const bf = parseFloat(bodyFat);

        mutation.mutate({
            weight_kg: w,
            body_fat_pct: isNaN(bf) ? null : bf,
            measurements: meas,
            created_at: utcDate,
        });
    };

    return (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-date" className="text-right">
                    Date
                </Label>
                <Input
                    id="edit-date"
                    type="datetime-local"
                    className="col-span-3"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-weight" className="text-right">
                    Weight
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                    <Input
                        id="edit-weight"
                        type="number"
                        step="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">kg</span>
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-bodyfat" className="text-right">
                    Body Fat
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                    <Input
                        id="edit-bodyfat"
                        type="number"
                        step="0.1"
                        value={bodyFat}
                        onChange={(e) => setBodyFat(e.target.value)}
                        placeholder="Optional"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Measurements</Label>
                <div className="grid grid-cols-2 gap-2">
                    {MEASUREMENT_KEYS.map((bp) => (
                        <div key={bp.key} className="space-y-1">
                            <Label htmlFor={`edit-${bp.key}`} className="text-xs text-muted-foreground">
                                {bp.label}
                            </Label>
                            <Input
                                id={`edit-${bp.key}`}
                                type="number"
                                step="0.1"
                                className="h-8"
                                placeholder="-"
                                value={measurements[bp.key] || ""}
                                onChange={(e) =>
                                    setMeasurements((prev) => ({
                                        ...prev,
                                        [bp.key]: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
                <Button onClick={handleSave} disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </div>
    );
}

// ── Log Entry Card ──────────────────────────────────────────────────
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

function LogEntryCard({
    log,
    onEdit,
    onDelete,
}: {
    log: BodyLog;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const hasMeasurements = log.measurements && Object.keys(log.measurements).length > 0;

    return (
        <Card className="overflow-hidden">
            <div className="flex flex-col">
                {/* Header Section */}
                <div className="flex items-center justify-between p-4 pb-2">
                    <div className="flex flex-col">
                        <span className="font-semibold text-lg">
                            {new Date(log.created_at).toLocaleDateString(undefined, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                            })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-baseline gap-1 bg-secondary/30 px-3 py-1 rounded-md">
                            <span className="text-xl font-bold">{log.weight_kg}</span>
                            <span className="text-xs text-muted-foreground font-medium">kg</span>
                        </div>

                        {log.body_fat_pct != null && (
                            <div className="flex items-baseline gap-1 bg-secondary/30 px-3 py-1 rounded-md">
                                <span className="text-xl font-bold">{log.body_fat_pct}</span>
                                <span className="text-xs text-muted-foreground font-medium">%</span>
                            </div>
                        )}

                        <div className="flex gap-0">
                            <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <Pencil className="size-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onDelete}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Measurements Section */}
                {hasMeasurements && (
                    <div className="px-4 pb-1">
                        <Accordion type="single" collapsible className="w-full border-t">
                            <AccordionItem value="measurements" className="border-b-0">
                                <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:no-underline uppercase tracking-wider font-medium">
                                    {Object.keys(log.measurements || {}).length} Measurements
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="grid grid-cols-2 xs:grid-cols-3 gap-3 pb-4 pt-1">
                                        {Object.entries(log.measurements!).map(([key, val]) => {
                                            const label = BODY_PARTS.find((p) => p.key === key)?.label || key;
                                            return (
                                                <div key={key} className="flex flex-col bg-secondary/10 p-2 rounded-md border border-secondary/20">
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide truncate" title={label}>
                                                        {label}
                                                    </span>
                                                    <span className="font-semibold text-sm">{val} <span className="text-[10px] sm:text-xs text-muted-foreground font-normal">cm</span></span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                )}

                {!hasMeasurements && <div className="h-2" />}
            </div>
        </Card>
    );
}


// ── Main Page ───────────────────────────────────────────────────────
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays, subDays, subMonths, subYears, startOfWeek, subWeeks } from "date-fns";
import { DateRange } from "react-day-picker";
import {
    SelectGroup,
    SelectLabel,
    SelectSeparator
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const BODY_GROUPS = [
    {
        key: "torso",
        label: "Torso",
        parts: ["chest", "waist", "hips", "neck", "shoulder"],
        color: "oklch(0.6 0.15 20)",
    },
    {
        key: "arms",
        label: "Arms",
        parts: ["bicep_l", "bicep_r", "forearm_l", "forearm_r", "wrist"],
        color: "oklch(0.6 0.15 240)",
    },
    {
        key: "legs",
        label: "Legs",
        parts: ["thigh_l", "thigh_r", "calf_l", "calf_r", "ankle"],
        color: "oklch(0.6 0.15 140)",
    },
];

type RangeOption = "1w" | "1m" | "3m" | "6m" | "1y" | "2y" | "all" | "custom";
type ChartMode = "part" | "group";

export default function BodyHistoryPage() {
    // State
    const [mode, setMode] = useState<ChartMode>("part");
    const [selectedPart, setSelectedPart] = useState("weight");
    const [selectedGroup, setSelectedGroup] = useState("torso");

    const [rangeType, setRangeType] = useState<RangeOption>("1m");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subMonths(new Date(), 1),
        to: new Date(),
    });
    const [editingLog, setEditingLog] = useState<BodyLog | null>(null);

    // Queries
    const { data: history = [], isLoading } = useQuery({
        queryKey: ["body-history"],
        queryFn: () => api.body.listLogs(),
    });

    const queryClient = useQueryClient();
    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.body.deleteLog(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["body-history"] });
            queryClient.invalidateQueries({ queryKey: ["body-latest"] });
        },
    });

    // Handle Range Changes
    useEffect(() => {
        if (rangeType === "custom") return;

        const now = new Date();
        let from: Date | undefined;

        switch (rangeType) {
            case "1w": from = subWeeks(now, 1); break;
            case "1m": from = subMonths(now, 1); break;
            case "3m": from = subMonths(now, 3); break;
            case "6m": from = subMonths(now, 6); break;
            case "1y": from = subYears(now, 1); break;
            case "2y": from = subYears(now, 2); break;
            case "all": from = undefined; break;
            default: from = subMonths(now, 1); break;
        }

        setDateRange({ from, to: now });
    }, [rangeType]);

    // Prepare Chart Data
    const chartData = useMemo(() => {
        let filteredHistory = history;

        // Filter by date range if not "all"
        if (rangeType !== "all" && dateRange?.from) {
            filteredHistory = history.filter((log) => {
                const date = new Date(log.created_at);
                return date >= dateRange.from! && (!dateRange.to || date <= addDays(dateRange.to, 1));
            });
        }

        let data = filteredHistory.map((log) => {
            const entry: any = {
                dateObj: new Date(log.created_at),
                date: new Date(log.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: rangeType === "all" || rangeType === "1y" || rangeType === "2y" ? "2-digit" : undefined,
                }),
            };

            // Populate all values
            entry.weight = log.weight_kg;
            entry.body_fat = log.body_fat_pct;
            if (log.measurements) {
                Object.entries(log.measurements).forEach(([k, v]) => {
                    entry[k] = v;
                });
            }
            return entry;
        }).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime()); // Oldest first for chart

        // Downsampling for performance if too many points
        if (data.length > 300) {
            const factor = Math.ceil(data.length / 300);
            data = data.filter((_, i) => i % factor === 0);
        }

        return data;
    }, [history, dateRange, rangeType]);


    // Prepare Chart Keys
    const chartKeys = useMemo(() => {
        if (mode === "part") {
            const part = BODY_PARTS.find(p => p.key === selectedPart);
            return [{
                key: selectedPart,
                label: part?.label || selectedPart,
                color: "oklch(0.72 0.16 165)"
            }];
        } else {
            const group = BODY_GROUPS.find(g => g.key === selectedGroup);
            if (!group) return [];
            return group.parts.map((partKey, index) => {
                const pLabel = BODY_PARTS.find(p => p.key === partKey)?.label || partKey;
                const hue = (index * 60) % 360;
                return {
                    key: partKey,
                    label: pLabel,
                    color: `hsl(${hue}, 70%, 50%)`
                };
            });
        }
    }, [mode, selectedPart, selectedGroup]);

    const unit = mode === "part"
        ? (selectedPart === "weight" ? "kg" : selectedPart === "body_fat" ? "%" : "cm")
        : "cm";

    // Calculate Summary Stats
    const stats = useMemo(() => {
        if (chartData.length === 0) return null;
        if (mode === "group") return null;

        const key = chartKeys[0].key;
        const values = chartData.map(d => d[key]).filter(v => typeof v === 'number') as number[];

        if (values.length === 0) return null;

        const current = values[values.length - 1];
        const start = values[0];
        const min = Math.min(...values);
        const max = Math.max(...values);
        const change = current - start;

        return { current, min, max, change };
    }, [chartData, chartKeys, mode]);

    return (
        <div className="space-y-6 max-w-5xl mx-auto w-full pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/me">
                    <Button variant="ghost" size="icon" className="-ml-2">
                        <ArrowLeft className="size-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Body History</h1>
            </div>

            <Card className="border-none shadow-sm bg-background/60 backdrop-blur-sm">
                <CardHeader className="pb-2 space-y-4">
                    {/* Controls Row */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                        {/* Left Group: Mode Toggle + Content Select */}
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full lg:w-auto">

                            {/* Modern Segmented Control for Mode */}
                            <div className="flex p-1 bg-muted rounded-lg shrink-0">
                                <button
                                    onClick={() => setMode("part")}
                                    className={cn(
                                        "px-4 py-1.5 text-xs font-medium rounded-md transition-all",
                                        mode === "part"
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Individual
                                </button>
                                <button
                                    onClick={() => setMode("group")}
                                    className={cn(
                                        "px-4 py-1.5 text-xs font-medium rounded-md transition-all",
                                        mode === "group"
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Compare Groups
                                </button>
                            </div>

                            {/* Contextual Dropdown */}
                            <div className="w-full sm:w-[220px]">
                                {mode === "part" ? (
                                    <Select value={selectedPart} onValueChange={setSelectedPart}>
                                        <SelectTrigger className="h-9 w-full">
                                            <SelectValue placeholder="Select Part" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[400px] w-[300px]">
                                            <SelectGroup>
                                                <SelectLabel>Core Metrics</SelectLabel>
                                                <div className="grid grid-cols-2 gap-1 px-1">
                                                    <SelectItem value="weight">Weight</SelectItem>
                                                    <SelectItem value="body_fat">Body Fat</SelectItem>
                                                </div>
                                            </SelectGroup>
                                            <SelectSeparator />
                                            <SelectGroup>
                                                <SelectLabel>Measurements</SelectLabel>
                                                <div className="grid grid-cols-2 gap-1 px-1">
                                                    {BODY_PARTS.filter(p => !["weight", "body_fat"].includes(p.key)).map((bp) => (
                                                        <SelectItem key={bp.key} value={bp.key} className="text-xs">
                                                            {bp.label}
                                                        </SelectItem>
                                                    ))}
                                                </div>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                                        <SelectTrigger className="h-9 w-full">
                                            <SelectValue placeholder="Select Group" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Body Region</SelectLabel>
                                                {BODY_GROUPS.map((g) => (
                                                    <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>

                        {/* Right Group: Date Range */}
                        <div className="flex items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
                            <Select value={rangeType} onValueChange={(v) => setRangeType(v as RangeOption)}>
                                <SelectTrigger className="h-9 w-[130px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="1w">1 Week</SelectItem>
                                    <SelectItem value="1m">1 Month</SelectItem>
                                    <SelectItem value="3m">3 Months</SelectItem>
                                    <SelectItem value="6m">6 Months</SelectItem>
                                    <SelectItem value="1y">1 Year</SelectItem>
                                    <SelectItem value="2y">2 Years</SelectItem>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>

                            {rangeType === "custom" && (
                                <DatePickerWithRange date={dateRange} setDate={setDateRange} className="flex-1 sm:flex-none" />
                            )}
                        </div>
                    </div>

                    {/* Summary Stats Row */}
                    {!isLoading && stats && (
                        <div className="grid grid-cols-4 gap-4 py-4 mt-2 border-t border-b bg-secondary/5 rounded-lg px-2">
                            <div className="flex flex-col items-center sm:items-start">
                                <span className="text-[10px] uppercase text-muted-foreground tracking-wider font-semibold">Current</span>
                                <span className="text-xl font-bold tabular-nums">{stats.current} <span className="text-xs font-normal text-muted-foreground">{unit}</span></span>
                            </div>
                            <div className="flex flex-col items-center sm:items-start">
                                <span className="text-[10px] uppercase text-muted-foreground tracking-wider font-semibold">Change</span>
                                <span className={`text-xl font-bold tabular-nums ${stats.change > 0 ? 'text-green-500' : stats.change < 0 ? 'text-rose-500' : ''}`}>
                                    {stats.change > 0 && "+"}{stats.change.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
                                </span>
                            </div>
                            <div className="flex flex-col items-center sm:items-start">
                                <span className="text-[10px] uppercase text-muted-foreground tracking-wider font-semibold">Min</span>
                                <span className="text-lg font-medium tabular-nums text-muted-foreground">{stats.min}</span>
                            </div>
                            <div className="flex flex-col items-center sm:items-start">
                                <span className="text-[10px] uppercase text-muted-foreground tracking-wider font-semibold">Max</span>
                                <span className="text-lg font-medium tabular-nums text-muted-foreground">{stats.max}</span>
                            </div>
                        </div>
                    )}
                </CardHeader>

                <CardContent>
                    <div className="h-[320px] w-full mt-2">
                        <BodyPartChart
                            data={chartData}
                            keys={chartKeys}
                            unit={unit}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Existing Lists ... */}
            {/* Loading */}
            {isLoading && (
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 rounded-2xl" />
                    ))}
                </div>
            )}

            {/* Empty */}
            {!isLoading && history.length === 0 && (
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground text-sm">
                        <Scale className="size-10 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">No entries yet</p>
                        <p className="text-sm mt-1">
                            Go back to the Me tab to log your first entry.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Log entries */}
            {!isLoading && history.length > 0 && (
                <div className="space-y-4">
                    {history.map((log) => (
                        <LogEntryCard
                            key={log.id}
                            log={log}
                            onEdit={() => setEditingLog(log)}
                            onDelete={() => {
                                if (confirm("Are you sure you want to delete this log?")) {
                                    deleteMutation.mutate(log.id);
                                }
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <EditLogDialog
                log={editingLog}
                open={!!editingLog}
                onOpenChange={(open) => !open && setEditingLog(null)}
            />
        </div>
    );
}
