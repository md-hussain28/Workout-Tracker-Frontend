"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
    Plus,
    Trash2,
    LayoutTemplate,
    Settings as SettingsIcon,
    Play,
    RotateCw,
    Wifi,
    Activity,
    Clock,
} from "lucide-react";
import { api, API_BASE, type WorkoutTemplate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

// ── Create Template Dialog ──
function CreateTemplateDialog() {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");

    const createMutation = useMutation({
        mutationFn: (templateName: string) => api.templates.create({ name: templateName }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates"] });
            setOpen(false);
            setName("");
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="rounded-xl">
                    <Plus className="mr-1 size-4" />
                    New
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create template</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (name.trim()) createMutation.mutate(name.trim());
                    }}
                    className="space-y-4"
                >
                    <div className="space-y-2">
                        <Label htmlFor="tpl-name">Template name</Label>
                        <Input
                            id="tpl-name"
                            placeholder="e.g. Push Day, Leg Day"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="rounded-xl"
                        />
                    </div>
                    {createMutation.isError && (
                        <p className="text-destructive text-sm">
                            {createMutation.error instanceof Error
                                ? createMutation.error.message
                                : "Failed to create template"}
                        </p>
                    )}
                    <Button
                        type="submit"
                        className="w-full rounded-xl"
                        disabled={!name.trim() || createMutation.isPending}
                    >
                        {createMutation.isPending ? "Creating…" : "Create"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ── Template Card ──
function TemplateCard({ template }: { template: WorkoutTemplate }) {
    const router = typeof window !== "undefined" ? require("next/navigation") : null;
    const queryClient = useQueryClient();

    const [deleteError, setDeleteError] = useState<string | null>(null);
    const deleteMutation = useMutation({
        mutationFn: () => api.templates.delete(template.id),
        onMutate: async () => {
            setDeleteError(null);
            await queryClient.cancelQueries({ queryKey: ["templates"] });
            const previous = queryClient.getQueryData<WorkoutTemplate[]>(["templates"]);
            queryClient.setQueryData<WorkoutTemplate[]>(
                ["templates"],
                (old) => old?.filter((t) => t.id !== template.id) ?? []
            );
            return { previous };
        },
        onError: (err, _v, context) => {
            if (context?.previous) queryClient.setQueryData(["templates"], context.previous);
            setDeleteError(err instanceof Error ? err.message : "Failed to delete");
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
    });

    const instantiateMutation = useMutation({
        mutationFn: () => api.templates.instantiate(template.id),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["workouts"] });
            if (router) {
                const { useRouter } = router;
                // Navigate is handled by the caller
            }
            window.location.href = `/workouts/${data.workout_id}`;
        },
    });

    return (
        <Card className="transition-colors hover:bg-muted/30">
            <CardContent className="py-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="font-medium">{template.name}</p>
                        <p className="text-muted-foreground text-sm">
                            {template.exercises?.length ?? 0} exercise
                            {(template.exercises?.length ?? 0) !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => instantiateMutation.mutate()}
                            disabled={instantiateMutation.isPending}
                        >
                            <Play className="mr-1 size-3.5" />
                            Start
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                                if (confirm("Delete this template?")) deleteMutation.mutate();
                            }}
                            disabled={deleteMutation.isPending}
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </div>
                {deleteError && (
                    <p className="text-destructive text-xs mt-2">{deleteError}</p>
                )}
                {template.exercises && template.exercises.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {template.exercises
                            .sort((a, b) => a.order_in_template - b.order_in_template)
                            .map((te) => (
                                <Badge
                                    key={te.id}
                                    variant="secondary"
                                    className="text-xs font-normal"
                                >
                                    {te.exercise?.name ?? `Exercise #${te.exercise_id}`}
                                </Badge>
                            ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ── Settings Page ──
export default function SettingsPage() {
    const queryClient = useQueryClient();
    const { data: templates = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ["templates"],
        queryFn: () => api.templates.list(),
    });

    // ── Ping state ──
    const [pingResult, setPingResult] = useState<string | null>(null);
    const [isPinging, setIsPinging] = useState(false);

    const [backendBuiltAt, setBackendBuiltAt] = useState<string | null>(null);

    const handlePing = async () => {
        setIsPinging(true);
        setPingResult(null);
        setBackendBuiltAt(null);
        const start = performance.now();
        try {
            const res = await fetch(`${API_BASE}/health`);
            const elapsed = Math.round(performance.now() - start);
            if (res.ok) {
                setPingResult(`${elapsed}ms`);
                const data = await res.json();
                if (data?.built_at) setBackendBuiltAt(data.built_at);
            } else {
                setPingResult(`Error ${res.status}`);
            }
        } catch {
            setPingResult("Unreachable");
        } finally {
            setIsPinging(false);
        }
    };

    // Fetch health on mount to show backend last updated
    const { data: healthData, isLoading: isHealthLoading } = useQuery({
        queryKey: ["health"],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/health`);
            if (!res.ok) throw new Error("Health check failed");
            return res.json();
        },
        staleTime: 1000 * 60 * 5,
        retry: 1,
    });
    const backendUpdated = healthData?.built_at ?? backendBuiltAt;

    // ── Clear cache ──
    const [cacheCleared, setCacheCleared] = useState(false);
    const handleClearCache = () => {
        localStorage.clear();
        queryClient.clear();
        setCacheCleared(true);
        setTimeout(() => window.location.reload(), 600);
    };

    return (
        <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10">
                        <SettingsIcon className="size-5 text-primary" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => refetch()}
                    disabled={isLoading || isRefetching}
                    className="rounded-full"
                >
                    <RotateCw
                        className={`size-5 text-muted-foreground ${isLoading || isRefetching ? "animate-spin" : ""
                            }`}
                    />
                </Button>
            </div>

            {/* Templates Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <LayoutTemplate className="size-5 text-muted-foreground" />
                        Templates
                    </h2>
                    <CreateTemplateDialog />
                </div>

                {isLoading && (
                    <div className="space-y-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex flex-col space-y-3 p-4 border rounded-xl">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[150px]" />
                                    <Skeleton className="h-3 w-[100px]" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && templates.length === 0 && (
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground text-sm">
                            <LayoutTemplate className="size-10 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">No templates yet</p>
                            <p className="text-sm mt-1">
                                Create a template to quickly start structured workouts.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {!isLoading && templates.length > 0 && (
                    <ul className="space-y-2">
                        {templates.map((t) => (
                            <li key={t.id}>
                                <TemplateCard template={t} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Preferences */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-3">Preferences</h2>
                <Card>
                    <CardContent className="py-4 text-muted-foreground text-sm">
                        More settings coming soon — units, theme, data export.
                    </CardContent>
                </Card>
            </div>

            {/* Advanced */}
            <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Activity className="size-5 text-muted-foreground" />
                    Advanced
                </h2>
                <div className="space-y-3">
                    {/* Ping Backend */}
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-green-500/10">
                                        <Wifi className="size-4 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Database Sync</p>
                                        <p className="text-xs text-muted-foreground">
                                            {pingResult
                                                ? pingResult === "Unreachable"
                                                    ? "Backend unreachable"
                                                    : `Render: ${pingResult}`
                                                : "Check API latency"}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={handlePing}
                                    disabled={isPinging}
                                >
                                    {isPinging ? (
                                        <RotateCw className="size-3.5 animate-spin" />
                                    ) : (
                                        "Ping"
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Clear Cache */}
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-destructive/10">
                                        <Trash2 className="size-4 text-destructive" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Clear Cache</p>
                                        <p className="text-xs text-muted-foreground">
                                            {cacheCleared
                                                ? "Cleared! Reloading…"
                                                : "Wipe localStorage & query cache"}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10"
                                    onClick={handleClearCache}
                                    disabled={cacheCleared}
                                >
                                    Clear
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Last updated — Frontend & Backend */}
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
                                    <Clock className="size-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Last updated</p>
                                    <p className="text-xs text-muted-foreground">
                                        When the app and API were last deployed
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Frontend</span>
                                    <span className="font-mono text-xs">
                                        {process.env.NEXT_PUBLIC_FRONTEND_UPDATED ?? "—"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Backend</span>
                                    <span className="font-mono text-xs">
                                        {isHealthLoading && !backendBuiltAt
                                            ? "…"
                                            : backendUpdated
                                                ? (() => {
                                                    try {
                                                        const d = new Date(backendUpdated);
                                                        return isNaN(d.getTime()) ? backendUpdated : d.toLocaleString();
                                                    } catch {
                                                        return backendUpdated;
                                                    }
                                                })()
                                                : "—"}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
