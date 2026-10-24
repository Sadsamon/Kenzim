import { z } from "zod";

export const placeSchema = z.object({
  name: z.string().trim().min(2, "Enter the place name").max(100),
  kind: z.enum(["attraction", "restaurant", "park", "mall", "hotel", "hospital", "school", "other"]),
  country: z.enum(["ZW", "KE"]),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  description: z.string().trim().max(2000, "The description is too long").optional().or(z.literal("")),
  lat: z.number().min(-90, "Set the location on the map").max(90),
  lng: z.number().min(-180, "Set the location on the map").max(180),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  website: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || /^https?:\/\//i.test(v), "The website must start with http:// or https://")
    .optional(),
});
