"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Settings,
    Scale,
    Ruler,
    TrendingUp,
    Trophy,
    ChevronDown,
    ChevronUp,
    Plus,
    Flame,
    Dumbbell,
    Target,
    ArrowLeftRight,
    Sparkles,
    History,
    Info,
    ChevronRight,
} from "lucide-react";
import {
    api,
    type UserBio,
    type BodyLog,
    type BodyLogCreate,
    type UserBioCreate,
    type Measurements,
} from "@/lib/api";
import { userBioCreateSchema, bodyLogCreateSchema } from "@/lib/schemas/body";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

// ── Lazy-loaded Recharts ──────────────────────────────────────────────
const WeightChart = dynamic(() => import("@/components/me/WeightChart"), {
    ssr: false,
    loading: () => (
        <div className="h-[200px] w-full animate-pulse rounded-2xl bg-muted/40" />
    ),
});
const PercentileRadarChart = dynamic(
    () => import("@/components/me/PercentileRadarChart"),
    { ssr: false }
);

// ── Circumference key metadata ──────────────────────────────────────
const CIRCUMFERENCE_KEYS: {
    key: keyof Measurements;
    label: string;
    group: string;
}[] = [
        { key: "chest", label: "Chest", group: "Torso" },
        { key: "shoulder", label: "Shoulder", group: "Torso" },
        { key: "waist", label: "Waist", group: "Torso" },
        { key: "hips", label: "Hips", group: "Torso" },
        { key: "neck", label: "Neck", group: "Torso" },
        { key: "bicep_l", label: "Bicep (L)", group: "Arms" },
        { key: "bicep_r", label: "Bicep (R)", group: "Arms" },
        { key: "forearm_l", label: "Forearm (L)", group: "Arms" },
        { key: "forearm_r", label: "Forearm (R)", group: "Arms" },
        { key: "thigh_l", label: "Thigh (L)", group: "Legs" },
        { key: "thigh_r", label: "Thigh (R)", group: "Legs" },
        { key: "calf_l", label: "Calf (L)", group: "Legs" },
        { key: "calf_r", label: "Calf (R)", group: "Legs" },
        { key: "wrist", label: "Wrist", group: "Other" },
        { key: "ankle", label: "Ankle", group: "Other" },
    ];

const PERCENTILE_LABELS: Record<string, string> = {
    chest: "Chest",
    waist: "Waist",
    hips: "Hips",
    neck: "Neck",
    shoulder: "Shoulder",
    bicep: "Bicep",
    forearm: "Forearm",
    thigh: "Thigh",
    calf: "Calf",
    wrist: "Wrist",
    ankle: "Ankle",
};

// ── Bio Setup Dialog ────────────────────────────────────────────────
function BioSetupDialog({
    bio,
    onSaved,
}: {
    bio: UserBio | null;
    onSaved?: () => void;
}) {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [height, setHeight] = useState(bio?.height_cm?.toString() ?? "");
    const [age, setAge] = useState(bio?.age?.toString() ?? "");
    const [sex, setSex] = useState<"male" | "female">(bio?.sex ?? "male");
    const [errors, setErrors] = useState<{ height_cm?: string; age?: string; sex?: string }>({});

    const mutation = useMutation({
        mutationFn: (data: UserBioCreate) => api.body.upsertBio(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["body-bio"] });
            setOpen(false);
            setErrors({});
            onSaved?.();
        },
        onError: () => setErrors({}),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        const h = height.trim() === "" ? NaN : parseFloat(height);
        const a = age.trim() === "" ? NaN : parseInt(age, 10);
        const result = userBioCreateSchema.safeParse({
            height_cm: Number.isNaN(h) ? undefined : h,
            age: Number.isNaN(a) ? undefined : a,
            sex,
        });
        if (!result.success) {
            const fieldErrors: { height_cm?: string; age?: string; sex?: string } = {};
            result.error.issues.forEach((issue) => {
                const path = issue.path[0] as "height_cm" | "age" | "sex";
                if (path && !fieldErrors[path]) fieldErrors[path] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }
        mutation.mutate(result.data);
    };

    return (
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setErrors({}); }}>
            <DialogTrigger asChild>
                {bio ? (
                    <Button variant="ghost" size="sm" className="rounded-xl text-xs">
                        Edit Profile
                    </Button>
                ) : (
                    <Button className="w-full rounded-xl" size="lg">
                        <Plus className="mr-2 size-4" />
                        Set Up Profile
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{bio ? "Edit Profile" : "Set Up Your Profile"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="bio-height">Height (cm)</Label>
                            <Input
                                id="bio-height"
                                type="number"
                                step="0.1"
                                placeholder="175"
                                value={height}
                                onChange={(e) => { setHeight(e.target.value); setErrors((prev) => ({ ...prev, height_cm: undefined })); }}
                                className="rounded-xl"
                                aria-invalid={!!errors.height_cm}
                            />
                            {errors.height_cm && (
                                <p className="text-xs text-destructive">{errors.height_cm}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bio-age">Age</Label>
                            <Input
                                id="bio-age"
                                type="number"
                                placeholder="25"
                                value={age}
                                onChange={(e) => { setAge(e.target.value); setErrors((prev) => ({ ...prev, age: undefined })); }}
                                className="rounded-xl"
                                aria-invalid={!!errors.age}
                            />
                            {errors.age && (
                                <p className="text-xs text-destructive">{errors.age}</p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Sex</Label>
                        <Select value={sex} onValueChange={(v) => setSex(v as "male" | "female")}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.sex && (
                            <p className="text-xs text-destructive">{errors.sex}</p>
                        )}
                    </div>
                    <Button
                        type="submit"
                        className="w-full rounded-xl"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? "Saving…" : "Save"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ── Log Body Dialog ─────────────────────────────────────────────────
// ── Log Body Dialog ─────────────────────────────────────────────────
function LogBodyDialog() {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("weight");
    const [weight, setWeight] = useState("");
    const [measurements, setMeasurements] = useState<Record<string, string>>({});

    const mutation = useMutation({
        mutationFn: (data: BodyLogCreate) => api.body.createLog(data),
        onMutate: async (newLog) => {
            // Optimistic update
            await queryClient.cancelQueries({ queryKey: ["body-latest"] });
            await queryClient.cancelQueries({ queryKey: ["body-history"] });
            const prevLatest = queryClient.getQueryData(["body-latest"]);
            queryClient.setQueryData(["body-latest"], {
                id: `temp-${Date.now()}`,
                user_id: "1", // TODO: Real user ID
                weight_kg: newLog.weight_kg,
                body_fat_pct: null,
                measurements: newLog.measurements ?? null,
                computed_stats: null,
                created_at: new Date().toISOString(),
            });
            return { prevLatest };
        },
        onError: (_err, _v, context) => {
            if (context?.prevLatest !== undefined) {
                queryClient.setQueryData(["body-latest"], context.prevLatest);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["body-latest"] });
            queryClient.invalidateQueries({ queryKey: ["body-history"] });
        },
        onSuccess: () => {
            setOpen(false);
            setWeight("");
            setMeasurements({});
        },
    });

    const [logError, setLogError] = useState<string | null>(null);

    const handleSaveWeight = () => {
        setLogError(null);
        const w = parseFloat(weight);
        const result = bodyLogCreateSchema.safeParse({ weight_kg: w });
        if (!result.success) {
            setLogError(result.error.issues.map((i) => i.message).join(" ") || "Invalid weight (20–400 kg).");
            return;
        }
        if (result.data.weight_kg == null) return;
        mutation.mutate({ weight_kg: result.data.weight_kg });
    };

    const handleSaveMeasurements = () => {
        setLogError(null);
        const cleanMeasurements: Record<string, number> = {};
        Object.entries(measurements).forEach(([k, v]) => {
            const num = parseFloat(v);
            if (num > 0) cleanMeasurements[k] = num;
        });
        if (Object.keys(cleanMeasurements).length === 0) {
            setLogError("Enter at least one measurement.");
            return;
        }
        const result = bodyLogCreateSchema.safeParse({ measurements: cleanMeasurements });
        if (!result.success) {
            setLogError(result.error.issues.map((i) => i.message).join(" ") || "Invalid measurements.");
            return;
        }
        mutation.mutate({ measurements: result.data.measurements ?? undefined });
    };

    const grouped = useMemo(() => {
        const groups: Record<string, typeof CIRCUMFERENCE_KEYS> = {};
        CIRCUMFERENCE_KEYS.forEach((k) => {
            if (!groups[k.group]) groups[k.group] = [];
            groups[k.group].push(k);
        });
        return groups;
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    className="w-full rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
                    size="lg"
                >
                    <Scale className="mr-2 size-5" />
                    Log Body
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Log Body Stats</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="weight" value={activeTab} onValueChange={(v) => { setActiveTab(v); setLogError(null); }} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="weight">Weight</TabsTrigger>
                        <TabsTrigger value="measurements">Measurements</TabsTrigger>
                    </TabsList>

                    <TabsContent value="weight" className="space-y-4">
                        {logError && (
                            <p className="text-sm text-destructive">{logError}</p>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="log-weight">Current Weight (kg)</Label>
                            <Input
                                id="log-weight"
                                type="number"
                                step="0.1"
                                placeholder="e.g. 80.5"
                                value={weight}
                                onChange={(e) => { setWeight(e.target.value); setLogError(null); }}
                                className="rounded-xl text-lg font-semibold h-12"
                                autoFocus
                            />
                        </div>
                        <Button
                            onClick={handleSaveWeight}
                            className="w-full rounded-xl"
                            disabled={!weight || mutation.isPending}
                        >
                            {mutation.isPending ? "Saving..." : "Save Weight Log"}
                        </Button>
                    </TabsContent>

                    <TabsContent value="measurements" className="space-y-4">
                        <div className="rounded-xl border border-border/40 bg-card">
                            <Accordion type="single" collapsible className="w-full">
                                {Object.entries(grouped).map(([group, keys], index) => (
                                    <AccordionItem
                                        key={group}
                                        value={group}
                                        className={index === Object.keys(grouped).length - 1 ? "border-b-0" : ""}
                                    >
                                        <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline hover:bg-muted/30 transition-colors">
                                            {group}
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pb-4 pt-1">
                                            <div className="grid grid-cols-2 gap-3">
                                                {keys.map(({ key, label }) => (
                                                    <div key={key} className="space-y-1.5">
                                                        <Label
                                                            htmlFor={`m-${key}`}
                                                            className="text-xs text-muted-foreground ml-1"
                                                        >
                                                            {label}
                                                        </Label>
                                                        <div className="relative">
                                                            <Input
                                                                id={`m-${key}`}
                                                                type="number"
                                                                step="0.1"
                                                                placeholder="0"
                                                                value={measurements[key] ?? ""}
                                                                onChange={(e) =>
                                                                    setMeasurements((prev) => ({
                                                                        ...prev,
                                                                        [key]: e.target.value,
                                                                    }))
                                                                }
                                                                className="h-11 rounded-xl bg-muted/20 text-base"
                                                            />
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                                                cm
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                        {logError && (
                            <p className="text-sm text-destructive">{logError}</p>
                        )}
                        <Button
                            onClick={handleSaveMeasurements}
                            className="w-full rounded-xl"
                            disabled={Object.values(measurements).every(v => !v) || mutation.isPending}
                        >
                            {mutation.isPending ? "Saving..." : "Save Measurements"}
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}





// ── Main Me Page ────────────────────────────────────────────────────
export default function MePage() {
    const [historyDays, setHistoryDays] = useState<number>(30);

    const { data: bio, isLoading: isBioLoading } = useQuery({
        queryKey: ["body-bio"],
        queryFn: () => api.body.getBio(),
    });

    const { data: latest, isLoading: isLatestLoading } = useQuery({
        queryKey: ["body-latest"],
        queryFn: () => api.body.getLatest(),
        enabled: !!bio,
    });

    const { data: history = [] } = useQuery({
        queryKey: ["body-history"],
        queryFn: () => api.body.listLogs(),
        enabled: !!bio,
    });

    const stats = latest?.computed_stats;

    // Derived stats (scanning history for latest non-null values)
    const currentWeight = useMemo(() => {
        if (latest?.weight_kg) return latest.weight_kg;
        return history.find((l) => l.weight_kg)?.weight_kg;
    }, [latest, history]);

    const currentBMR = useMemo(() => {
        if (stats?.bmr) return stats.bmr;
        return history.find((l) => l.computed_stats?.bmr)?.computed_stats?.bmr;
    }, [stats, history]);

    const currentBF = useMemo(() => {
        if (stats?.bf_navy) return stats.bf_navy;
        return history.find((l) => l.computed_stats?.bf_navy)?.computed_stats?.bf_navy;
    }, [stats, history]);

    // For percentiles, we prefer the latest log's percentiles if available (even if partial),
    // but if the latest log has NO percentiles (e.g. weight only), we might want to fall back?
    // Percentiles are usually comprehensive. Let's stick to latest for percentiles for now,
    // or maybe fall back if latest has no keys.
    const currentPercentiles = useMemo(() => {
        if (stats?.percentiles && Object.keys(stats.percentiles).length > 0) return stats.percentiles;
        return history.find(l => l.computed_stats?.percentiles && Object.keys(l.computed_stats.percentiles).length > 0)
            ?.computed_stats?.percentiles;
    }, [stats, history]);

    const chartData = useMemo(() => {
        // Filter history based on selected days
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - historyDays);

        return [...history]
            .reverse()
            .filter((l) => {
                const logDate = new Date(l.created_at);
                return logDate >= cutoff && l.weight_kg !== null;
            })
            .map((l) => ({
                date: new Date(l.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                }),
                weight: l.weight_kg,
            }));
    }, [history, historyDays]);

    return (
        <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
            {/* Header with gear icon */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Me</h1>
                <Link href="/settings">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-muted-foreground hover:text-foreground"
                    >
                        <Settings className="size-5" />
                    </Button>
                </Link>
            </div>

            {/* Loading state */}
            {isBioLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-32 w-full rounded-2xl" />
                    <Skeleton className="h-12 w-full rounded-2xl" />
                    <Skeleton className="h-48 w-full rounded-2xl" />
                </div>
            )}

            {/* Bio not set up yet */}
            {!isBioLoading && !bio && (
                <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
                    <CardContent className="py-10 text-center">
                        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-primary/10">
                            <Sparkles className="size-8 text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold mb-2">Set Up Body Analytics</h2>
                        <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                            Enter your height, age, and sex to unlock BMR, body fat estimates,
                            and population percentile rankings.
                        </p>
                        <BioSetupDialog bio={null} />
                    </CardContent>
                </Card>
            )}

            {/* Main content when bio exists */}
            {!isBioLoading && bio && (
                <div className="flex flex-col gap-5">
                    {/* Bio summary row */}
                    <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-card px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                                <Ruler className="size-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">
                                    {bio.height_cm} cm · {bio.age} yrs ·{" "}
                                    {bio.sex === "male" ? "♂" : "♀"}
                                </p>
                                <p className="text-xs text-muted-foreground">Body profile</p>
                            </div>
                        </div>
                        <BioSetupDialog bio={bio} />
                    </div>

                    {/* Log Body CTA */}
                    <LogBodyDialog />

                    {/* Aesthetic Rank — Hero Card */}
                    {stats?.aesthetic_rank != null && (
                        <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background">
                            <CardContent className="py-6 text-center relative">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 to-transparent" />
                                <div className="relative z-10">
                                    <Trophy className="size-8 text-primary mx-auto mb-2" />
                                    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                                        Aesthetic Rank
                                    </p>
                                    <p className="text-4xl font-black tracking-tight">
                                        Top {stats.aesthetic_rank}%
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        vs. population average
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Stats Bento Grid */}
                    {(latest || history.length > 0) && (
                        <div className="grid grid-cols-3 gap-3">
                            {isLatestLoading ? (
                                <>
                                    <Skeleton className="h-24 rounded-2xl" />
                                    <Skeleton className="h-24 rounded-2xl" />
                                    <Skeleton className="h-24 rounded-2xl" />
                                </>
                            ) : (
                                <>
                                    <StatCard
                                        icon={<Scale className="size-4" />}
                                        label="Weight"
                                        value={currentWeight ? `${currentWeight}` : "—"}
                                        unit="kg"
                                        color="text-blue-500"
                                        bgColor="bg-blue-500/10"
                                    />
                                    <StatCard
                                        icon={<Flame className="size-4" />}
                                        label="BMR"
                                        value={currentBMR ? `${Math.round(currentBMR)}` : "—"}
                                        unit="kcal"
                                        color="text-orange-500"
                                        bgColor="bg-orange-500/10"
                                    />
                                    <StatCard
                                        icon={<TrendingUp className="size-4" />}
                                        label="Body Fat"
                                        value={currentBF ? `${currentBF}` : "—"}
                                        unit="%"
                                        color="text-emerald-500"
                                        bgColor="bg-emerald-500/10"
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {/* FFMI Card */}
                    {stats?.ffmi != null && (
                        <Card className="border-border/40">
                            <CardContent className="py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10">
                                            <Dumbbell className="size-5 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                FFMI
                                            </p>
                                            <p className="text-xl font-bold">{stats.ffmi}</p>
                                        </div>
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="rounded-xl text-xs"
                                    >
                                        {stats.ffmi >= 25
                                            ? "Elite"
                                            : stats.ffmi >= 22
                                                ? "Advanced"
                                                : stats.ffmi >= 20
                                                    ? "Intermediate"
                                                    : "Beginner"}
                                    </Badge>
                                </div>
                                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-700"
                                        style={{
                                            width: `${Math.min((stats.ffmi / 30) * 100, 100)}%`,
                                        }}
                                    />
                                </div>
                                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                                    <span>16</span>
                                    <span>20</span>
                                    <span>25</span>
                                    <span>30+</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Weight Trend Chart */}
                    {chartData.length > 0 && (
                        <Card className="border-border/40">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <TrendingUp className="size-4 text-primary" />
                                        Weight Trend
                                    </CardTitle>
                                    <div className="flex gap-1">
                                        {[7, 30, 90].map((d) => (
                                            <Button
                                                key={d}
                                                variant={historyDays === d ? "default" : "ghost"}
                                                size="sm"
                                                className="h-7 rounded-lg px-2.5 text-xs"
                                                onClick={() => setHistoryDays(d)}
                                            >
                                                {d}d
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <WeightChart data={chartData} />
                            </CardContent>
                        </Card>
                    )}

                    {/* View All History Link */}
                    {history.length > 0 && (
                        <Link href="/me/history">
                            <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-card px-4 py-3.5 transition-colors hover:bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10">
                                        <History className="size-4 text-violet-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">View All History</p>
                                        <p className="text-xs text-muted-foreground">
                                            {history.length} entries · Edit, delete & track progression
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="size-4 text-muted-foreground" />
                            </div>
                        </Link>
                    )}

                    {/* Population Percentiles */}
                    {currentPercentiles &&
                        Object.keys(currentPercentiles).length > 0 && (
                            <PercentileRadarChart percentiles={currentPercentiles} />
                        )}



                    {/* No data yet nudge */}
                    {!isLatestLoading && !latest && (
                        <Card className="border-border/40">
                            <CardContent className="py-8 text-center text-muted-foreground">
                                <Scale className="size-10 mx-auto mb-3 opacity-40" />
                                <p className="font-medium">No body logs yet</p>
                                <p className="text-sm mt-1">
                                    Log your weight and circumferences to see your analytics.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Stat Card Component ─────────────────────────────────────────────
function StatCard({
    icon,
    label,
    value,
    unit,
    color,
    bgColor,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    unit: string;
    color: string;
    bgColor: string;
}) {
    return (
        <Card className="border-border/40">
            <CardContent className="py-4 px-3 text-center">
                <div
                    className={`mx-auto mb-2 flex size-8 items-center justify-center rounded-xl ${bgColor}`}
                >
                    <span className={color}>{icon}</span>
                </div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold tabular-nums leading-tight">
                    {value}
                    <span className="text-xs font-normal text-muted-foreground ml-0.5">
                        {unit}
                    </span>
                </p>
            </CardContent>
        </Card>
    );
}
