import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
})

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
})

export const createDateSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido (use YYYY-MM-DD)")
    .optional(),
})

export const createValueSchema = z.object({
  entryId: z.number().int().positive(),
  measureTypeId: z.number().int().positive(),
  value: z.number().int().positive(),
})

export const createGoalSchema = z.object({
  measureTypeId: z.number().int().positive(),
  targetValue: z.number().int().positive(),
})

export const chatMessageSchema = z.object({
  message: z.string().min(1, "Mensagem não pode estar vazia"),
})

