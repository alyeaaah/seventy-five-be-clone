import z from "zod";
import { teamSchema } from "./player.schema";

export const tournamentSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  description: z.string(),
  media_url: z.string(),
  status: z.string(),
  type: z.string(),
  start_date: z.date(),
  end_date: z.date(),
  point_config_uuid: z.string(),
});

export const courtFieldSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  type: z.string(),
  court_uuid: z.string().nullish(),
  court_name: z.string().nullish(),
  address: z.string().nullish(),
  city: z.string().nullish(),
  lat: z.string().nullish(),
  long: z.string().nullish(),
});

export const matchSchema = z.object({
  uuid: z.string(),
  winner_team_uuid: z.string(),
  point_config_uuid: z.string().nullish(),
  home_team_score: z.number(),
  away_team_score: z.number(),
  category: z.string().nullish(),
  game_scores: z.any().nullish(),
  round: z.number(),
  with_ad: z.boolean(),
  youtube_url: z.string(),
  notes: z.string().nullish(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date().nullish(),
  id: z.number(),
  time: z.date(),
  away_team: teamSchema.nullish(),
  home_team: teamSchema.nullish(),
  tournament: tournamentSchema.nullish(),
  court_field: courtFieldSchema.nullish(),
});
export const groupResponsePlayerSchema = z.object({
  uuid: z.string().nullish(),
  name: z.string().nullish(),
  nickname: z.string().nullish(),
  username: z.string().nullish(),
  email: z.string().email().nullish(),
  city: z.string().nullish().nullish(),
  media_url: z.string().nullish(),
  avatar_url: z.string().nullish(),
  isVerified: z.boolean().nullish(),
  featured: z.any().nullish(),
  turnDate: z.string().nullish(), // ISO date string
});
const groupResponseTeamSchema = z.object({
  uuid: z.string().nullish(),
  name: z.string().nullish(),
  alias: z.string().nullish(),
  matches_won: z.number().nullish(),
  games_won: z.number().nullish(),
  point: z.number().nullish(),
  matches_played: z.number().nullish(),
  players: z.array(groupResponsePlayerSchema).nullish(),
});
export const groupResponseSchema =  z.object({
  id: z.number(),
  group_name: z.string(),
  group_uuid: z.string(),
  winner_uuid: z.string().nullish(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date().nullish(),
  teams: z.array(groupResponseTeamSchema).nullish(),
});

const matchPayloadSchema = z.object({
  uuid: z.string().nullish(),
  away_team_uuid: z.string(),
  home_team_uuid: z.string(),
  court_field_uuid: z.string(),
  time: z.string(),
  group_uuid: z.string().nullish(),
  status: z.string().nullish(),
  groupKey: z.number(),
})

export const updateGroupPayloadSchema = z.object({
  groups: z.array(z.object({
    uuid: z.string().nullish(),
    groupKey: z.number(),
    name: z.string(),
    teams: z.array(z.object({
      uuid: z.string().nullish(),
      name: z.string(),
    })),
  })),
  matches: z.array(matchPayloadSchema),
});
export type GroupResponseData = z.infer<typeof groupResponseSchema>;
export type UpdateGroupPayloadData = z.infer<typeof updateGroupPayloadSchema>;
export type MatchData = z.infer<typeof matchSchema>;
