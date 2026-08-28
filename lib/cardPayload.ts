const DISTRACTOR_MARK = '\n\n⟦ACUMEN_D⟧';
export const STUDY_NOTES_HEADING = "What you'll learn:";

export function decodeCardBack(stored: string): { answer: string; distractors: string[] } {
  const raw = stored || '';
  const idx = raw.indexOf(DISTRACTOR_MARK);
  if (idx < 0) return { answer: raw.trim(), distractors: [] };
  const answer = raw.slice(0, idx).trim();
  try {
    const parsed = JSON.parse(raw.slice(idx + DISTRACTOR_MARK.length));
    if (Array.isArray(parsed)) {
      return {
        answer,
        distractors: parsed.map((x) => String(x).trim()).filter(Boolean).slice(0, 3),
      };
    }
  } catch {
    // ignore malformed payload
  }
  return { answer, distractors: [] };
}

export function parseStudyNotes(description: string | null | undefined): string[] {
  const text = (description || '').trim();
  if (!text.includes(STUDY_NOTES_HEADING)) return [];
  const tail = text.split(STUDY_NOTES_HEADING)[1] ?? '';
  return tail
    .split('\n')
    .map((line) => line.replace(/^[•\-\*]\s*/, '').trim())
    .filter(Boolean);
}
