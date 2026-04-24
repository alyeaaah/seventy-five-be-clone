import z from "zod";

// Player data schema compatible with frontend
export const PlayerDataSchema = z.object({
  id: z.number(),
  uuid: z.string(),
  name: z.string(),
  username: z.string(),
  email: z.string().nullable(),
  phone: z.string(),
  dateOfBirth: z.string().nullable(),
  placeOfBirth: z.string().nullable(),
  gender: z.enum(['m', 'f']),
  photo: z.string().nullable(),
  isReferee: z.boolean(),
  league_id: z.number().nullable(),
  point: z.number().nullable(),
  height: z.number().nullable(),
  city: z.string().nullable(),
  address: z.string().nullable(),
  nickname: z.string().nullable(),
  media_url: z.string().nullable(),
  avatar_url: z.string().nullable(),
  isVerified: z.boolean(),
  turnDate: z.string().nullable(),
  skills: z.object({
    forehand: z.number(),
    backhand: z.number(),
    serve: z.number(),
    volley: z.number(),
    overhead: z.number(),
  }).nullable(),
  playstyleForehand: z.enum(['RIGHT', 'LEFT']).nullable(),
  playstyleBackhand: z.enum(['One Handed', 'Double Handed']).nullable(),
  socialMediaIg: z.string().nullable(),
  socialMediaX: z.string().nullable(),
  level: z.string().nullable(),
  level_uuid: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  deletedBy: z.string().nullable(),
  // Relations
  user: z.object({
    id: z.number(),
    uuid: z.string(),
    email: z.string(),
    username: z.string(),
  }).optional(),
  league: z.object({
    id: z.number(),
    name: z.string(),
  }).optional(),
});

export type PlayerData = z.infer<typeof PlayerDataSchema>;
