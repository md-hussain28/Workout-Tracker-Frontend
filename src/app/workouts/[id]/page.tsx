import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { WorkoutDetailClient } from "./workout-detail-client";

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workoutId = parseInt(id, 10);
  if (Number.isNaN(workoutId)) notFound();

  let workout: Awaited<ReturnType<typeof api.workouts.get>>;
  try {
    workout = await api.workouts.get(workoutId);
  } catch {
    notFound();
  }

  const isActive = workout.ended_at == null;

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <WorkoutDetailClient
        workout={workout}
        isActive={isActive}
      />
    </div>
  );
}
