import z from "zod";
import { playerAddressSchema } from "./player.schema";

export const checkoutPayloadSchema = z.object({
  player_uuid: z.string().nullish(),
  email:z.string().nullish(),
  point_used: z.number().default(0),
  paymentType: z.enum(['COD', 'QRIS', 'TRANSFER']).default('COD'),
  address: playerAddressSchema.extend({
    uuid: z.string().nullish(),
  }),
  total: z.number(),
  subtotal: z.number(),
  note: z.string().nullish(),
  carts: z.array(z.object({
    uuid: z.string().uuid(),
    product_uuid: z.string().uuid(),
    product_name: z.string(),
    product_image: z.string(),
    product_size: z.string().nullish(),
    product_unit: z.string().nullish(),
    qty: z.number(),
    price: z.number(),
  }))
})