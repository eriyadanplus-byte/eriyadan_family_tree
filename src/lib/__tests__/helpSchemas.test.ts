import { describe, it, expect } from 'vitest';
import { CreateThreadSchema, SendMessageSchema, AssignHandlerSchema, GrantSchema } from '../help/schemas';

describe('help/schemas validation', () => {
  describe('CreateThreadSchema', () => {
    it('accepts valid input', () => {
      const result = CreateThreadSchema.safeParse({
        trigger_stage: 'signup_start',
        body: 'Hello I need help',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid trigger_stage', () => {
      const result = CreateThreadSchema.safeParse({
        trigger_stage: 'invalid_stage',
        body: 'test',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty body', () => {
      const result = CreateThreadSchema.safeParse({
        trigger_stage: 'signup_start',
        body: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects body exceeding 5000 chars', () => {
      const result = CreateThreadSchema.safeParse({
        trigger_stage: 'signup_start',
        body: 'x'.repeat(5001),
      });
      expect(result.success).toBe(false);
    });

    it('accepts optional context_snapshot', () => {
      const result = CreateThreadSchema.safeParse({
        trigger_stage: 'signup_final_no_match',
        body: 'I cannot find my ancestor',
        context_snapshot: { full_name: 'Ahmed', mobile: '0501234567' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('SendMessageSchema', () => {
    it('accepts valid body', () => {
      expect(SendMessageSchema.safeParse({ body: 'Hello' }).success).toBe(true);
    });

    it('rejects empty body', () => {
      expect(SendMessageSchema.safeParse({ body: '' }).success).toBe(false);
    });
  });

  describe('AssignHandlerSchema', () => {
    it('accepts a positive integer editor_user_id', () => {
      expect(AssignHandlerSchema.safeParse({ editor_user_id: 5 }).success).toBe(true);
    });

    it('accepts null to unassign', () => {
      expect(AssignHandlerSchema.safeParse({ editor_user_id: null }).success).toBe(true);
    });
  });

  describe('GrantSchema', () => {
    it('accepts a positive integer editor_user_id', () => {
      expect(GrantSchema.safeParse({ editor_user_id: 3 }).success).toBe(true);
    });

    it('rejects zero', () => {
      expect(GrantSchema.safeParse({ editor_user_id: 0 }).success).toBe(false);
    });
  });
});
