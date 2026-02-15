import { z } from "zod";

/** Matches backend UserBioCreate: height_cm (50–300), age (10–120), sex. */
export const userBioCreateSchema = z.object({
  height_cm: z.number().gt(50).lt(300),
  age: z.number().int().min(10).max(120),
  sex: z.enum(["male", "female"]),
});

/** Parsed type for creating/updating user bio. */
export type UserBioCreateInput = z.infer<typeof userBioCreateSchema>;

/** Optional measurement keys allowed by the API. */
const measurementKeys = [
  "chest", "waist", "hips", "neck", "shoulder",
  "bicep_l", "bicep_r", "forearm_l", "forearm_r",
  "thigh_l", "thigh_r", "calf_l", "calf_r",
  "wrist", "ankle",
] as const;

const measurementsSchema = z.record(z.string(), z.number().positive()).optional();

/** Matches backend BodyLogCreate. */
export const bodyLogCreateSchema = z.object({
  weight_kg: z.number().gt(20).lt(400).optional().nullable(),
  body_fat_pct: z.number().min(2).max(60).optional().nullable(),
  measurements: measurementsSchema.nullable().optional(),
});

/** Matches backend BodyLogUpdate. */
export const bodyLogUpdateSchema = z.object({
  weight_kg: z.number().gt(20).lt(400).optional().nullable(),
  body_fat_pct: z.number().min(2).max(60).optional().nullable(),
  measurements: measurementsSchema.nullable().optional(),
  created_at: z.string().optional().nullable(),
});

/** Response: user bio (GET /body/bio or PUT /body/bio). */
export const userBioSchema = z.object({
  id: z.string().uuid(),
  height_cm: z.number(),
  age: z.number().int(),
  sex: z.enum(["male", "female"]),
  created_at: z.string(),
  updated_at: z.string(),
});

/** Response: single body log. */
export const bodyLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  weight_kg: z.number(),
  body_fat_pct: z.number().nullable(),
  measurements: z.record(z.string(), z.number()).nullable(),
  computed_stats: z.record(z.string(), z.any()).nullable(),
  created_at: z.string(),
});

export type UserBioResponse = z.infer<typeof userBioSchema>;
export type BodyLogResponse = z.infer<typeof bodyLogSchema>;
