import { z } from "zod";

export const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Add a title (at least 3 letters)").max(120),
    category: z.enum(["kenya_club", "fun_day", "community", "embassy", "other"]),
    location: z.string().trim().max(120).optional().or(z.literal("")),
    description: z.string().trim().max(3000, "The description is too long").optional().or(z.literal("")),
    startsAt: z.string().datetime({ message: "Choose a start date and time" }),
    endsAt: z.string().datetime().optional().or(z.literal("")),
  })
  .refine((v) => !v.endsAt || new Date(v.endsAt) > new Date(v.startsAt), { message: "The end must be after the start" });
