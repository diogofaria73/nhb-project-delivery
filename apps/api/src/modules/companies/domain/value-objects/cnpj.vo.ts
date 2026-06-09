import { BadRequestException } from '@nestjs/common';

const CNPJ_LENGTH = 14;

export class Cnpj {
  private constructor(private readonly _value: string) {}

  static create(raw: string): Cnpj {
    if (raw === null || raw === undefined) {
      throw new BadRequestException('CNPJ is required');
    }

    const digits = String(raw).replace(/\D/g, '');

    if (digits.length !== CNPJ_LENGTH) {
      throw new BadRequestException('CNPJ must contain 14 digits');
    }

    if (!Cnpj.isValid(digits)) {
      throw new BadRequestException('Invalid CNPJ');
    }

    return new Cnpj(digits);
  }

  get value(): string {
    return this._value;
  }

  format(): string {
    return this._value.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5',
    );
  }

  equals(other: Cnpj): boolean {
    return this._value === other._value;
  }

  private static isValid(digits: string): boolean {
    // Reject sequences of repeated digits (e.g., 00000000000000)
    if (/^(\d)\1+$/.test(digits)) {
      return false;
    }

    const calc = (slice: string, weights: number[]): number => {
      const sum = slice
        .split('')
        .reduce((acc, char, idx) => acc + Number(char) * weights[idx]!, 0);
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
}
