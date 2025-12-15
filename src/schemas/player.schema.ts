import z from "zod";
export const registerSchema = z.object({
  name: z.string({required_error: "Player name is required"}),
  username: z.string({required_error: "Username is required"}),
  email: z.string({required_error: "Email is required"}),
  phone: z.string({required_error: "Phone is required" })
    .min(8, "Phone must be at least 8 characters long")
    .max(15, "Phone must be at most 15 characters long")
    .refine(
      (value: string) => /^[0-9]+$/.test(value),
      "Phone can only contain numbers"
    ),
  dateOfBirth: z.string({required_error: "Date of birth is required"}),
  placeOfBirth: z.string({required_error: "Place of birth is required"}).min(2, "Place of birth is required"),
  gender: z.enum(['m', 'f'], {
    required_error: "Gender can't be empty",
    invalid_type_error: "Please select a valid gender (male or female)",
    message: "Please select a valid gender (male or female)",
  }),
}).extend({
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(32, { message: "Password must not exceed 32 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string()
}).refine(
  (data) => data.password === data.confirmPassword, 
  {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Shows error on confirmPassword field
  }
);;

export const playerAddressSchema = z.object({
  uuid: z.string(),
  player_uuid: z.string().nullish(),
  receiver_name: z.string().min(2,{message: "Name must be at least 2 characters long"}),
  phone: z.string().min(10,{message: "Phone number must be at least 10 characters long"}),
  address: z.string().min(12,{message: "Address must be at least 12 characters long"}),
  city: z.string().nullish(),
  city_id: z.number(),
  province: z.string().nullish(),
  province_id: z.number(),
  district: z.string().nullish(),
  district_id: z.number(),
  note: z.string().nullish(),
  lat: z.string().nullish(),
  long: z.string().nullish(),
});

export const playerSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  nickname: z.string(),
  username: z.string(),
  city: z.string(),
  media_url: z.string(),
  avatar_url: z.string().nullish(),
  height: z.number(),
  point: z.number(),
  gender: z.string(),
  level_uuid: z.string().nullish(),
});

const teamPlayerSchema = z.object({
  uuid: z.string(),
  id: z.number(),
  createdBy: z.string().nullish(),
  player: playerSchema,
});

export const teamSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  alias: z.string(),
  players: z.array(teamPlayerSchema),
});