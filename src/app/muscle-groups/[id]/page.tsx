"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    Dumbbell,
    TrendingUp,
    Activity,
    Layers,
    Calendar,
    Pencil,
    Loader2,
} from "lucide-react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    PieChart,
    Pie,
} from "recharts";

import { api, type MuscleGroupStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Components ──
const MUSCLE_COLORS = [
    "#ef4444", // Red
    "#f97316", // Orange
    "#f59e0b", // Amber
    "#22c55e", // Green
    "#06b6d4", // Cyan
    "#3b82f6", // Blue
    "#6366f1", // Indigo
    "#a855f7", // Purple
    "#ec4899", // Pink
    "#64748b", // Slate
];

function EditMuscleGroupDialog({
    id,
    currentName,
    currentColor,
    trigger,
}: {
    id: string;
    currentName: string;
    currentColor?: string | null;
    trigger: React.ReactNode;
}) {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(currentName);
    const [color, setColor] = useState<string | null>(currentColor ?? null);

    const updateMutation = useMutation({
        mutationFn: (data: { name: string; color?: string | null }) =>
            api.muscleGroups.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["muscleGroupStats", id] });
            queryClient.invalidateQueries({ queryKey: ["muscleGroups"] });
            setOpen(false);
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Muscle Group</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (name.trim()) {
                            updateMutation.mutate({ name: name.trim(), color });
                        }
                    }}
                    className="space-y-4 py-2"
                >
                    <div className="space-y-2">
                        <Label htmlFor="mg-name">Name</Label>
                        <Input
                            id="mg-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="rounded-xl"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Color (optional)</Label>
                        <div className="flex flex-wrap gap-2">
                            {MUSCLE_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c === color ? null : c)}
                                    className={`size-8 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-foreground scale-110" : ""
                                        }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                    {updateMutation.isError && (
                        <p className="text-destructive text-sm">
                            {updateMutation.error instanceof Error
                                ? updateMutation.error.message
                                : "Failed to update"}
                        </p>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline" className="rounded-xl">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            className="rounded-xl"
                            disabled={!name.trim() || updateMutation.isPending}
                        >
                            {updateMutation.isPending && (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            )}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    subtext,
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    subtext?: string;
}) {
    return (
        <Card>
            <CardContent className="p-6 flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
                        {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899"]; // blue-500, violet-500, pink-500

export default function MuscleGroupDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const id = params.id;

    const { data: stats, isLoading } = useQuery({
        queryKey: ["muscleGroupStats", id],
        queryFn: () => api.muscleGroups.getStats(id),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
                <div className="h-8 w-48 bg-muted/50 rounded-lg animate-pulse" />
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
                    ))}
                </div>
                <div className="h-96 bg-muted/50 rounded-xl animate-pulse" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                <div className="bg-muted/30 p-6 rounded-full mb-4">
                    <Dumbbell className="size-10 text-muted-foreground" />
                </div>
                <h1 className="text-xl font-semibold">Muscle Group Not Found</h1>
                <p className="text-muted-foreground mt-2 mb-6">
                    The muscle group you&apos;re looking for doesn&apos;t exist or has been deleted.
                </p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const roleData = [
        { name: "Primary", value: stats.role_distribution.primary },
        { name: "Secondary", value: stats.role_distribution.secondary },
        { name: "Tertiary", value: stats.role_distribution.tertiary },
    ].filter((d) => d.value > 0);

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2">
                        <ArrowLeft className="size-5" />
                    </Button>
                    {stats.color && (
                        <div
                            className="size-8 rounded-full shadow-sm"
                            style={{ backgroundColor: stats.color }}
                        />
                    )}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{stats.name}</h1>
                        <p className="text-muted-foreground">Analytics & Progression</p>
                    </div>
                </div>
                <EditMuscleGroupDialog
                    id={stats.id}
                    currentName={stats.name}
                    currentColor={stats.color}
                    trigger={
                        <Button variant="outline" size="sm" className="rounded-xl">
                            <Pencil className="mr-2 size-3.5" />
                            Edit
                        </Button>
                    }
                />
            </div>

            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-3 mb-8">
                <StatCard
                    title="Total Workouts"
                    value={stats.total_workouts}
                    icon={Calendar}
                    subtext="sessions"
                />
                <StatCard
                    title="Total Sets"
                    value={stats.total_sets}
                    icon={Layers}
                    subtext="performed"
                />
                <StatCard
                    title="Total Volume"
                    value={(stats.total_volume / 1000).toFixed(1)}
                    icon={Activity}
                    subtext="k units"
                />
            </div>

            <div className="grid gap-8 md:grid-cols-2 mb-8">
                {/* Role Distribution */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg">Role Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[300px]">
                        {roleData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={roleData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {roleData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                    />
                                    <text
                                        x="50%"
                                        y="50%"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="fill-foreground font-bold text-xl"
                                    >
                                        {stats.total_sets}
                                    </text>
                                    <text
                                        x="50%"
                                        y="50%"
                                        dy={20}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="fill-muted-foreground text-xs"
                                    >
                                        Sets
                                    </text>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                No data available
                            </div>
                        )}
                        <div className="flex justify-center gap-4 mt-4">
                            {roleData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2 text-sm">
                                    <div className="size-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-muted-foreground">{entry.name}</span>
                                    <span className="font-medium">{entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Exercises */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg">Top Exercises</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {stats.top_exercises.length > 0 ? (
                            <ul className="space-y-4">
                                {stats.top_exercises.slice(0, 5).map((ex, i) => (
                                    <li key={ex.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{ex.name}</p>
                                                <p className="text-xs text-muted-foreground">{ex.set_count} sets</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-sm tabular-nums">
                                                {ex.volume > 1000 ? `${(ex.volume / 1000).toFixed(1)}k` : Math.round(ex.volume)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">vol</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                No data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Volume History */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Volume History</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    {stats.volume_history.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.volume_history}>
                                <defs>
                                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                />
                                <YAxis
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--popover))",
                                        borderRadius: "12px",
                                        border: "1px solid hsl(var(--border))",
                                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                    }}
                                    itemStyle={{ color: "hsl(var(--foreground))" }}
                                    labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
                                    formatter={(value: number | undefined) => [
                                        value != null ? Math.round(value).toLocaleString() : "0",
                                        "Volume"
                                    ]}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="volume"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorVolume)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No history data available
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
