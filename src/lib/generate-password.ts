// Sin caracteres ambiguos (0/O, 1/l/I) para que se puedan transcribir a
// mano sin errores al entregarlas en persona o por teléfono.
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function generatePassword(length = 10): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]).join("");
}
