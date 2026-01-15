import * as z from "zod"

export const GigSchema = z.object({
  title: z
    .string()
    .min(5, {
      message: "O título deve ter pelo menos 5 caracteres.",
    })
    .max(100, {
      message: "O título não pode ter mais de 100 caracteres.",
    }),
  description: z
    .string()
    .min(20, {
      message: "A descrição deve ter pelo menos 20 caracteres.",
    })
    .max(2000, {
      message: "A descrição deve ter pelo menos 2000 caracteres.",
    }),
  category: z.string({
    required_error: "Por favor selecione uma categoria.",
  }),
  location: z
    .string()
    .min(3, {
      message: "A localização deve ter pelo menos 3 caracteres.",
    })
    .max(100, {
      message: "A localização não pode ter mais de 100 caracteres.",
    }),
  budget: z
    .number()
    .min(0, {
      message: "O orçamento não pode ser negativo.",
    })
    .optional(),
  deadline: z.date().optional(),
  skills: z.array(z.string()).optional(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url(),
        type: z.string(),
        size: z.number(),
      }),
    )
    .optional(),
  status: z.enum(["draft", "published", "completed", "cancelled"]).default("draft"),
})

export type GigFormValues = z.infer<typeof GigSchema>
