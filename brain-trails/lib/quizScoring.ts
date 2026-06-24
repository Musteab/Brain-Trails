// Robust quiz answer matching. The AI is inconsistent about how it returns
// `correct_answer` for multiple-choice: sometimes the full option text
// ("Paris"), sometimes a bare letter ("A"/"B"), sometimes a letter-prefixed
// string ("A) Paris"). The options buttons always hold the full text, so a
// naive `selected === correct_answer` comparison marks right answers wrong.
// These helpers normalize all of that.

export interface ScorableQuestion {
  type: "mcq" | "true_false" | "fill_blank" | "short_answer";
  options?: string[];
  correct_answer: string;
}

/** Lowercase, trim, and strip a leading "A) " / "B. " / "c: " option label. */
function normalize(s: string): string {
  return (s || "").toLowerCase().trim().replace(/^[a-d]\s*[).:\-]\s*/i, "");
}

/** "A" / "b)" / "C." -> 0/1/2, else -1. */
function letterToIndex(s: string): number {
  const m = (s || "").trim().match(/^([a-z])\s*[).:\-]?$/i);
  return m ? m[1].toUpperCase().charCodeAt(0) - 65 : -1;
}

/** The canonical correct option *text* for an mcq/true_false question. */
export function resolveCorrectOption(q: ScorableQuestion): string {
  if (!q.options || q.options.length === 0) return q.correct_answer;
  const c = (q.correct_answer || "").trim();

  // Direct (normalized) text match against an option.
  const direct = q.options.find((o) => normalize(o) === normalize(c));
  if (direct) return direct;

  // Bare/labelled letter -> option at that index.
  const li = letterToIndex(c);
  if (li >= 0 && q.options[li] !== undefined) return q.options[li];

  return q.correct_answer;
}

/** Whether a given answer (option text or typed text) is correct. */
export function isAnswerCorrect(answer: string, q: ScorableQuestion): boolean {
  if (q.options && (q.type === "mcq" || q.type === "true_false")) {
    return normalize(answer) === normalize(resolveCorrectOption(q));
  }
  return normalize(answer) === normalize(q.correct_answer);
}
