import { z } from "zod";

export const expenseSchema = z
  .object({
    purchase_date: z.string().min(1, "Date is required"),
    amount: z.number().positive("Amount must be greater than zero"),
    has_receipt: z.boolean(),
    no_receipt_reason: z.string().optional(),
  })
  .refine(
    (data) => data.has_receipt || (data.no_receipt_reason && data.no_receipt_reason.trim().length >= 5),
    { message: "Please provide a brief explanation (at least 5 characters) when no receipt is available", path: ["no_receipt_reason"] }
  );

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Full name is required"),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
