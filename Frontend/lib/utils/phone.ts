export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\s+/g, "");

  if (cleaned.startsWith("+254")) {
    return cleaned;
  }

  if (cleaned.startsWith("254")) {
    return "+" + cleaned;
  }

  if (cleaned.startsWith("0")) {
    return "+254" + cleaned.substring(1);
  }

  if (cleaned.startsWith("7")) {
    return "+254" + cleaned;
  }

  return cleaned;
}