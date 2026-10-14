import { z } from "zod";
import { ResourceType, Role } from "@/generated/prisma/client";
import { BOOKING_SORTS, TIME_SLOTS } from "@/lib/config/booking-settings";
import {
  CARD_PAGE_SIZES,
  DEFAULT_CARD_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
} from "@/lib/config/pagination";
import { RESOURCE_SORTS } from "@/lib/config/resource-types";
import { USER_SORTS } from "@/lib/config/user-display";

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

// Page and rows-per-page from the URL. Bad values fall back to defaults.
// Rows per page must be one of the allowed sizes.
const sizeField = (sizes: readonly number[], fallback: number) =>
  z.coerce
    .number()
    .refine((n) => sizes.includes(n))
    .catch(fallback);

const pageFields = {
  page: z.coerce.number().int().min(1).catch(1),
  size: sizeField(PAGE_SIZES, DEFAULT_PAGE_SIZE),
};

// URL filters for the resources list. Bad values fall back to defaults.
export const resourceFilterSchema = z.object({
  q: z.string().trim().max(80).catch(""),
  type: z.enum(ResourceType).optional().catch(undefined),
  status: z.enum(["active", "inactive"]).optional().catch(undefined),
  sort: z.enum(RESOURCE_SORTS).catch("oldest"),
  ...pageFields,
});

// URL filters for the member resources page (active resources only).
export const memberResourceFilterSchema = z.object({
  q: z.string().trim().max(80).catch(""),
  type: z.enum(ResourceType).optional().catch(undefined),
  sort: z.enum(RESOURCE_SORTS).catch("oldest"),
  view: z.enum(["grid", "list"]).catch("grid"),
  page: z.coerce.number().int().min(1).catch(1),
  size: sizeField(CARD_PAGE_SIZES, DEFAULT_CARD_PAGE_SIZE),
});

// Fields shared by Add user and Edit user.
const userFields = {
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name is too long (max 80)."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(120, "Email is too long.")
    .pipe(z.email("Enter a valid email.")),
  // Text, so a leading 0 or +94 is kept (D25).
  phone: z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .regex(
        /^\+?[0-9]{9,12}$/,
        "Use digits only, e.g. 0712345678 or +94712345678.",
      )
      .nullable(),
  ),
  department: z.preprocess(
    emptyToNull,
    z.string().trim().max(60, "Department is too long (max 60).").nullable(),
  ),
  role: z.enum(Role, { error: "Choose a role." }),
};

// bcrypt only uses the first 72 bytes, so 72 is the max.
const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password is too long (max 72).");

// Add: password is required.
export const userCreateSchema = z.object({
  ...userFields,
  password: passwordRule,
});

// Edit: empty password = keep the old one.
export const userUpdateSchema = z.object({
  ...userFields,
  password: z.preprocess(emptyToNull, passwordRule.nullable()),
});

export type UserInput = z.infer<typeof userCreateSchema>;

// URL filters for the users list.
export const userFilterSchema = z.object({
  q: z.string().trim().max(80).catch(""),
  role: z.enum(Role).optional().catch(undefined),
  status: z.enum(["active", "inactive"]).optional().catch(undefined),
  sort: z.enum(USER_SORTS).catch("oldest"),
  ...pageFields,
});

// Only times from the booking slots are allowed.
const timeSlot = (message: string) =>
  z.string().refine((t) => TIME_SLOTS.includes(t), message);

// New booking. Past, too-far and overlap checks are in booking-rules.ts.
export const bookingSchema = z
  .object({
    resourceId: z.uuid("This resource no longer exists."),
    date: z.iso.date("Choose a date."),
    startTime: timeSlot("Choose a start time."),
    endTime: timeSlot("Choose an end time."),
    purpose: z
      .string()
      .trim()
      .min(3, "Purpose must be at least 3 characters.")
      .max(200, "Purpose is too long (max 200)."),
  })
  // "HH:MM" text sorts like time, so a text compare works (D20).
  .refine((b) => b.endTime > b.startTime, {
    message: "End time must be after start time.",
    path: ["endTime"],
  });

// URL filters for "My bookings". No tab = upcoming.
export const myBookingsFilterSchema = z.object({
  tab: z.enum(["past", "cancelled"]).optional().catch(undefined),
  sort: z.enum(BOOKING_SORTS).optional().catch(undefined),
  newId: z.uuid().optional().catch(undefined),
  ...pageFields,
});
