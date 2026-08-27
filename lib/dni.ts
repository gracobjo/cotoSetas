/**
 * Validación de DNI/NIE español con letra de control (checksum).
 * OWASP: validación de entrada en servidor (nunca confiar solo en el cliente).
 */

const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

export type DniValidation =
  | { ok: true; normalized: string; tipo: "DNI" | "NIE" }
  | { ok: false; error: string };

/** Normaliza y valida DNI (8 dígitos + letra) o NIE (X/Y/Z + 7 dígitos + letra). */
export function validateDniNie(input: string): DniValidation {
  const raw = (input || "").trim().toUpperCase().replace(/[\s.\-_/]/g, "");

  if (!raw) {
    return { ok: false, error: "El DNI/NIE es obligatorio" };
  }

  if (raw.length !== 9) {
    return { ok: false, error: "El DNI/NIE debe tener 9 caracteres (ej. 12345678Z)" };
  }

  // DNI
  if (/^\d{8}[A-Z]$/.test(raw)) {
    const nums = parseInt(raw.slice(0, 8), 10);
    const letter = raw[8]!;
    const expected = DNI_LETTERS[nums % 23];
    if (letter !== expected) {
      return {
        ok: false,
        error: `Letra de control incorrecta. Para ese número la letra válida es ${expected}`,
      };
    }
    return { ok: true, normalized: raw, tipo: "DNI" };
  }

  // NIE
  if (/^[XYZ]\d{7}[A-Z]$/.test(raw)) {
    const prefix = { X: "0", Y: "1", Z: "2" }[raw[0]!]!;
    const nums = parseInt(prefix + raw.slice(1, 8), 10);
    const letter = raw[8]!;
    const expected = DNI_LETTERS[nums % 23];
    if (letter !== expected) {
      return {
        ok: false,
        error: `Letra de control NIE incorrecta. La letra válida es ${expected}`,
      };
    }
    return { ok: true, normalized: raw, tipo: "NIE" };
  }

  return {
    ok: false,
    error: "Formato inválido. Usa DNI (12345678Z) o NIE (X1234567L)",
  };
}
