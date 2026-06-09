const CNPJ_LENGTH = 14;

export function stripCnpj(value: string): string {
  return (value ?? '').replace(/\D/g, '').slice(0, CNPJ_LENGTH);
}

export function formatCnpj(value: string): string {
  const digits = stripCnpj(value);
  if (digits.length === 0) return '';

  const parts: string[] = [];
  parts.push(digits.slice(0, 2));
  if (digits.length > 2) parts.push('.', digits.slice(2, 5));
  if (digits.length > 5) parts.push('.', digits.slice(5, 8));
  if (digits.length > 8) parts.push('/', digits.slice(8, 12));
  if (digits.length > 12) parts.push('-', digits.slice(12, 14));
  return parts.join('');
}

export function isValidCnpj(value: string): boolean {
  const digits = stripCnpj(value);
  if (digits.length !== CNPJ_LENGTH) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calc = (slice: string, weights: number[]): number => {
    const sum = slice
      .split('')
      .reduce((acc, char, idx) => acc + Number(char) * (weights[idx] ?? 0), 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const d1 = calc(digits.slice(0, 12), firstWeights);
  if (d1 !== Number(digits[12])) return false;

  const d2 = calc(digits.slice(0, 13), secondWeights);
  if (d2 !== Number(digits[13])) return false;

  return true;
}
