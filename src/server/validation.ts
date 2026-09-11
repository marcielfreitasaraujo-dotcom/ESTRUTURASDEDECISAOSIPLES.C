import { z } from "zod";

export const signInSchema = z.object({
  login: z.string().trim().min(2, "Informe o usuário ou o e-mail."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export const signUpSchema = z.object({
  name: z.string().min(2, "Informe seu nome."),
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
  pizzeriaName: z.string().min(2, "Informe o nome da pizzaria."),
});

export const storeGuestSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(80, "Nome muito longo."),
  phone: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((digits) => digits.length === 10 || digits.length === 11, "Informe o telefone com DDD."),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  customerEmail: z.string().email().optional().or(z.literal("")),
  fulfillment: z.enum(["DELIVERY", "PICKUP", "DINE_IN"]),
  tableNumber: z.string().max(10).optional(),
  paymentMethod: z.enum(["PIX", "CASH", "CARD", "OTHER"]),
  notes: z.string().max(500).optional(),
  couponCode: z.string().optional(),
  street: z.string().optional(),
  addressNumber: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  reference: z.string().optional(),
  idempotencyKey: z.string().min(8),
});

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  priceCents: z.number().int().nonnegative(),
  promotionalPriceCents: z.number().int().nonnegative().nullable().optional(),
  kind: z.enum(["SIMPLE", "PIZZA", "COMBO", "BEVERAGE", "OTHER"]).optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
});
