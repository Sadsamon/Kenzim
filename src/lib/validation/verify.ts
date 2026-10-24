import { z } from "zod";

const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ]{8,20}$/, "Enter a phone number, e.g. +263 77 123 4567");

export const identitySchema = z.object({
  docType: z.enum(["passport", "kenyan_id"], { message: "Choose a document type" }),
  idNumber: z
    .string()
    .trim()
    .min(5, "Enter the full document number")
    .max(20, "That number is too long")
    .regex(/^[A-Za-z0-9 -]+$/, "Use letters and numbers only"),
});

export const employmentSchema = z.object({
  occupation: z.string().trim().min(2, "Enter your occupation").max(80),
  employer: z.string().trim().max(100).optional().or(z.literal("")),
  workCity: z.string().trim().max(60).optional().or(z.literal("")),
  workPhone: z.string().trim().regex(/^(\+?[0-9 ]{8,20})?$/, "Enter a valid phone number").optional(),
});

const contact = z.object({
  fullName: z.string().trim().min(2, "Enter a full name").max(80),
  relationship: z.string().trim().min(2, "Enter the relationship").max(40),
  phone,
  address: z.string().trim().max(200).optional().or(z.literal("")),
});
export const emergencySchema = z.object({ kenya: contact, zim: contact });

export const familySchema = z.object({
  fullName: z.string().trim().min(2, "Enter a name").max(80),
  relationship: z.string().trim().min(2, "Enter the relationship").max(40),
  birthDate: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use a valid date").optional(),
  anniversaryDate: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use a valid date").optional(),
  birthdayOptIn: z.boolean(),
});

export const contactSchema = z.object({
  phone: z.string().trim().regex(/^\+?[0-9 ]{8,20}$/, "Enter your phone number, e.g. +263 77 123 4567"),
  cityZw: z.string().trim().min(2, "Enter your city or town in Zimbabwe").max(60),
});
