// Turn raw AI/backend errors (429 quota, billing, timeouts, network) into a
// calm, user-facing message. Never show the user a raw stack/billing string.

export function friendlyAiError(err: unknown): string {
  const msg = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();

  if (
    msg.includes("429") || msg.includes("quota") || msg.includes("credit") ||
    msg.includes("rate limit") || msg.includes("billing") || msg.includes("depleted")
  ) {
    return "The AI study assistant is over capacity right now — give it a minute and try again.";
  }
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return "The AI took too long to respond. Try again, or use a shorter input.";
  }
  if (msg.includes("failed to fetch") || msg.includes("network") || msg.includes("connect") || msg.includes("fetch")) {
    return "Couldn't reach the study service. Check your connection and try again.";
  }
  if (msg.includes("no ai provider") || msg.includes("api key") || msg.includes("not configured")) {
    return "The AI service isn't available right now. Please try again later.";
  }
  return "Something went wrong with the AI. Please try again.";
}
