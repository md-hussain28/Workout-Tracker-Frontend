"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewWorkoutPage() {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const workout = await api.workouts.create(notes ? { notes } : {});
      router.replace(`/workouts/${workout.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start workout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">New workout</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Start a session and add sets as you go.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Notes (optional)</CardTitle>
          <CardDescription>e.g. Push day, or how you feel.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes" className="sr-only">Notes</Label>
            <Input
              id="notes"
              placeholder="Add a note..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-destructive text-sm mb-4">{error}</p>
      )}

      <Button
        className="w-full rounded-xl py-6 text-base font-medium"
        size="lg"
        onClick={handleStart}
        disabled={loading}
      >
        {loading ? "Starting…" : "Start workout"}
      </Button>
    </div>
  );
}
