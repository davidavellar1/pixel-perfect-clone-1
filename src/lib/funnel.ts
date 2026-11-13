/** Accept only local destinations, including their search and fragment. */
export function funnelDestination(value: string | null | undefined, fallback = "/app") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const url = new URL(value, "https://app.invalid");
    return url.origin === "https://app.invalid" ? url.pathname + url.search + url.hash : fallback;
  } catch { return fallback; }
}
export function canonicalSignup(search: string) {
  return "/sign-up" + (search.startsWith("?") || !search ? search : `?${search}`);
}
export function recoveryPasswordError(password: string, confirm: string) {
  if (password.length < 8) return "Use at least 8 characters.";
  return password === confirm ? null : "Passwords do not match.";
}
