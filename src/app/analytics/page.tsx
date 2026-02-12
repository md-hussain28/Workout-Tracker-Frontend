"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Flame,
    BarChart3,
    TrendingUp,
    Calendar,
    Dumbbell,
    Activity,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
} from "recharts";
import { api, type Exercise } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ── Constants ──
const TABS = [
    { id: "volume", label: "Volume", icon: BarChart3 },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "muscles", label: "Muscles", icon: Activity },
    { id: "calendar", label: "Calendar", icon: Calendar },
] as const;

type TabId = (typeof TABS)[number]["id"];

const RANGES = [
    { id: "7d", label: "7D", days: 7 },
    { id: "1m", label: "1M", days: 30 },
    { id: "3m", label: "3M", days: 90 },
    { id: "6m", label: "6M", days: 180 },
    { id: "1y", label: "1Y", days: 365 },
    { id: "all", label: "All", days: 0 },
] as const;

type RangeId = (typeof RANGES)[number]["id"];

const CHART_COLORS = [
    "hsl(262, 80%, 55%)",
    "hsl(180, 60%, 50%)",
    "hsl(85, 60%, 55%)",
    "hsl(25, 80%, 55%)",
    "hsl(340, 65%, 55%)",
    "hsl(200, 70%, 55%)",
    "hsl(45, 80%, 50%)",
    "hsl(300, 55%, 50%)",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.75rem",
    fontSize: 12,
};

function dateRange(rangeId: RangeId): { from_date?: string; to_date?: string } {
    if (rangeId === "all") return {};
    const r = RANGES.find((r) => r.id === rangeId)!;
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - r.days);
    return {
        from_date: from.toISOString().slice(0, 10),
        to_date: to.toISOString().slice(0, 10),
    };
}

// ── Range Selector ──
function RangeSelector({ value, onChange }: { value: RangeId; onChange: (v: RangeId) => void }) {
    return (
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-4">
            {RANGES.map((r) => (
                <button
                    key={r.id}
                    onClick={() => onChange(r.id)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${value === r.id
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    {r.label}
                </button>
            ))}
        </div>
    );
}

// ── Volume Tab ──
function VolumeTab({ range }: { range: RangeId }) {
    const { from_date, to_date } = dateRange(range);

    const { data: tonnage } = useQuery({
        queryKey: ["analytics", "tonnage", range],
        queryFn: () => api.analytics.tonnage(from_date, to_date),
    });

    const { data: streak } = useQuery({
        queryKey: ["streak"],
        queryFn: () => api.streak.get(),
    });

    const tonnageData = useMemo(() => {
        if (!tonnage?.workouts) return [];
        return tonnage.workouts.map((w) => ({
            date: w.started_at
                ? new Date(w.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                : "—",
            tonnage: Math.round(w.tonnage),
        }));
    }, [tonnage]);

    // Summary stats
    const totalTonnage = useMemo(() => tonnageData.reduce((sum, d) => sum + d.tonnage, 0), [tonnageData]);
    const avgTonnage = useMemo(
        () => (tonnageData.length > 0 ? Math.round(totalTonnage / tonnageData.length) : 0),
        [totalTonnage, tonnageData.length]
    );
    const maxTonnage = useMemo(
        () => (tonnageData.length > 0 ? Math.max(...tonnageData.map((d) => d.tonnage)) : 0),
        [tonnageData]
    );

    return (
        <div className="space-y-4">
            {/* Streak */}
            <Card className="overflow-hidden border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent">
                <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-orange-500/15">
                            <Flame className="size-5 text-orange-500" />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold tabular-nums">{streak?.current_streak ?? 0}</p>
                                <p className="text-muted-foreground text-xs">Current Streak</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-semibold tabular-nums">{streak?.longest_streak ?? 0}</p>
                                <p className="text-muted-foreground text-xs">Longest</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2">
                <Card>
                    <CardContent className="py-3 text-center">
                        <p className="text-lg font-bold tabular-nums">{tonnageData.length}</p>
                        <p className="text-muted-foreground text-[10px]">Workouts</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-3 text-center">
                        <p className="text-lg font-bold tabular-nums">{(totalTonnage / 1000).toFixed(1)}k</p>
                        <p className="text-muted-foreground text-[10px]">Total Vol (kg)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-3 text-center">
                        <p className="text-lg font-bold tabular-nums">{avgTonnage}</p>
                        <p className="text-muted-foreground text-[10px]">Avg/Session</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tonnage Over Time */}
            {tonnageData.length > 1 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <TrendingUp className="size-4 text-primary" />
                            Tonnage Over Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={tonnageData}>
                                <defs>
                                    <linearGradient id="tonnageGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(180, 60%, 50%)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(180, 60%, 50%)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} width={50} />
                                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v ?? 0} kg`, "Tonnage"]} />
                                <Area
                                    type="monotone"
                                    dataKey="tonnage"
                                    stroke="hsl(180, 60%, 50%)"
                                    strokeWidth={2}
                                    fill="url(#tonnageGrad)"
                                    dot={{ r: 2 }}
                                    activeDot={{ r: 5 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>Peak: {maxTonnage.toLocaleString()} kg</span>
                            <span>Avg: {avgTonnage.toLocaleString()} kg</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {tonnageData.length === 0 && (
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground text-sm">
                        No workout data in this period.
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ── Progress Tab (per-exercise 1RM progression) ──
function ProgressTab({ range }: { range: RangeId }) {
    const { from_date, to_date } = dateRange(range);
    const [selectedExId, setSelectedExId] = useState<number | null>(null);

    const { data: exercises = [] } = useQuery({
        queryKey: ["exercises"],
        queryFn: () => api.exercises.list(),
    });

    const weightExercises = useMemo(
        () => exercises.filter((e) => e.measurement_mode === "weight_reps"),
        [exercises]
    );

    // Auto-select first exercise
    const activeExId = selectedExId ?? weightExercises[0]?.id;

    const { data: oneRm } = useQuery({
        queryKey: ["analytics", "oneRm", activeExId, range],
        queryFn: () => api.analytics.oneRm(activeExId!, from_date, to_date),
        enabled: !!activeExId,
    });

    const chartData = useMemo(() => {
        if (!oneRm?.points) return [];
        // Group by date, take best per day
        const byDate = new Map<string, number>();
        for (const p of oneRm.points) {
            const d = p.date ? new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—";
            byDate.set(d, Math.max(byDate.get(d) ?? 0, p.estimated_1rm));
        }
        return Array.from(byDate.entries()).map(([date, value]) => ({ date, estimated_1rm: Math.round(value * 10) / 10 }));
    }, [oneRm]);

    const bestEst = useMemo(() => {
        if (chartData.length === 0) return null;
        return Math.max(...chartData.map((d) => d.estimated_1rm));
    }, [chartData]);

    const improvement = useMemo(() => {
        if (chartData.length < 2) return null;
        const first = chartData[0].estimated_1rm;
        const last = chartData[chartData.length - 1].estimated_1rm;
        if (first === 0) return null;
        return Math.round(((last - first) / first) * 100);
    }, [chartData]);

    return (
        <div className="space-y-4">
            {/* Exercise Selector */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                {weightExercises.map((ex) => (
                    <button
                        key={ex.id}
                        onClick={() => setSelectedExId(ex.id)}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeExId === ex.id
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            }`}
                    >
                        {ex.name}
                    </button>
                ))}
            </div>

            {/* Highlights */}
            {chartData.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                    <Card>
                        <CardContent className="py-3 text-center">
                            <p className="text-lg font-bold tabular-nums">{bestEst}</p>
                            <p className="text-muted-foreground text-[10px]">Best Est. 1RM</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-3 text-center">
                            <p className={`text-lg font-bold tabular-nums ${improvement != null && improvement > 0 ? "text-green-500" : improvement != null && improvement < 0 ? "text-red-500" : ""}`}>
                                {improvement != null ? `${improvement > 0 ? "+" : ""}${improvement}%` : "—"}
                            </p>
                            <p className="text-muted-foreground text-[10px]">Change</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Chart */}
            {chartData.length > 1 ? (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                            1RM Progression — {weightExercises.find((e) => e.id === activeExId)?.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="oneRmGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(262, 80%, 55%)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(262, 80%, 55%)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} width={45} />
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    formatter={(v) => [`${Number(v).toFixed(1)}`, "Est. 1RM"]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="estimated_1rm"
                                    stroke="hsl(262, 80%, 55%)"
                                    strokeWidth={2}
                                    fill="url(#oneRmGrad)"
                                    dot={{ fill: "hsl(262, 80%, 55%)", r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            ) : activeExId ? (
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground text-sm">
                        Not enough data for this exercise in this period.
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground text-sm">
                        No weight-based exercises found. Create one to track progression.
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ── Muscles Tab ──
function MusclesTab({ range }: { range: RangeId }) {
    const { from_date, to_date } = dateRange(range);

    const { data: muscleVolume } = useQuery({
        queryKey: ["analytics", "muscleVolume", range],
        queryFn: () => api.analytics.muscleVolume(from_date, to_date),
    });

    const volumeData = useMemo(() => {
        if (!muscleVolume?.muscle_groups) return [];
        return muscleVolume.muscle_groups
            .filter((mg) => mg.volume > 0)
            .sort((a, b) => b.volume - a.volume)
            .map((mg) => ({ name: mg.name, volume: Math.round(mg.volume) }));
    }, [muscleVolume]);

    const totalVolume = useMemo(() => volumeData.reduce((s, d) => s + d.volume, 0), [volumeData]);

    return (
        <div className="space-y-4">
            {volumeData.length > 0 ? (
                <>
                    {/* Pie Chart */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Muscle Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <ResponsiveContainer width={130} height={130}>
                                    <PieChart>
                                        <Pie
                                            data={volumeData}
                                            dataKey="volume"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={55}
                                            innerRadius={35}
                                        >
                                            {volumeData.map((_, idx) => (
                                                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={tooltipStyle} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    {volumeData.slice(0, 6).map((item, idx) => (
                                        <div key={item.name} className="flex items-center gap-2 text-xs">
                                            <span
                                                className="size-2.5 rounded-full shrink-0"
                                                style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }}
                                            />
                                            <span className="truncate text-muted-foreground">{item.name}</span>
                                            <span className="font-medium ml-auto tabular-nums">
                                                {totalVolume > 0 ? Math.round((item.volume / totalVolume) * 100) : 0}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bar Chart */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <BarChart3 className="size-4 text-primary" />
                                Volume by Muscle
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={Math.max(150, volumeData.length * 36)}>
                                <BarChart data={volumeData} layout="vertical" margin={{ left: 0 }}>
                                    <XAxis type="number" tick={{ fontSize: 10 }} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={85} />
                                    <Tooltip
                                        contentStyle={tooltipStyle}
                                        formatter={(v) => [`${v ?? 0}`, "Volume"]}
                                    />
                                    <Bar dataKey="volume" fill="hsl(262, 80%, 55%)" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground text-sm">
                        No muscle data in this period. Log workouts with exercises that have muscle groups assigned.
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ── Calendar Tab ──
function CalendarTab() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);

    const { data: consistency } = useQuery({
        queryKey: ["analytics", "consistency", year, month],
        queryFn: () => api.analytics.consistency(year, month),
    });

    const calendarDays = useMemo(() => {
        const dayMap = new Map<string, { duration: number | null; tonnage: number }>();
        consistency?.days?.forEach((d) => {
            dayMap.set(d.date, { duration: d.duration_seconds, tonnage: d.tonnage });
        });
        const daysInMonth = new Date(year, month, 0).getDate();
        const firstDow = new Date(year, month - 1, 1).getDay();
        const cells: { day: number; data: { duration: number | null; tonnage: number } | null; blank: boolean }[] = [];
        for (let i = 0; i < firstDow; i++) cells.push({ day: 0, data: null, blank: true });
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            cells.push({ day: d, data: dayMap.get(dateStr) ?? null, blank: false });
        }
        return cells;
    }, [consistency, year, month]);

    const workoutCount = useMemo(
        () => calendarDays.filter((c) => c.data != null).length,
        [calendarDays]
    );
    const totalDays = new Date(year, month, 0).getDate();

    function prevMonth() {
        if (month === 1) { setMonth(12); setYear(year - 1); }
        else setMonth(month - 1);
    }
    function nextMonth() {
        if (month === 12) { setMonth(1); setYear(year + 1); }
        else setMonth(month + 1);
    }

    return (
        <div className="space-y-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between">
                <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <ChevronLeft className="size-5" />
                </button>
                <p className="font-semibold">{MONTHS[month - 1]} {year}</p>
                <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <ChevronRight className="size-5" />
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
                <Card>
                    <CardContent className="py-3 text-center">
                        <p className="text-lg font-bold tabular-nums">{workoutCount}</p>
                        <p className="text-muted-foreground text-[10px]">Workouts</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-3 text-center">
                        <p className="text-lg font-bold tabular-nums">
                            {totalDays > 0 ? Math.round((workoutCount / totalDays) * 100) : 0}%
                        </p>
                        <p className="text-muted-foreground text-[10px]">Consistency</p>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar Grid */}
            <Card>
                <CardContent className="py-4">
                    <div className="grid grid-cols-7 gap-1.5">
                        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                            <span key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                                {d}
                            </span>
                        ))}
                        {calendarDays.map((cell, idx) => (
                            <div
                                key={idx}
                                className={`flex size-9 items-center justify-center rounded-lg text-xs font-medium transition-colors ${cell.blank
                                        ? ""
                                        : cell.data
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "bg-muted/40 text-muted-foreground"
                                    }`}
                                title={
                                    cell.data
                                        ? `${cell.data.duration != null ? Math.round(cell.data.duration / 60) + " min" : ""} · ${Math.round(cell.data.tonnage)} kg`
                                        : undefined
                                }
                            >
                                {cell.blank ? "" : cell.day}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// ── Main Page ──
export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState<TabId>("volume");
    const [range, setRange] = useState<RangeId>("1m");

    return (
        <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
            <h1 className="text-2xl font-semibold tracking-tight mb-4">Analytics</h1>

            {/* Tab Bar */}
            <div className="flex gap-1 p-1 bg-muted rounded-xl mb-4">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === tab.id
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Icon className="size-3.5" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Range Selector (not for Calendar tab) */}
            {activeTab !== "calendar" && <RangeSelector value={range} onChange={setRange} />}

            {/* Tab Content */}
            {activeTab === "volume" && <VolumeTab range={range} />}
            {activeTab === "progress" && <ProgressTab range={range} />}
            {activeTab === "muscles" && <MusclesTab range={range} />}
            {activeTab === "calendar" && <CalendarTab />}
        </div>
    );
}
