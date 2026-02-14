const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof process.env.NEXT_PUBLIC_VERCEL_URL === "string"
    ? "https://workout-tracker-backend-ahka.onrender.com/api/v1"
    : "http://localhost:8000/api/v1");

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

  streak: {
    get: () => fetchApi<StreakResponse>(`/streak`),
  },

  workouts: {
    list: (skip = 0, limit = 50, from_date?: string, to_date?: string) =>
      fetchApi<Workout[]>(`/workouts`, { params: { skip, limit, from_date, to_date } }),
    get: (id: string) => fetchApi<WorkoutWithSets>(`/workouts/${id}`),
    create: (body: { notes?: string }) =>
      fetchApi<Workout>(`/workouts`, { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: { started_at?: string; ended_at?: string; duration_seconds?: number; notes?: string }) =>
      fetchApi<Workout>(`/workouts/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) =>
      fetchApi<void>(`/workouts/${id}`, { method: "DELETE" }),
    addSet: (workoutId: string, body: WorkoutSetCreate) =>
      fetchApi<WorkoutSet>(`/workouts/${workoutId}/sets`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    updateSet: (workoutId: string, setId: string, body: WorkoutSetUpdate) =>
      fetchApi<WorkoutSet>(`/workouts/${workoutId}/sets/${setId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    deleteSet: (workoutId: string, setId: string) =>
      fetchApi<void>(`/workouts/${workoutId}/sets/${setId}`, { method: "DELETE" }),
  },

  exercises: {
    list: (skip = 0, limit = 200) =>
      fetchApi<Exercise[]>(`/exercises`, { params: { skip, limit } }),
    get: (id: string) => fetchApi<Exercise>(`/exercises/${id}`),
    getStats: (id: string) => fetchApi<ExerciseStatsResponse>(`/exercises/${id}/stats`),
    create: (body: ExerciseCreate) =>
      fetchApi<Exercise>(`/exercises`, { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<ExerciseCreate>) =>
      fetchApi<Exercise>(`/exercises/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) =>
      fetchApi<void>(`/exercises/${id}`, { method: "DELETE" }),
  },

  muscleGroups: {
    list: () => fetchApi<MuscleGroup[]>(`/muscle-groups`),
    create: (body: { name: string; color?: string | null }) =>
      fetchApi<MuscleGroup>(`/muscle-groups`, { method: "POST", body: JSON.stringify(body) }),
    get: (id: string) => fetchApi<MuscleGroup>(`/muscle-groups/${id}`),
    update: (id: string, body: { name?: string; color?: string | null }) =>
      fetchApi<MuscleGroup>(`/muscle-groups/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) =>
      fetchApi<void>(`/muscle-groups/${id}`, { method: "DELETE" }),
    getStats: (id: string) => fetchApi<MuscleGroupStats>(`/muscle-groups/${id}/stats`),
  },

  previousSession: {
    get: (exerciseId: string, excludeWorkoutId?: string) =>
      fetchApi<PreviousSession>(`/previous-session/exercises/${exerciseId}/previous-session`, {
        params: excludeWorkoutId != null ? { exclude_workout_id: excludeWorkoutId } : undefined,
      }),
  },

  templates: {
    list: () => fetchApi<WorkoutTemplate[]>(`/templates`),
    get: (id: string) => fetchApi<WorkoutTemplate>(`/templates/${id}`),
    create: (body: { name: string }) =>
      fetchApi<WorkoutTemplate>(`/templates`, { method: "POST", body: JSON.stringify(body) }),
    createFromWorkout: (body: { name: string; workout_id: string }) =>
      fetchApi<WorkoutTemplate>(`/templates/from-workout`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: { name?: string }) =>
      fetchApi<WorkoutTemplate>(`/templates/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) =>
      fetchApi<void>(`/templates/${id}`, { method: "DELETE" }),
    instantiate: (id: string) =>
      fetchApi<{ workout_id: string; started_at: string | null; exercise_order: number[] }>(
        `/templates/${id}/instantiate`,
        { method: "POST" }
      ),
  },

  analytics: {
    muscleVolume: (from_date?: string, to_date?: string) =>
      fetchApi<MuscleVolumeResponse>(`/analytics/muscle-volume`, {
        params: { from_date, to_date },
      }),
    oneRm: (exerciseId: string, from_date?: string, to_date?: string, formula = "brzycki") =>
      fetchApi<OneRmResponse>(`/analytics/one-rm/${exerciseId}`, {
        params: { from_date, to_date, formula },
      }),
    tonnage: (from_date?: string, to_date?: string) =>
      fetchApi<TonnageResponse>(`/analytics/tonnage`, { params: { from_date, to_date } }),
    consistency: (year: number, month?: number) =>
      fetchApi<ConsistencyResponse>(`/analytics/consistency`, {
        params: { year, month },
      }),
    volumeHistory: (from_date?: string, to_date?: string) =>
      fetchApi<any[]>(`/analytics/volume-history-by-muscle`, { params: { from_date, to_date } }),
    muscleDistribution: (from_date?: string, to_date?: string) =>
      fetchApi<{ name: string; value: number }[]>(`/analytics/muscle-distribution`, {
        params: { from_date, to_date },
      }),
    workoutDensity: (from_date?: string, to_date?: string) =>
      fetchApi<any[]>(`/analytics/workout-density`, { params: { from_date, to_date } }),
    plateauRadar: () => fetchApi<any[]>(`/analytics/plateau-radar`),
    recovery: () =>
      fetchApi<RecoveryResponse>(`/analytics/recovery`),
  },

  body: {
    getBio: () => fetchApi<UserBio | null>(`/body/bio`),
    upsertBio: (data: UserBioCreate) =>
      fetchApi<UserBio>(`/body/bio`, { method: "PUT", body: JSON.stringify(data) }),
    createLog: (data: BodyLogCreate) =>
      fetchApi<BodyLog>(`/body/log`, { method: "POST", body: JSON.stringify(data) }),
    listLogs: (days?: number) =>
      fetchApi<BodyLog[]>(`/body/log`, { params: days != null ? { days } : undefined }),
    getLatest: () => fetchApi<BodyLog | null>(`/body/log/latest`),
    updateLog: (id: string, data: BodyLogUpdate) =>
      fetchApi<BodyLog>(`/body/log/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteLog: (id: string) =>
      fetchApi<void>(`/body/log/${id}`, { method: "DELETE" }),
  },

  pr: {
    trophyRoom: (period: "month" | "year" = "month") =>
      fetchApi<PrTrophyRoom>(`/pr/trophy-room`, { params: { period } }),
  },
};

// ── Types ──

export type MeasurementMode = "weight_reps" | "time" | "bodyweight_reps";
export type SetLabel = "warmup" | "working" | "failure" | "drop_set";
export type PRType = "weight" | "volume" | "duration";

export interface StreakResponse {
  current_streak: number;
  longest_streak: number;
  last_workout_date: string | null;
}

export interface MuscleGroup {
  id: string;
  name: string;
  color: string | null;
}

export interface Exercise {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  measurement_mode: MeasurementMode;
  rest_seconds_preset: number | null;
  primary_muscle_group_id: string | null;
  secondary_muscle_group_id: string | null;
  tertiary_muscle_group_id: string | null;
  primary_muscle_group: MuscleGroup | null;
  secondary_muscle_group: MuscleGroup | null;
  tertiary_muscle_group: MuscleGroup | null;
}

export interface MuscleGroupStats {
  id: string;
  name: string;
  color: string | null;
  total_workouts: number;
  total_sets: number;
  total_volume: number;
  role_distribution: {
    primary: number;
    secondary: number;
    tertiary: number;
  };
  volume_history: { date: string; volume: number }[];
  top_exercises: {
    id: string;
    name: string;
    volume: number;
    set_count: number;
  }[];
}

export interface ExerciseCreate {
  name: string;
  description?: string | null;
  unit?: string;
  measurement_mode?: MeasurementMode;
  rest_seconds_preset?: number | null;
  primary_muscle_group_id?: string | null;
  secondary_muscle_group_id?: string | null;
  tertiary_muscle_group_id?: string | null;
}

export interface ExerciseStatsResponse {
  exercise_id: string;
  total_sets: number;
  total_workouts: number;
  first_performed: string | null;
  last_performed: string | null;
  prs: {
    best_weight: number | null;
    best_reps: number | null;
    best_volume: number | null;
    best_1rm: number | null;
    best_duration: number | null;
  };
  set_label_distribution: { label: string; count: number }[];
  one_rm_progression: { date: string; estimated_1rm: number }[];
  volume_history: { date: string; volume: number }[];
  max_weight_history: { date: string; weight: number }[];
  recent_history: {
    workout_id: string;
    started_at: string | null;
    sets: {
      set_order: number;
      weight: number | null;
      reps: number | null;
      duration_seconds: number | null;
      set_label: string | null;
      is_pr: boolean;
    }[];
  }[];
}

export interface WorkoutSet {
  id: string;
  workout_id: string;
  exercise_id: string;
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
  exercise_id: string;
  set_order?: number;
  weight?: number | null;
  reps?: number | null;
  duration_seconds?: number | null;
  notes?: string | null;
  set_label?: SetLabel | null;
}

export interface WorkoutSetUpdate {
  weight?: number | null;
  reps?: number | null;
  duration_seconds?: number | null;
  notes?: string | null;
  set_label?: SetLabel | null;
}

export interface Workout {
  id: string;
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
  id: string;
  template_id: string;
  exercise_id: string;
  order_in_template: number;
  exercise: Exercise | null;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  created_at: string;
  exercises: TemplateExerciseRead[];
}

export interface PreviousSession {
  workout_id: string | null;
  workout_started_at?: string;
  sets: { id: string; set_order: number; weight: number | null; reps: number | null; duration_seconds: number | null; set_label: string | null }[];
}

export interface MuscleVolumeResponse {
  from: string | null;
  to: string | null;
  muscle_groups: { muscle_group_id: string; name: string; volume: number }[];
}

export interface OneRmResponse {
  exercise_id: string;
  formula: string;
  points: { date: string | null; estimated_1rm: number }[];
}

export interface TonnageResponse {
  from: string | null;
  to: string | null;
  workouts: { workout_id: string; started_at: string | null; tonnage: number }[];
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
    set_id: string;
    workout_id: string;
    workout_started_at: string | null;
    exercise_id: string;
    exercise_name: string | null;
    pr_type: string | null;
    weight: number | null;
    reps: number | null;
    duration_seconds: number | null;
  }[];
}

export interface RecoveryMuscle {
  key: string;
  name: string;
  fatigue_score: number;
  overstrained: boolean;
}

export interface RecoveryResponse {
  muscles: RecoveryMuscle[];
}

// ── Body Analytics Types ──

export interface UserBio {
  id: string;
  height_cm: number;
  age: number;
  sex: "male" | "female";
  created_at: string;
  updated_at: string;
}

export interface UserBioCreate {
  height_cm: number;
  age: number;
  sex: "male" | "female";
}

export interface Measurements {
  chest?: number;
  waist?: number;
  hips?: number;
  neck?: number;
  shoulder?: number;
  bicep_l?: number;
  bicep_r?: number;
  forearm_l?: number;
  forearm_r?: number;
  thigh_l?: number;
  thigh_r?: number;
  calf_l?: number;
  calf_r?: number;
  wrist?: number;
  ankle?: number;
}

export interface ComputedStats {
  bmr: number | null;
  bf_navy: number | null;
  ffmi: number | null;
  percentiles: Record<string, number>;
  aesthetic_rank: number | null;
  symmetry: Record<string, { left: number; right: number; ratio: number; delta: number }>;
}

export interface BodyLog {
  id: string;
  user_id: string;
  weight_kg: number;
  body_fat_pct: number | null;
  measurements: Measurements | null;
  computed_stats: ComputedStats | null;
  created_at: string;
}

export interface BodyLogCreate {
  weight_kg?: number | null;
  body_fat_pct?: number | null;
  measurements?: Measurements | null;
}

export interface BodyLogUpdate {
  weight_kg?: number | null;
  body_fat_pct?: number | null;
  measurements?: Measurements | null;
  created_at?: string | null;
}

