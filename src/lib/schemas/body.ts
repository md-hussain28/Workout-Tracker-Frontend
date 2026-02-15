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

/** Accepts any UUID-shaped string (8-4-4-4-12 hex). Backend uses sentinel IDs like 00000000-0000-0000-0000-000000000001 which fail z.string().uuid() (RFC 4122 only). */
const uuidLike = z.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);

/** Response: user bio (GET /body/bio or PUT /body/bio). */
export const userBioSchema = z.object({
  id: uuidLike,
  height_cm: z.number(),
  age: z.number().int(),
  sex: z.enum(["male", "female"]),
  created_at: z.string(),
  updated_at: z.string(),
});

/** Response: single body log. */
export const bodyLogSchema = z.object({
  id: uuidLike,
  user_id: uuidLike,
  weight_kg: z.number(),
  body_fat_pct: z.number().nullable(),
  measurements: z.record(z.string(), z.number()).nullable(),
  computed_stats: z.record(z.string(), z.any()).nullable(),
  created_at: z.string(),
});

export type UserBioResponse = z.infer<typeof userBioSchema>;
export type BodyLogResponse = z.infer<typeof bodyLogSchema>;
