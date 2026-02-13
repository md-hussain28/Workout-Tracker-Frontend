"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
    Plus,
    Trash2,
    LayoutTemplate,
    Settings as SettingsIcon,
    ChevronRight,
    Play,
    RotateCw,
} from "lucide-react";
import { api, type WorkoutTemplate } from "@/lib/api";
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

    const deleteMutation = useMutation({
        mutationFn: () => api.templates.delete(template.id),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["templates"] });
            const previous = queryClient.getQueryData<WorkoutTemplate[]>(["templates"]);
            queryClient.setQueryData<WorkoutTemplate[]>(
                ["templates"],
                (old) => old?.filter((t) => t.id !== template.id) ?? []
            );
            return { previous };
        },
        onError: (_err, _v, context) => {
            if (context?.previous) queryClient.setQueryData(["templates"], context.previous);
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
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                </div>
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
    const { data: templates = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ["templates"],
        queryFn: () => api.templates.list(),
    });

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
            <div>
                <h2 className="text-lg font-semibold mb-3">Preferences</h2>
                <Card>
                    <CardContent className="py-4 text-muted-foreground text-sm">
                        More settings coming soon — units, theme, data export.
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
