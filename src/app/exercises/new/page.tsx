"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api, type MuscleGroup, type MeasurementMode } from "@/lib/api";
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

const MEASUREMENT_MODES: { value: MeasurementMode; label: string }[] = [
  { value: "weight_reps", label: "Weight × Reps" },
  { value: "bodyweight_reps", label: "Bodyweight × Reps" },
  { value: "time", label: "Time" },
];

export default function NewExercisePage() {
  const router = useRouter();
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("kg");
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>("weight_reps");
  const [primaryId, setPrimaryId] = useState<string>("");
  const [secondaryId, setSecondaryId] = useState<string>("");
  const [tertiaryId, setTertiaryId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.muscleGroups.list().then(setMuscleGroups);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.exercises.create({
        name: name.trim(),
        description: description.trim() || null,
        unit,
        measurement_mode: measurementMode,
        primary_muscle_group_id: primaryId ? parseInt(primaryId, 10) : null,
        secondary_muscle_group_id: secondaryId ? parseInt(secondaryId, 10) : null,
        tertiary_muscle_group_id: tertiaryId ? parseInt(tertiaryId, 10) : null,
      });
      router.push("/exercises");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create exercise");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
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

        {muscleGroups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Muscle groups (optional)</CardTitle>
              <CardDescription>Primary, secondary, tertiary.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Primary</Label>
                <Select value={primaryId} onValueChange={setPrimaryId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {muscleGroups.map((mg) => (
                      <SelectItem key={mg.id} value={String(mg.id)}>
                        {mg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Secondary</Label>
                <Select value={secondaryId} onValueChange={setSecondaryId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {muscleGroups.map((mg) => (
                      <SelectItem key={mg.id} value={String(mg.id)}>
                        {mg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tertiary</Label>
                <Select value={tertiaryId} onValueChange={setTertiaryId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {muscleGroups.map((mg) => (
                      <SelectItem key={mg.id} value={String(mg.id)}>
                        {mg.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button
          type="submit"
          className="w-full rounded-xl py-6"
          size="lg"
          disabled={!name.trim() || loading}
        >
          {loading ? "Creating…" : "Create exercise"}
        </Button>
      </form>
    </div>
  );
}
