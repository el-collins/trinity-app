export const MAX_QUESTION_CHARS = 500;
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

type Result =
  | { ok: true; value: { loanTypeId: string; question: string; fieldId?: string } }
  | { ok: false; error: string };

export function validateAskInput(body: unknown): Result {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }
  const { loanTypeId, question, fieldId } = body as Record<string, unknown>;

  if (typeof loanTypeId !== 'string' || !ID_RE.test(loanTypeId)) {
    return { ok: false, error: 'loanTypeId is required' };
  }
  if (typeof question !== 'string') {
    return { ok: false, error: 'question must be a string' };
  }
  const trimmed = question.trim();
  if (trimmed.length === 0) return { ok: false, error: 'question must not be empty' };
  if (trimmed.length > MAX_QUESTION_CHARS) {
    return { ok: false, error: `question must be at most ${MAX_QUESTION_CHARS} characters` };
  }
  if (fieldId !== undefined && (typeof fieldId !== 'string' || !ID_RE.test(fieldId))) {
    return { ok: false, error: 'fieldId is invalid' };
  }
  return { ok: true, value: { loanTypeId, question: trimmed, ...(fieldId ? { fieldId: fieldId as string } : {}) } };
}
