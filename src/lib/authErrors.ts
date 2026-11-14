export function accountError(error: unknown): { message: string; signIn: boolean } {
  const details = typeof error === "object" && error !== null ? error as { message?: string; code?: string; status?: number } : {};
  const message = details.message || "Something went wrong. Please try again.";
  const code = details.code || "";
  if (details.status === 429 || /rate.limit|too many|over_.*limit/i.test(`${code} ${message}`)) {
    return { message: "Too many attempts. Wait a minute and try again.", signIn: false };
  }
  if (/user_already_exists|email_exists|already registered|already exists/i.test(`${code} ${message}`)) {
    return { message: "An account with this email already exists. Sign in instead.", signIn: true };
  }
  if (/email_address_(invalid|not_authorized)|invalid.*email|email.*invalid|email.*not allowed|email.*rejected/i.test(`${code} ${message}`)) {
    return { message: "We could not use that email address. Check the spelling or use your work email.", signIn: false };
  }
  return { message, signIn: false };
}