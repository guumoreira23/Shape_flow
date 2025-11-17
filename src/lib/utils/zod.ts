import { z } from "zod"

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .toLowerCase()
    .trim(),
  password: z.string().min(1, "Senha é obrigatória"),
})

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email é obrigatório")
      .email("Email inválido")
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(6, "Senha deve ter no mínimo 6 caracteres")
      .max(100, "Senha muito longa"),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
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
  entryId: z.number().int().positive("ID da entrada inválido"),
  measureTypeId: z.number().int().positive("ID da medida inválido"),
  value: z
    .number()
    .int("Valor deve ser um número inteiro")
    .positive("Valor deve ser positivo")
    .max(999999, "Valor muito grande"),
})

export const createGoalSchema = z.object({
  measureTypeId: z.number().int().positive("ID da medida inválido"),
  targetValue: z
    .number()
    .int("Meta deve ser um número inteiro")
    .positive("Meta deve ser positiva")
    .max(999999, "Meta muito grande"),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido (use YYYY-MM-DD)")
    .optional(),
})

export const createMeasureTypeSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(50, "Nome muito longo")
    .trim(),
  unit: z
    .string()
    .min(1, "Unidade é obrigatória")
    .max(10, "Unidade muito longa")
    .trim(),
})

export const chatMessageSchema = z.object({
  message: z.string().min(1, "Mensagem não pode estar vazia"),
})

