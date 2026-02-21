"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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

const BODY_BIO_STORAGE_KEY = "workout-tracker-body-bio";

const DEFAULT_BIO_ID = "00000000-0000-0000-0000-000000000001";

/** Read and validate bio from localStorage. Returns a full UserBio or null. */
function getStoredBio(): UserBio | null {
    if (typeof window === "undefined") return null;
    try {
        const s = localStorage.getItem(BODY_BIO_STORAGE_KEY);
        if (!s) return null;
        const parsed = JSON.parse(s) as unknown;
        if (!parsed || typeof parsed !== "object") return null;
        const p = parsed as Record<string, unknown>;
        const id = typeof p.id === "string" ? p.id : DEFAULT_BIO_ID;
        const height_cm = typeof p.height_cm === "number" ? p.height_cm : 0;
        const age = typeof p.age === "number" ? p.age : 0;
        const sex = p.sex === "female" ? "female" : "male";
        if (height_cm < 50 || age < 10) return null;
        return {
            id,
            height_cm,
            age,
            sex,
            created_at: typeof p.created_at === "string" ? p.created_at : new Date(0).toISOString(),
            updated_at: typeof p.updated_at === "string" ? p.updated_at : new Date(0).toISOString(),
        } as UserBio;
    } catch {
        return null;
    }
}

function setStoredBio(bio: UserBio): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(BODY_BIO_STORAGE_KEY, JSON.stringify(bio));
    } catch {
        /* ignore */
    }
}

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

// ── Me Page Loading Screen ──────────────────────────────────────────
function MePageLoadingScreen() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
            <div className="relative mb-8">
                <div className="size-20 rounded-3xl bg-primary/10 flex items-center justify-center animate-pulse">
                    <Scale className="size-10 text-primary/70" />
                </div>
                <div className="absolute -inset-2 rounded-[1.75rem] bg-primary/5 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Loading your body analytics</p>
            <p className="text-xs text-muted-foreground max-w-[240px]">
                Fetching your profile and stats…
            </p>
            <div className="mt-8 w-full max-w-[280px] space-y-3">
                <Skeleton className="h-14 w-full rounded-2xl" />
                <Skeleton className="h-14 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
        </div>
    );
}

// ── Bio Setup Dialog (controlled by parent so it stays mounted and closes after save) ─────
function BioSetupDialog({
    bio,
    open,
    onOpenChange,
}: {
    bio: UserBio | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const [height, setHeight] = useState(bio?.height_cm?.toString() ?? "");
    const [age, setAge] = useState(bio?.age?.toString() ?? "");
    const [sex, setSex] = useState<"male" | "female">(bio?.sex ?? "male");
    const [errors, setErrors] = useState<{ height_cm?: string; age?: string; sex?: string }>({});
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setHeight(bio?.height_cm?.toString() ?? "");
            setAge(bio?.age?.toString() ?? "");
            setSex(bio?.sex ?? "male");
            setErrors({});
            setSubmitError(null);
        }
    }, [open, bio?.height_cm, bio?.age, bio?.sex]);

    const mutation = useMutation({
        mutationFn: (data: UserBioCreate) => api.body.upsertBio(data),
        onSuccess: (data, variables) => {
            setSubmitError(null);
            setErrors({});
            onOpenChange(false);
            // Always set cache so analytics show. Use API response, or build from form if response missing.
            const bioToSet: UserBio =
                data && typeof data === "object" && String((data as UserBio).id).length > 0
                    ? (data as UserBio)
                    : {
                        id: DEFAULT_BIO_ID,
                        height_cm: variables.height_cm,
                        age: variables.age,
                        sex: variables.sex,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    };
            setStoredBio(bioToSet);
            queryClient.setQueryData(["body-bio"], bioToSet);
            queryClient.invalidateQueries({ queryKey: ["body-latest"] });
            queryClient.invalidateQueries({ queryKey: ["body-history"] });
        },
        onError: (err) => {
            setErrors({});
            setSubmitError(err instanceof Error ? err.message : "Failed to save. Please try again.");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setSubmitError(null);
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
        <Dialog
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o);
                if (!o) {
                    setErrors({});
                    setSubmitError(null);
                }
            }}
        >
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
                    {submitError && (
                        <p className="text-sm text-destructive rounded-xl bg-destructive/10 px-3 py-2">
                            {submitError}
                        </p>
                    )}
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

    const { data: latestLog } = useQuery({
        queryKey: ["body-latest"],
        queryFn: () => api.body.getLatest(),
        enabled: open,
    });

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
        onError: (err, _v, context) => {
            if (context?.prevLatest !== undefined) {
                queryClient.setQueryData(["body-latest"], context.prevLatest);
            }
            setLogError(err instanceof Error ? err.message : String(err));
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
        <Dialog open={open} onOpenChange={(open) => { setOpen(open); if (!open) setLogError(null); }}>
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
                        {!latestLog && (
                            <p className="text-sm text-muted-foreground rounded-xl bg-muted/50 px-3 py-2">
                                No body log yet? Log your weight on the <strong>Weight</strong> tab first, then you can add measurements here.
                            </p>
                        )}
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

// ── Aesthetic Rank Card (explanation in modal) ─────────────────────────
function AestheticRankCard({ rank }: { rank: number }) {
    const [infoOpen, setInfoOpen] = useState(false);
    return (
        <>
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background">
                <CardContent className="relative py-6 text-center">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 to-transparent" />
                    <div className="relative z-10">
                        <Trophy className="mx-auto mb-2 size-8 text-primary" />
                        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
                            Aesthetic Rank
                        </p>
                        <p className="text-4xl font-black tracking-tight">
                            Top {rank}%
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            vs. population average
                        </p>
                        <button
                            type="button"
                            onClick={() => setInfoOpen(true)}
                            className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                        >
                            <Info className="size-3.5 shrink-0" />
                            How it&apos;s calculated
                        </button>
                    </div>
                </CardContent>
            </Card>
            <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
                <DialogContent className="max-w-xs sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Aesthetic Rank</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Composite of shoulder-to-waist ratio, chest/shoulder/bicep/thigh/calf percentiles, and waist (lower is better). Uses your logged measurements and population percentiles. Indicative only—aesthetic is subjective; best for tracking proportionality over time.
                    </p>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ── Main Me Page ────────────────────────────────────────────────────
export default function MePage() {
    const [historyDays, setHistoryDays] = useState<number>(30);
    const [bioDialogOpen, setBioDialogOpen] = useState(false);
    const [ffmiInfoOpen, setFfmiInfoOpen] = useState(false);

    const { data: bio, isLoading: isBioLoading } = useQuery({
        queryKey: ["body-bio"],
        queryFn: async () => {
            try {
                const fromApi = await api.body.getBio();
                if (fromApi?.id) {
                    setStoredBio(fromApi);
                    return fromApi;
                }
            } catch {
                /* API failed — use localStorage so profile persists after refresh */
            }
            return getStoredBio();
        },
        initialData: () => getStoredBio() ?? undefined,
        staleTime: 1000 * 60 * 60,
        refetchOnMount: false,
    });

    const { data: latest, isLoading: isLatestLoading } = useQuery({
        queryKey: ["body-latest"],
        queryFn: () => api.body.getLatest(),
        enabled: !!bio,
    });

    const { data: history = [], isLoading: isHistoryLoading } = useQuery({
        queryKey: ["body-history"],
        queryFn: () => api.body.listLogs(),
        enabled: !!bio,
    });

    const isStatsLoading = isLatestLoading || isHistoryLoading;

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

    const BF_KEYS = ["bf_army", "bf_cun_bae", "bf_rfm", "bf_multi", "bf_navy"] as const;
    const currentBF = useMemo(() => {
        const cs = stats ?? history.find((l) => l.computed_stats && BF_KEYS.some((k) => (l.computed_stats as unknown as Record<string, number | null>)[k] != null))?.computed_stats;
        if (!cs) return undefined;
        const raw = cs as unknown as Record<string, number | null>;
        const values = BF_KEYS.map((k) => raw[k]).filter((v): v is number => typeof v === "number");
        if (values.length === 0) return undefined;
        return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
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

            {/* User-friendly loading screen */}
            {isBioLoading && <MePageLoadingScreen />}

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
                        <Button className="w-full rounded-xl" size="lg" onClick={() => setBioDialogOpen(true)}>
                            <Plus className="mr-2 size-4" />
                            Set Up Profile
                        </Button>
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
                        <Button variant="ghost" size="sm" className="rounded-xl text-xs" onClick={() => setBioDialogOpen(true)}>
                            Edit Profile
                        </Button>
                    </div>

                    {/* Log Body CTA */}
                    <LogBodyDialog />

                    {/* Aesthetic Rank — Hero Card */}
                    {stats?.aesthetic_rank != null && (
                        <AestheticRankCard rank={stats.aesthetic_rank} />
                    )}

                    {/* Stats Bento Grid */}
                    {(isStatsLoading || latest || history.length > 0) && (
                        <div className="grid grid-cols-3 gap-3">
                            {isStatsLoading ? (
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
                                    <Link href="/me/body-fat" className="block relative transition-transform hover:scale-105 active:scale-95">
                                        <StatCard
                                            icon={<TrendingUp className="size-4" />}
                                            label="Body Fat"
                                            value={currentBF ? `${currentBF}` : "—"}
                                            unit="%"
                                            color="text-emerald-500"
                                            bgColor="bg-emerald-500/10"
                                        />
                                        <div className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-emerald-500/20">
                                            <ChevronRight className="size-3 text-emerald-600" />
                                        </div>
                                    </Link>
                                </>
                            )}
                        </div>
                    )}

                    {/* FFMI Card */}
                    {stats?.ffmi != null && (
                        <>
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
                                                width: `${Math.min(100, Math.max(0, ((stats.ffmi - 16) / (30 - 16)) * 100))}%`,
                                            }}
                                        />
                                    </div>
                                    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                                        <span>16</span>
                                        <span>20</span>
                                        <span>25</span>
                                        <span>30+</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFfmiInfoOpen(true)}
                                        className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                                    >
                                        <Info className="size-3.5 shrink-0" />
                                        How it&apos;s calculated
                                    </button>
                                </CardContent>
                            </Card>
                            <Dialog open={ffmiInfoOpen} onOpenChange={setFfmiInfoOpen}>
                                <DialogContent className="max-w-xs sm:max-w-sm">
                                    <DialogHeader>
                                        <DialogTitle>FFMI</DialogTitle>
                                    </DialogHeader>
                                    <p className="text-sm text-muted-foreground">
                                        Fat-Free Mass Index: lean mass ÷ height², normalized for height. Uses your weight, height, and body fat % (Navy formula from waist/neck/height, or manual). Good for tracking muscle relative to size; body fat is estimated so FFMI is an estimate—reliable for trends, not absolute precision.
                                    </p>
                                </DialogContent>
                            </Dialog>
                        </>
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
                                    <Select
                                        value={String(historyDays)}
                                        onValueChange={(v) => setHistoryDays(Number(v))}
                                    >
                                        <SelectTrigger className="h-8 w-[100px] rounded-lg text-xs">
                                            <SelectValue placeholder="Range" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="7">7 days</SelectItem>
                                            <SelectItem value="14">14 days</SelectItem>
                                            <SelectItem value="30">30 days</SelectItem>
                                            <SelectItem value="90">90 days</SelectItem>
                                            <SelectItem value="180">6 months</SelectItem>
                                            <SelectItem value="365">1 year</SelectItem>
                                            <SelectItem value="730">2 years</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                    {!isStatsLoading && !latest && (
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

            {/* Bio dialog: always mounted and controlled so it closes reliably after save */}
            <BioSetupDialog bio={bio ?? null} open={bioDialogOpen} onOpenChange={setBioDialogOpen} />
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
