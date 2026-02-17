"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, PieChart as PieIcon, BarChart as BarIcon, Activity, Flame } from "lucide-react";

// --- Types ---
interface VolumeHistoryData {
    date: string;
    [key: string]: string | number;
}

interface MuscleSplitData {
    name: string;
    value: number;
}

interface DensityData {
    date: string;
    [key: string]: string | number;
}

interface RadarData {
    subject: string;
    A: number;
    B: number;
    fullMark: number;
}

export interface CaloriesHistoryEntry {
    date: string;
    calories: number;
}

export interface CaloriesSummaryData {
    total_calories: number;
    workout_count: number;
    daily_average: number;
}

// --- Colors ---
const COLORS = [
    "hsl(262, 80%, 55%)", // Primary Purple
    "hsl(180, 60%, 50%)", // Cyan
    "hsl(85, 60%, 55%)",  // Lime
    "hsl(25, 80%, 55%)",  // Orange
    "hsl(300, 55%, 50%)", // Pink
    "hsl(210, 80%, 55%)", // Blue
    "hsl(45, 90%, 50%)",  // Yellow
    "hsl(0, 70%, 55%)",   // Red
];

// --- Components ---

export function VolumeGrowthChart({ data }: { data: VolumeHistoryData[] }) {
    if (!data || data.length === 0) return <EmptyState title="Volume Growth" icon={TrendingUp} />;

    // Extract all muscle keys (exclude 'date') and sort for stable colors
    const keys = Array.from(new Set(data.flatMap((d) => Object.keys(d).filter((k) => k !== "date")))).sort();

    // Normalize: every row has every key (0 if missing) so lines connect
    const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
    const normalizedData = sortedData.map((row) => {
        const out: VolumeHistoryData = { date: row.date };
        keys.forEach((k) => { out[k] = Number(row[k]) || 0; });
        return out;
    });

    const gridStroke = "hsl(var(--border) / 0.5)";
    const tooltipBg = "hsl(var(--card))";
    const tooltipBorder = "hsl(var(--border))";

    return (
        <Card className="col-span-1 lg:col-span-2 rounded-2xl border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <TrendingUp className="size-5" />
                    </div>
                    Volume Growth
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                    Total volume (Weight × Reps) per muscle group over time.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="h-[320px] w-full rounded-xl bg-muted/10 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={normalizedData}
                            margin={{ top: 12, right: 12, left: -8, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                                width={40}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => (Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(1)}k` : String(v))}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: tooltipBg,
                                    border: `1px solid ${tooltipBorder}`,
                                    borderRadius: "1rem",
                                    fontSize: 13,
                                    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15)",
                                }}
                                labelFormatter={(v) => new Date(v).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                                formatter={(value) => [Number(value ?? 0).toLocaleString(), ""]}
                                cursor={{ stroke: gridStroke, strokeWidth: 1 }}
                            />
                            <Legend
                                wrapperStyle={{ paddingTop: 12 }}
                                iconType="circle"
                                iconSize={8}
                                formatter={(value) => <span className="text-sm font-medium">{value}</span>}
                            />
                            {keys.map((key, index) => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    name={key}
                                    stroke={COLORS[index % COLORS.length]}
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 2, stroke: "hsl(var(--background))" }}
                                    connectNulls
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

export function MuscleSplitChart({ data }: { data: MuscleSplitData[] }) {
    if (!data || data.length === 0) return <EmptyState title="Muscle Split" icon={PieIcon} />;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieIcon className="size-5 text-primary" />
                    Muscle Split
                </CardTitle>
                <CardDescription>Share of total sets by primary muscle.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend layout="vertical" align="right" verticalAlign="middle" />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

export function RepDensityChart({ data }: { data: DensityData[] }) {
    if (!data || data.length === 0) return <EmptyState title="Rep Density" icon={BarIcon} />;

    // Extract keys (exercises)
    const keys = Array.from(new Set(data.flatMap(Object.keys).filter((k) => k !== "date")));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarIcon className="size-5 text-primary" />
                    Workout Density
                </CardTitle>
                <CardDescription>Number of sets per exercise per workout.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} stackOffset="sign">
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                            contentStyle={{ borderRadius: '12px', border: 'none' }}
                            labelFormatter={(v) => new Date(v).toLocaleDateString()}
                        />
                        {keys.slice(0, 10).map((key, index) => ( // Limit to top 10 to avoid chaos
                            <Bar key={key} dataKey={key} stackId="a" fill={COLORS[index % COLORS.length]} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

export function CaloriesBurnedChart({ data, emptyMessage }: { data: CaloriesHistoryEntry[]; emptyMessage?: string }) {
    if (!data || data.length === 0) {
        return (
            <Card className="col-span-1 lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Flame className="size-5 text-primary" />
                        Calories Burned
                    </CardTitle>
                    <CardDescription>
                        {emptyMessage ?? "Estimated calories per workout day (MET-based). Log weight in Me to see estimates."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed rounded-xl">
                        <Flame className="size-10 mb-2 opacity-20" />
                        <p className="text-sm">{emptyMessage ?? "No calorie data in this range. Log weight in Me to see estimates."}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Flame className="size-5 text-primary" />
                    Calories Burned
                </CardTitle>
                <CardDescription>Estimated calories per day (MET-based formula).</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip
                            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                            labelFormatter={(v) => new Date(v).toLocaleDateString()}
                            formatter={(value) => [`${value ?? 0} kcal`, "Calories"]}
                        />
                        <Bar dataKey="calories" fill="hsl(25, 80%, 55%)" name="Calories" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

export function CaloriesSummaryCard({ data }: { data: CaloriesSummaryData | null | undefined }) {
    if (data == null) return null;
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Flame className="size-5 text-primary" />
                    Calories Summary
                </CardTitle>
                <CardDescription>Total estimated burn in selected range.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-semibold tabular-nums">{data.total_calories} kcal</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Workouts</span>
                        <span className="font-medium tabular-nums">{data.workout_count}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Daily avg</span>
                        <span className="font-medium tabular-nums">{data.daily_average} kcal</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function PlateauRadarChart({ data }: { data: RadarData[] }) {
    if (!data || data.length === 0) return <EmptyState title="Exercise Plateau" icon={Activity} />;

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="size-5 text-primary" />
                    Exercise Plateau
                </CardTitle>
                <CardDescription>Comparison: All-Time Best (Blue) vs Recent Average (Red).</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                        <Radar
                            name="All-Time Best"
                            dataKey="A"
                            stroke="hsl(210, 80%, 55%)"
                            fill="hsl(210, 80%, 55%)"
                            fillOpacity={0.3}
                        />
                        <Radar
                            name="Recent Avg"
                            dataKey="B"
                            stroke="hsl(0, 70%, 55%)"
                            fill="hsl(0, 70%, 55%)"
                            fillOpacity={0.3}
                        />
                        <Legend />
                        <Tooltip />
                    </RadarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

function EmptyState({ title, icon: Icon }: { title: string; icon: any }) {
    return (
        <Card className="col-span-1 h-full flex flex-col justify-center items-center p-8 text-center text-muted-foreground border-dashed">
            <Icon className="size-10 mb-2 opacity-20" />
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm">Not enough data to display this chart.</p>
        </Card>
    );
}
