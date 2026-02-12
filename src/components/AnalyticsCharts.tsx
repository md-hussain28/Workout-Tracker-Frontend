"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
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
import { TrendingUp, PieChart as PieIcon, BarChart as BarIcon, Activity } from "lucide-react";

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

    // Extract all muscle keys (exclude 'date')
    const keys = Array.from(new Set(data.flatMap(Object.keys).filter((k) => k !== "date")));

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="size-5 text-primary" />
                    Volume Growth
                </CardTitle>
                <CardDescription>Total volume (Weight × Reps) per muscle group over time.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            labelFormatter={(v) => new Date(v).toLocaleDateString()}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        {keys.map((key, index) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={COLORS[index % COLORS.length]}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
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
