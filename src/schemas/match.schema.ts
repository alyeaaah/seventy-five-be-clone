import z from "zod";

export const MatchStatusEnum = z.enum(["UPCOMING", "ONGOING", "PAUSED", "ENDED"]);

export const updateMatchPayloadSchema = z.object({
  uuid: z.string().nullish(),
  id: z.number().nullish(),
  home_team_uuid: z.string(),
  away_team_uuid: z.string(),
  court_field_uuid: z.string().nullable().nullish(),
  status: MatchStatusEnum,
  time: z.string().nullish(), // Will be converted to Date in the service
  round: z.number(),
  group: z.number(), // maps to tournament_group_index
  seed_index: z.number().nullish(),
  home_group_index: z.number().nullish(),
  home_group_position: z.number().nullish(),
  away_group_index: z.number().nullish(),
  away_group_position: z.number().nullish(),
});

export const updateMultipleMatchesPayloadSchema = z.object({
  tournament_uuid: z.string(),
  matches: z.array(updateMatchPayloadSchema),
});

export type UpdateMatchPayload = z.infer<typeof updateMatchPayloadSchema>;
export type UpdateMultipleMatchesPayload = z.infer<typeof updateMultipleMatchesPayloadSchema>;

