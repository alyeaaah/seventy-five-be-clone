import z from "zod";

export const galleryPlayersSchema = z.object({
  uuid: z.string(),
  player_uuid: z.string(),
  player_name: z.string(),
  x_percent: z.number(),
  y_percent: z.number(),
});

export const galleryPlayersPayloadSchema = z.object({
  gallery_uuid: z.string(),
  players: z.array(galleryPlayersSchema.extend({
    uuid: z.string().nullish(),
    isDeleted: z.boolean().nullish(),
  })),
})

export const galleriesMediaSchema = z.object({
  uuid: z.string(),
  name: z.string().nullish(),
  link: z.string(),
  description: z.string().nullable().nullish(),
  featured_at: z.date().nullish(),
  player_uuid: z.string().nullish(),
  playerGalleries: z.array(galleryPlayersSchema).nullish()
});