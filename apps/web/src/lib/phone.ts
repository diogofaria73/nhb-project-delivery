const MAX_DIGITS = 11;

export function stripPhone(value: string): string {
  return (value ?? '').replace(/\D/g, '').slice(0, MAX_DIGITS);
}

/**
 * Brazilian phone formatter:
 *  - 10 digits → (XX) XXXX-XXXX (landline)
 *  - 11 digits → (XX) XXXXX-XXXX (mobile)
 *  - partial inputs are progressively formatted as the user types
 */
export function formatPhone(value: string): string {
  const digits = stripPhone(value);
  if (digits.length === 0) return '';

  const parts: string[] = [];
  parts.push('(');
  parts.push(digits.slice(0, 2));
  if (digits.length > 2) {
    parts.push(') ');
    if (digits.length <= 10) {
      parts.push(digits.slice(2, 6));
      if (digits.length > 6) {
        parts.push('-');
        parts.push(digits.slice(6, 10));
      }
    } else {
      parts.push(digits.slice(2, 7));
      if (digits.length > 7) {
        parts.push('-');
        parts.push(digits.slice(7, 11));
      }
    }
  }
  return parts.join('');
}

export function isValidPhone(value: string): boolean {
  const digits = stripPhone(value);
  if (digits.length === 0) return true; // empty is allowed for optional fields
  return digits.length === 10 || digits.length === 11;
}
