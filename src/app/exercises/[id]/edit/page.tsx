import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { ExerciseEditForm } from "./exercise-edit-form";

export default async function ExerciseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exerciseId = parseInt(id, 10);
  if (Number.isNaN(exerciseId)) notFound();

  let exercise: Awaited<ReturnType<typeof api.exercises.get>>;
  try {
    exercise = await api.exercises.get(exerciseId);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Edit exercise</h1>
      <ExerciseEditForm exercise={exercise} />
    </div>
  );
}
