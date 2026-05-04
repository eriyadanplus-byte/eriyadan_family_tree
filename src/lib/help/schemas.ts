import { z } from 'zod';

export const CreateThreadSchema = z.object({
  trigger_stage: z.enum(['signup_start', 'signup_final_no_match', 'contact_form']),
  inquiry_kind: z.enum(['general', 'contact_form']).optional(),
  body: z.string().min(1).max(5000),
  context_snapshot: z.record(z.string(), z.unknown()).optional(),
  ancestor_name: z.string().max(255).optional(),
  place: z.string().max(255).optional(),
  contact_number: z.string().max(32).optional(),
  whatsapp_number: z.string().max(32).optional(),
});

export const SendMessageSchema = z.object({
  body: z.string().min(1).max(5000),
});

export const AssignHandlerSchema = z.object({
  editor_user_id: z.number().nullable(),
});

export const GrantSchema = z.object({
  editor_user_id: z.number().positive(),
});

export type CreateThreadInput = z.infer<typeof CreateThreadSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
