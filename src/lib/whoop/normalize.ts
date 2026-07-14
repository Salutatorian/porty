export function normalizeWhoopToken(value: string | undefined) {
  let s = String(value || "").trim();
  if (!s) return "";
  if (/^["'].*["']$/.test(s)) s = s.slice(1, -1).trim();
  if (s.toLowerCase().startsWith("bearer ")) s = s.slice(7).trim();
  return s.replace(/[\r\n]+/g, "").trim();
}
