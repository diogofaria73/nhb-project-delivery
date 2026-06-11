export class ImportNotFoundError extends Error {
  constructor(importId: string) {
    super(`Import not found: ${importId}`);
    this.name = 'ImportNotFoundError';
  }
}

export class ImportSha256MismatchError extends Error {
  constructor() {
    super(
      'The uploaded file does not match the file analyzed in the preview step (sha256 mismatch).',
    );
    this.name = 'ImportSha256MismatchError';
  }
}

export class CannotDeleteActiveImportError extends Error {
  constructor() {
    super('The ACTIVE import cannot be deleted. Restore another import first.');
    this.name = 'CannotDeleteActiveImportError';
  }
}

export class ImportNotRestorableError extends Error {
  constructor() {
    super('Only SUPERSEDED imports can be restored.');
    this.name = 'ImportNotRestorableError';
  }
}

export class NoActiveImportError extends Error {
  constructor(year: number) {
    super(`No ACTIVE import found for reference year ${year}.`);
    this.name = 'NoActiveImportError';
  }
}

export class InvalidReferenceYearError extends Error {
  constructor(year: number, min: number, max: number) {
    super(`Reference year ${year} is outside the allowed range [${min}, ${max}].`);
    this.name = 'InvalidReferenceYearError';
  }
}
