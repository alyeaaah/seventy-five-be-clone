import z from "zod";

// Team schema for match relations
const teamSchema = z.object({
  uuid: z.string(),
  name: z.string(),
}).nullable();

// Tournament schema for match relations  
const tournamentSchema = z.object({
  uuid: z.string(),
  name: z.string(),
}).nullable();

// Court field schema for match relations
const courtFieldSchema = z.object({
  uuid: z.string(),
  name: z.string(),
}).nullable();

// Match status schema
const matchStatusSchema = z.enum(["UPCOMING", "ONGOING", "PAUSED", "ENDED"]);

// Match data schema compatible with frontend
export const MatchDataSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  tournament_uuid: z.string().nullable(),
  court_field_uuid: z.string().nullable(),
  home_team_uuid: z.string(),
  away_team_uuid: z.string(),
  winner_team_uuid: z.string().nullable(),
  home_team_score: z.number(),
  away_team_score: z.number(),
  game_scores: z.any().nullable(),
  round: z.number().nullable(),
  seed_index: z.number().nullable(),
  category: z.string().nullable(),
  with_ad: z.boolean(),
  youtube_url: z.string().nullable(),
  time: z.string().nullable(),
  point_config_uuid: z.string().nullable(),
  notes: z.string().nullable(),
  status: matchStatusSchema.nullable(),
  race_to: z.number(),
  draft_pick: z.boolean(),
  createdBy: z.string().nullable(),
  deletedBy: z.string().nullable(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Relations
  tournament: tournamentSchema.nullable(),
  home_team: teamSchema.nullable(),
  away_team: teamSchema.nullable(),
  winner: teamSchema.nullable(),
  court_field: courtFieldSchema.nullable(),
});

export type MatchData = z.infer<typeof MatchDataSchema>;
