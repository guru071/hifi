/**
 * Known disposable / temporary email domains. Emails from these providers are
 * not accepted for signup (email/password or OAuth). Additive blocklist — this
 * is not exhaustive but covers the most common abuse sources.
 */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "yopmail.com",
  "sharklasers.com",
  "guerrillamail.com",
  "guerrillamail.biz",
  "guerrillamail.net",
  "guerrillamail.org",
  "maildrop.cc",
  "10minutemail.com",
  "mailnesia.com",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "dispostable.com",
  "getnada.com",
  "mailcatch.com",
  "mintemail.com",
  "spam4.me",
  "tempinbox.com",
  "fakemail.net",
  "emailondeck.com",
  "moakt.com",
  "temp-mail.io",
  "1secmail.com",
  "trashmail.com",
]);

/**
 * Validate an email address is syntactically valid and not on the disposable
 * blocklist. Returns an error string, or null when the email is acceptable.
 */
export function validateEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== "string") {
    return "An email is required.";
  }
  const trimmed = email.trim();
  // RFC-ish basic shape, allows internationalized-ish domains via simple regex
  const generic =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!generic.test(trimmed)) {
    return "Please enter a valid email address.";
  }

  const domain = trimmed.split("@")[1]?.toLowerCase() ?? "";
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return "Disposable email addresses are not allowed. Please use a real email.";
  }

  return null;
}
