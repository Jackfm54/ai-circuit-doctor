/** Expected service failures are user-facing states, not runtime crashes. */
export async function aiResponseError(response: Response, language: string, fallback: string): Promise<string | null> {
  if (response.ok) return null;
  if (response.status === 402) {
    return language === "fr"
      ? "Crédits IA insuffisants. L’analyse est indisponible pour le moment ; les mesures USB restent accessibles."
      : "Insufficient AI credits. Analysis is currently unavailable; USB measurements remain available.";
  }
  if (response.status === 429) {
    return language === "fr" ? "Trop de demandes. Réessayez dans quelques instants." : "Too many requests. Please try again shortly.";
  }
  const body = await response.json().catch(() => null);
  return typeof body?.error === "string" ? body.error : fallback;
}