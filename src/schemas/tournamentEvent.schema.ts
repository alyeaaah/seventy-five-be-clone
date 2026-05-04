import { z } from "zod";

// Tournament Event Payload Schemas
export const tournamentEventCreatePayloadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  rules: z.string().optional(),
  commitment_fee: z.number().min(0).optional().default(0),
  status: z.enum(["DRAFT", "POSTPONED", "ONGOING", "ENDED", "CANCELLED"]).optional().default("DRAFT"),
  published_at: z.string().datetime().optional(),
  media_url: z.string().optional(),
});

export const tournamentEventUpdatePayloadSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  rules: z.string().optional(),
  commitment_fee: z.number().min(0).optional(),
  status: z.enum(["DRAFT", "POSTPONED", "ONGOING", "ENDED", "CANCELLED"]).optional(),
  published_at: z.string().datetime().optional(),
  media_url: z.string().optional(),
});

// Tournament Event Response Schemas
export const tournamentEventResponseSchema = z.object({
  id: z.number(),
  uuid: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  rules: z.string(),
  commitment_fee: z.number(),
  status: z.enum(["DRAFT", "POSTPONED", "ONGOING", "ENDED", "CANCELLED"]),
  published_at: z.string().datetime().nullable(),
  media_url: z.string().nullable(),
  created_by: z.string().nullable(),
  updated_by: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
});

export const tournamentEventListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(tournamentEventResponseSchema),
  message: z.string(),
});

export const tournamentEventDetailResponseSchema = z.object({
  success: z.boolean(),
  data: tournamentEventResponseSchema,
  message: z.string(),
});

export const tournamentEventCreateResponseSchema = z.object({
  success: z.boolean(),
  data: tournamentEventResponseSchema,
  message: z.string(),
});

export const tournamentEventUpdateResponseSchema = z.object({
  success: z.boolean(),
  data: tournamentEventResponseSchema,
  message: z.string(),
});

export const tournamentEventDeleteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// Query Parameters Schema
export const tournamentEventListQuerySchema = z.object({
  page: z.string().transform(Number).optional().default("1"),
  limit: z.string().transform(Number).optional().default("10"),
  search: z.string().optional(),
  status: z.enum(["DRAFT", "POSTPONED", "ONGOING", "ENDED", "CANCELLED"]).optional(),
  published: z.enum(["true", "false"]).optional(),
});

// Type exports
export type TournamentEventCreatePayload = z.infer<typeof tournamentEventCreatePayloadSchema>;
export type TournamentEventUpdatePayload = z.infer<typeof tournamentEventUpdatePayloadSchema>;
export type TournamentEventResponse = z.infer<typeof tournamentEventResponseSchema>;
export type TournamentEventListResponse = z.infer<typeof tournamentEventListResponseSchema>;
export type TournamentEventDetailResponse = z.infer<typeof tournamentEventDetailResponseSchema>;
export type TournamentEventCreateResponse = z.infer<typeof tournamentEventCreateResponseSchema>;
export type TournamentEventUpdateResponse = z.infer<typeof tournamentEventUpdateResponseSchema>;
export type TournamentEventDeleteResponse = z.infer<typeof tournamentEventDeleteResponseSchema>;
export type TournamentEventListQuery = z.infer<typeof tournamentEventListQuerySchema>;
