const AUTH_EMAIL_DOMAIN = process.env.AUTH_EMAIL_DOMAIN ?? "expenses.local";

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;
}

export function emailToUsername(email: string): string {
  return email.split("@")[0] ?? email;
}

export const RESERVED_USERNAMES = ["cfi", "admin", "administrator"];

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.includes(username.trim().toLowerCase());
}
