import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").min(3, "Name must be at least 3 characters").max(100, "Name must be 100 characters or fewer"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateRoleSchema = z.object({
  role: z.enum(["admin", "agent"], { message: "role must be admin or agent" }),
});

export const editUserSchema = z.object({
  name: z.string().min(1, "Name is required").min(3, "Name must be at least 3 characters").max(100, "Name must be 100 characters or fewer"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters").or(z.literal("")).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type EditUserInput = z.infer<typeof editUserSchema>;
