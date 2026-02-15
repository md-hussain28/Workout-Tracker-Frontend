"use client";

import { useParams, useRouter, notFound } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { api, type MeasurementMode } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MuscleGroupPicker } from "@/components/MuscleGroupPicker";

const MEASUREMENT_MODES: { value: MeasurementMode; label: string }[] = [
  { value: "weight_reps", label: "Weight × Reps" },
  { value: "bodyweight_reps", label: "Bodyweight × Reps" },
  { value: "time", label: "Time" },
];

export default function ExerciseEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const exerciseId = params.id;

  const { data: exercise, isLoading: exLoading } = useQuery({
    queryKey: ["exercise", exerciseId],
    queryFn: () => api.exercises.get(exerciseId),
    enabled: !!exerciseId,
  });

  const { data: muscleGroups = [] } = useQuery({
    queryKey: ["muscleGroups"],
    queryFn: () => api.muscleGroups.list(),
  });

  const [name, setName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [unit, setUnit] = useState<string | null>(null);
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode | null>(null);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [secondaryId, setSecondaryId] = useState<string | null>(null);
  const [tertiaryId, setTertiaryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!exerciseId) return notFound();

  if (exLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!exercise) return notFound();

  // Use local state if set, otherwise fall back to fetched data
  const currentName = name ?? exercise.name;
  const currentDescription = description ?? (exercise.description ?? "");
  const currentUnit = unit ?? exercise.unit;
  const currentMode = measurementMode ?? exercise.measurement_mode;
  const currentPrimary = primaryId ?? (exercise.primary_muscle_group_id ? String(exercise.primary_muscle_group_id) : "");
  const currentSecondary = secondaryId ?? (exercise.secondary_muscle_group_id ? String(exercise.secondary_muscle_group_id) : "none");
  const currentTertiary = tertiaryId ?? (exercise.tertiary_muscle_group_id ? String(exercise.tertiary_muscle_group_id) : "none");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.exercises.update(exercise!.id, {
        name: currentName.trim(),
        description: currentDescription.trim() || null,
        unit: currentUnit,
        measurement_mode: currentMode,
        primary_muscle_group_id: currentPrimary || null,
        secondary_muscle_group_id: currentSecondary && currentSecondary !== "none" ? currentSecondary : null,
        tertiary_muscle_group_id: currentTertiary && currentTertiary !== "none" ? currentTertiary : null,
      });
      queryClient.invalidateQueries({ queryKey: ["exercise", exerciseId] });
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      queryClient.invalidateQueries({ queryKey: ["exerciseStats", exerciseId] });
      router.push(`/exercises/${exercise!.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <Link
        href={`/exercises/${exercise.id}`}
        className="inline-flex items-center gap-1 text-muted-foreground text-sm mb-3 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Edit exercise</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={currentName}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={currentDescription}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Measurement</Label>
              <Select value={currentMode} onValueChange={(v) => setMeasurementMode(v as MeasurementMode)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEASUREMENT_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {currentMode === "weight_reps" && (
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={currentUnit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Muscle groups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Primary</Label>
              <MuscleGroupPicker
                muscleGroups={muscleGroups}
                value={currentPrimary}
                onValueChange={(v) => setPrimaryId(v)}
                placeholder="Select primary muscle"
              />
            </div>
            <div className="space-y-2">
              <Label>Secondary (optional)</Label>
              <MuscleGroupPicker
                muscleGroups={muscleGroups.filter((mg) => String(mg.id) !== currentPrimary)}
                value={currentSecondary}
                onValueChange={(v) => setSecondaryId(v)}
                placeholder="None"
              />
            </div>
            <div className="space-y-2">
              <Label>Tertiary (optional)</Label>
              <MuscleGroupPicker
                muscleGroups={muscleGroups.filter((mg) => String(mg.id) !== currentPrimary && (currentSecondary === "none" || String(mg.id) !== currentSecondary))}
                value={currentTertiary}
                onValueChange={(v) => setTertiaryId(v)}
                placeholder="None"
              />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-destructive text-sm">{error}</p>}
        <Button type="submit" className="w-full rounded-xl py-6" size="lg" disabled={!currentName.trim() || loading}>
          {loading ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
