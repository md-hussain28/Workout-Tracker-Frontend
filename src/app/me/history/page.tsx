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
import { addDays, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BODY_GROUPS = [
    {
        key: "torso",
        label: "Torso",
        parts: ["chest", "waist", "hips", "neck", "shoulder"],
        color: "oklch(0.6 0.15 20)", // Red-ish
    },
    {
        key: "arms",
        label: "Arms",
        parts: ["bicep_l", "bicep_r", "forearm_l", "forearm_r", "wrist"],
        color: "oklch(0.6 0.15 240)", // Blue-ish
    },
    {
        key: "legs",
        label: "Legs",
        parts: ["thigh_l", "thigh_r", "calf_l", "calf_r", "ankle"],
        color: "oklch(0.6 0.15 140)", // Green-ish
    },
];

export default function BodyHistoryPage() {
    // State
    const [viewMode, setViewMode] = useState<"single" | "group">("single");
    const [chartPart, setChartPart] = useState("weight");
    const [chartGroup, setChartGroup] = useState("torso");
    const [rangeType, setRangeType] = useState<"7d" | "30d" | "90d" | "custom">("30d");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
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
        mutationFn: (id: number) => api.body.deleteLog(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["body-history"] });
            queryClient.invalidateQueries({ queryKey: ["body-latest"] });
        },
    });

    // Handle Range Changes
    useEffect(() => {
        if (rangeType === "custom") return;
        const now = new Date();
        const days = rangeType === "7d" ? 7 : rangeType === "30d" ? 30 : 90;
        setDateRange({ from: subDays(now, days), to: now });
    }, [rangeType]);

    // Prepare Chart Data
    const chartData = useMemo(() => {
        if (!dateRange?.from) return [];

        // Filter history by date range
        const filteredHistory = history.filter((log) => {
            const date = new Date(log.created_at);
            return date >= dateRange.from! && (!dateRange.to || date <= addDays(dateRange.to, 1));
        });

        const data = filteredHistory.map((log) => {
            const entry: any = {
                date: new Date(log.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
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
        }).reverse(); // Oldest first

        return data;
    }, [history, dateRange]);


    // Prepare Chart Keys based on selection make sure to color them
    const chartKeys = useMemo(() => {
        if (viewMode === "single") {
            const part = BODY_PARTS.find(p => p.key === chartPart);
            return [{
                key: chartPart,
                label: part?.label || chartPart,
                color: "oklch(0.72 0.16 165)"
            }];
        } else {
            const group = BODY_GROUPS.find(g => g.key === chartGroup);
            if (!group) return [];
            return group.parts.map((partKey, index) => {
                const pLabel = BODY_PARTS.find(p => p.key === partKey)?.label || partKey;
                // Generate distinct colors for lines
                const hue = (index * 60) % 360;
                return {
                    key: partKey,
                    label: pLabel,
                    color: `hsl(${hue}, 70%, 50%)`
                };
            });
        }
    }, [viewMode, chartPart, chartGroup]);

    const unit = viewMode === "single"
        ? (chartPart === "weight" ? "kg" : chartPart === "body_fat" ? "%" : "cm")
        : "cm";

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

            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex bg-muted/50 p-1 rounded-lg w-fit">
                            <button
                                onClick={() => setViewMode("single")}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === "single" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Single Metric
                            </button>
                            <button
                                onClick={() => setViewMode("group")}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === "group" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Group View
                            </button>
                        </div>

                        {/* Range Selectors */}
                        <div className="flex items-center gap-2">
                            <Tabs value={rangeType} onValueChange={(v) => setRangeType(v as any)} className="w-[200px]">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="7d">7D</TabsTrigger>
                                    <TabsTrigger value="30d">30D</TabsTrigger>
                                    <TabsTrigger value="90d">90D</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            <Button
                                variant={rangeType === "custom" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setRangeType("custom")}
                            >
                                Custom
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
                        {/* Metric/Group Selector */}
                        <div className="w-[200px]">
                            {viewMode === "single" ? (
                                <Select value={chartPart} onValueChange={setChartPart}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BODY_PARTS.map((bp) => (
                                            <SelectItem key={bp.key} value={bp.key}>{bp.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Select value={chartGroup} onValueChange={setChartGroup}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BODY_GROUPS.map((g) => (
                                            <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Custom Date Picker (Visible only if Custom) */}
                        {rangeType === "custom" && (
                            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full mt-2">
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
