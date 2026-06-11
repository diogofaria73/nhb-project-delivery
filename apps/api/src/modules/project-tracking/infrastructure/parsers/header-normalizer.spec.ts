import { normalizeHeader, weekHeader } from './header-normalizer';

describe('normalizeHeader', () => {
  it('lowercases and strips diacritics', () => {
    expect(normalizeHeader('Status Projeto')).toBe('status projeto');
    expect(normalizeHeader('Projetos Concluídos %')).toBe(
      'projetos concluidos %',
    );
  });

  it('collapses whitespace', () => {
    expect(normalizeHeader('  Total   de   Status  ')).toBe('total de status');
  });

  it('returns empty string for null/undefined', () => {
    expect(normalizeHeader(null)).toBe('');
    expect(normalizeHeader(undefined)).toBe('');
  });
});

describe('weekHeader', () => {
  it('builds canonical week header keys', () => {
    expect(weekHeader(1)).toBe('semana 1');
    expect(weekHeader(52)).toBe('semana 52');
  });
});
