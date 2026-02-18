const ERROR_MESSAGES: Record<string, string> = {
  DB_ERROR: "Une erreur s'est produite. Veuillez réessayer.",
  GITHUB_ERROR: "Erreur lors de la communication avec GitHub.",
};

export function sanitizeError(error: unknown, code: string): string {
  console.error(`[${code}]`, error);
  return ERROR_MESSAGES[code] ?? "Une erreur inattendue s'est produite.";
}
