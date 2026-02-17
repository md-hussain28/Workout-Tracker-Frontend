"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { api, type MeasurementMode } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function NewExercisePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: muscleGroups = [] } = useQuery({
    queryKey: ["muscleGroups"],
    queryFn: () => api.muscleGroups.list(),
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("kg");
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>("weight_reps");
  const [primaryId, setPrimaryId] = useState<string>("");
  const [secondaryId, setSecondaryId] = useState<string>("");
  const [tertiaryId, setTertiaryId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof api.exercises.create>[0]) => api.exercises.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
      router.push("/exercises");
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Failed to create exercise"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || createMutation.isPending) return;
    if (!primaryId) {
      setError("Primary muscle group is required.");
      return;
    }
    setError(null);
    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || null,
      unit,
      measurement_mode: measurementMode,
      primary_muscle_group_id: primaryId,
      secondary_muscle_group_id: secondaryId && secondaryId !== "none" ? secondaryId : null,
      tertiary_muscle_group_id: tertiaryId && tertiaryId !== "none" ? tertiaryId : null,
    });
  }

  const canSubmit = name.trim() && primaryId && !createMutation.isPending;

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <Link
        href="/exercises"
        className="inline-flex items-center gap-1 text-muted-foreground text-sm mb-3 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Exercises
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">New exercise</h1>
      <p className="text-muted-foreground text-sm mb-6">Add an exercise to use in workouts.</p>

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
                placeholder="e.g. Bench Press"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="Notes or form cues"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Measurement</Label>
              <Select
                value={measurementMode}
                onValueChange={(v) => setMeasurementMode(v as MeasurementMode)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEASUREMENT_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {measurementMode === "weight_reps" && (
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  placeholder="kg"
                  value={unit}
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
            <CardDescription>
              Primary is required. Secondary and tertiary are optional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Primary *</Label>
              <MuscleGroupPicker
                muscleGroups={muscleGroups}
                value={primaryId}
                onValueChange={setPrimaryId}
                placeholder="Select primary muscle"
              />
              {muscleGroups.length === 0 && (
                <p className="text-muted-foreground text-xs">
                  No muscle groups yet.{" "}
                  <Link href="/exercises" className="text-primary underline">
                    Add one first
                  </Link>{" "}
                  in the Muscle Groups tab.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Secondary (optional)</Label>
              <MuscleGroupPicker
                muscleGroups={muscleGroups}
                value={secondaryId}
                onValueChange={setSecondaryId}
                placeholder="None"
              />
            </div>
            <div className="space-y-2">
              <Label>Tertiary (optional)</Label>
              <MuscleGroupPicker
                muscleGroups={muscleGroups}
                value={tertiaryId}
                onValueChange={setTertiaryId}
                placeholder="None"
              />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button
          type="submit"
          className="w-full rounded-xl py-6"
          size="lg"
          disabled={!canSubmit}
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="mr-2 size-5 animate-spin" />
              Creating…
            </>
          ) : (
            "Create exercise"
          )}
        </Button>
      </form>
    </div>
  );
}
