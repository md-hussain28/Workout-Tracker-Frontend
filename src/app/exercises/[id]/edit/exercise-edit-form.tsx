"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api, type Exercise, type MuscleGroup, type MeasurementMode } from "@/lib/api";
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

const MEASUREMENT_MODES: { value: MeasurementMode; label: string }[] = [
  { value: "weight_reps", label: "Weight × Reps" },
  { value: "bodyweight_reps", label: "Bodyweight × Reps" },
  { value: "time", label: "Time" },
];

export function ExerciseEditForm({ exercise }: { exercise: Exercise }) {
  const router = useRouter();
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [name, setName] = useState(exercise.name);
  const [description, setDescription] = useState(exercise.description ?? "");
  const [unit, setUnit] = useState(exercise.unit);
  const [measurementMode, setMeasurementMode] = useState<MeasurementMode>(exercise.measurement_mode);
  const [primaryId, setPrimaryId] = useState(exercise.primary_muscle_group_id ? String(exercise.primary_muscle_group_id) : "");
  const [secondaryId, setSecondaryId] = useState(exercise.secondary_muscle_group_id ? String(exercise.secondary_muscle_group_id) : "");
  const [tertiaryId, setTertiaryId] = useState(exercise.tertiary_muscle_group_id ? String(exercise.tertiary_muscle_group_id) : "");
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
      await api.exercises.update(exercise.id, {
        name: name.trim(),
        description: description.trim() || null,
        unit,
        measurement_mode: measurementMode,
        primary_muscle_group_id: primaryId ? parseInt(primaryId, 10) : null,
        secondary_muscle_group_id: secondaryId ? parseInt(secondaryId, 10) : null,
        tertiary_muscle_group_id: tertiaryId ? parseInt(tertiaryId, 10) : null,
      });
      router.push(`/exercises/${exercise.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  return (
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>Measurement</Label>
            <Select value={measurementMode} onValueChange={(v) => setMeasurementMode(v as MeasurementMode)}>
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
          {measurementMode === "weight_reps" && (
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} className="rounded-xl" />
            </div>
          )}
        </CardContent>
      </Card>

      {muscleGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Muscle groups</CardTitle>
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
                    <SelectItem key={mg.id} value={String(mg.id)}>{mg.name}</SelectItem>
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
                    <SelectItem key={mg.id} value={String(mg.id)}>{mg.name}</SelectItem>
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
                    <SelectItem key={mg.id} value={String(mg.id)}>{mg.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" className="w-full rounded-xl py-6" size="lg" disabled={!name.trim() || loading}>
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
