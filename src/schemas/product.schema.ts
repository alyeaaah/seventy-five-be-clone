import z from "zod";

export const ProductDetailSchema = z.object({
  uuid: z.string(),
  product_uuid: z.string().nullish(),
  size: z.string(),
  price: z.number(),
  quantity: z.number(),
  id: z.number(),
});

// Schema for product galleries
const ProductGallerySchema = z.object({
  uuid: z.string().uuid(),
  link: z.string().url({message: "Invalid Image"}),
  name: z.string(),
});

export const merchProductsItemSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  description: z.string(),
  unit: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']), // Adjust based on possible statuses
  createdAt: z.string(),
  id: z.number(),
  media_url: z.string().nullish(),
  createdBy: z.string().nullish(),
  details: z.array(ProductDetailSchema),
  galleries: z.array(ProductGallerySchema),
  image_cover: z.string(),
  featured_at: z.string().nullish(),
});

export const cartProductDetailSchema = ProductDetailSchema.extend({
  qty: z.number().default(1),
})

export const cartProductSchema = merchProductsItemSchema.extend({
  details: z.array(cartProductDetailSchema)
})

export type CartProductSchema = z.infer<typeof cartProductSchema>;
export type CartProductDetailSchema = z.infer<typeof cartProductDetailSchema>;
