const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function fetchApi<T>(
  path: string,
  options?: RequestInit & { params?: Record<string, string | number | undefined> }
): Promise<T> {
  const { params, ...init } = options ?? {};
  const url = new URL(path.startsWith("http") ? path : `${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString(), {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(Array.isArray(err.detail) ? err.detail[0]?.msg : err.detail ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  health: () => fetchApi<{ status: string }>("/health"),
  workouts: {
    list: (skip = 0, limit = 50) =>
      fetchApi<Workout[]>(`/workouts`, { params: { skip, limit } }),
    get: (id: number) => fetchApi<WorkoutWithSets>(`/workouts/${id}`),
    create: (body: { notes?: string }) =>
      fetchApi<Workout>(`/workouts`, { method: "POST", body: JSON.stringify(body) }),
    update: (id: number, body: { ended_at?: string; duration_seconds?: number; notes?: string }) =>
      fetchApi<Workout>(`/workouts/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: number) =>
      fetchApi<void>(`/workouts/${id}`, { method: "DELETE" }),
    addSet: (workoutId: number, body: WorkoutSetCreate) =>
      fetchApi<WorkoutSet>(`/workouts/${workoutId}/sets`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },
  exercises: {
    list: (skip = 0, limit = 200) =>
      fetchApi<Exercise[]>(`/exercises`, { params: { skip, limit } }),
    get: (id: number) => fetchApi<Exercise>(`/exercises/${id}`),
    create: (body: ExerciseCreate) =>
      fetchApi<Exercise>(`/exercises`, { method: "POST", body: JSON.stringify(body) }),
    update: (id: number, body: Partial<ExerciseCreate>) =>
      fetchApi<Exercise>(`/exercises/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: number) =>
      fetchApi<void>(`/exercises/${id}`, { method: "DELETE" }),
  },
  muscleGroups: {
    list: () => fetchApi<MuscleGroup[]>(`/muscle-groups`),
  },
  previousSession: {
    get: (exerciseId: number, excludeWorkoutId?: number) =>
      fetchApi<PreviousSession>(`/previous-session/exercises/${exerciseId}/previous-session`, {
        params: excludeWorkoutId != null ? { exclude_workout_id: excludeWorkoutId } : undefined,
      }),
  },
  templates: {
    list: () => fetchApi<WorkoutTemplate[]>(`/templates`),
    get: (id: number) => fetchApi<WorkoutTemplate>(`/templates/${id}`),
    create: (body: { name: string }) =>
      fetchApi<WorkoutTemplate>(`/templates`, { method: "POST", body: JSON.stringify(body) }),
    createFromWorkout: (body: { name: string; workout_id: number }) =>
      fetchApi<WorkoutTemplate>(`/templates/from-workout`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: number, body: { name?: string }) =>
      fetchApi<WorkoutTemplate>(`/templates/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: number) =>
      fetchApi<void>(`/templates/${id}`, { method: "DELETE" }),
    instantiate: (id: number) =>
      fetchApi<{ workout_id: number; started_at: string | null; exercise_order: number[] }>(
        `/templates/${id}/instantiate`,
        { method: "POST" }
      ),
  },
  analytics: {
    muscleVolume: (from_date?: string, to_date?: string) =>
      fetchApi<MuscleVolumeResponse>(`/analytics/muscle-volume`, {
        params: { from_date, to_date },
      }),
    oneRm: (exerciseId: number, from_date?: string, to_date?: string, formula = "brzycki") =>
      fetchApi<OneRmResponse>(`/analytics/one-rm/${exerciseId}`, {
        params: { from_date, to_date, formula },
      }),
    tonnage: (from_date?: string, to_date?: string) =>
      fetchApi<TonnageResponse>(`/analytics/tonnage`, { params: { from_date, to_date } }),
    consistency: (year: number, month?: number) =>
      fetchApi<ConsistencyResponse>(`/analytics/consistency`, {
        params: { year, month },
      }),
  },
  pr: {
    trophyRoom: (period: "month" | "year" = "month") =>
      fetchApi<PrTrophyRoom>(`/pr/trophy-room`, { params: { period } }),
  },
};

// Types (match backend schemas)
export type MeasurementMode = "weight_reps" | "time" | "bodyweight_reps";
export type SetLabel = "warmup" | "working" | "failure" | "drop_set";
export type PRType = "weight" | "volume" | "duration";

export interface MuscleGroup {
  id: number;
  name: string;
}

export interface Exercise {
  id: number;
  name: string;
  description: string | null;
  unit: string;
  measurement_mode: MeasurementMode;
  rest_seconds_preset: number | null;
  primary_muscle_group_id: number | null;
  secondary_muscle_group_id: number | null;
  tertiary_muscle_group_id: number | null;
  primary_muscle_group: MuscleGroup | null;
  secondary_muscle_group: MuscleGroup | null;
  tertiary_muscle_group: MuscleGroup | null;
}

export interface ExerciseCreate {
  name: string;
  description?: string | null;
  unit?: string;
  measurement_mode?: MeasurementMode;
  rest_seconds_preset?: number | null;
  primary_muscle_group_id?: number | null;
  secondary_muscle_group_id?: number | null;
  tertiary_muscle_group_id?: number | null;
}

export interface WorkoutSet {
  id: number;
  workout_id: number;
  exercise_id: number;
  set_order: number;
  weight: number | null;
  reps: number | null;
  duration_seconds: number | null;
  notes: string | null;
  set_label: SetLabel | null;
  is_pr: boolean;
  pr_type: PRType | null;
  exercise?: Exercise;
}

export interface WorkoutSetCreate {
  exercise_id: number;
  set_order?: number;
  weight?: number | null;
  reps?: number | null;
  duration_seconds?: number | null;
  notes?: string | null;
  set_label?: SetLabel | null;
}

export interface Workout {
  id: number;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  notes: string | null;
  sets?: WorkoutSet[];
}

export interface WorkoutWithSets extends Workout {
  sets: (WorkoutSet & { exercise?: Exercise })[];
}

export interface TemplateExerciseRead {
  id: number;
  template_id: number;
  exercise_id: number;
  order_in_template: number;
  exercise: Exercise | null;
}

export interface WorkoutTemplate {
  id: number;
  name: string;
  created_at: string;
  exercises: TemplateExerciseRead[];
}

export interface PreviousSession {
  workout_id: number | null;
  workout_started_at?: string;
  sets: { id: number; set_order: number; weight: number | null; reps: number | null; duration_seconds: number | null; set_label: string | null }[];
}

export interface MuscleVolumeResponse {
  from: string | null;
  to: string | null;
  muscle_groups: { muscle_group_id: number; name: string; volume: number }[];
}

export interface OneRmResponse {
  exercise_id: number;
  formula: string;
  points: { date: string | null; estimated_1rm: number }[];
}

export interface TonnageResponse {
  from: string | null;
  to: string | null;
  workouts: { workout_id: number; started_at: string | null; tonnage: number }[];
}

export interface ConsistencyResponse {
  year: number;
  month: number | null;
  days: { date: string; duration_seconds: number | null; tonnage: number }[];
}

export interface PrTrophyRoom {
  period: string;
  from: string;
  to: string;
  count: number;
  records: {
    set_id: number;
    workout_id: number;
    workout_started_at: string | null;
    exercise_id: number;
    exercise_name: string | null;
    pr_type: string | null;
    weight: number | null;
    reps: number | null;
    duration_seconds: number | null;
  }[];
}
