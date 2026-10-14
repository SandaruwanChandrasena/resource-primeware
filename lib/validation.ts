import { z } from "zod";
import { ResourceType } from "@/generated/prisma/client";

// Clean the email first, then check that it looks like an email.
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email.")),
  password: z
    .string()
    .min(1, "Enter your password.")
    .max(100, "Password is too long."),
});

// An empty text box means "no value", so store null.
const emptyToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value;

export const resourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name is too long (max 80)."),
  type: z.enum(ResourceType, { error: "Choose a type." }),
  location: z
    .string()
    .trim()
    .min(2, "Location must be at least 2 characters.")
    .max(100, "Location is too long (max 100)."),
  capacity: z.preprocess(
    emptyToNull,
    z.coerce
      .number({ error: "Capacity must be a number." })
      .int("Capacity must be a whole number.")
      .positive("Capacity must be more than 0.")
      .max(10000, "Capacity is too large.")
      .nullable(),
  ),
  description: z.preprocess(
    emptyToNull,
    z.string().trim().max(300, "Description is too long (max 300).").nullable(),
  ),
});

export type ResourceInput = z.infer<typeof resourceSchema>;
