import { z } from "zod";

// Clean the email first, then check that it looks like an email.
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email.")),
  password: z.string().min(1, "Enter your password.").max(100, "Password is too long."),
});