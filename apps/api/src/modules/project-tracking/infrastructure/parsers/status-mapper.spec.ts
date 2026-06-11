import { mapStatus, UnknownStatusError } from './status-mapper';

describe('mapStatus', () => {
  it.each([
    ['ativo', 'ACTIVE'],
    ['Ativo', 'ACTIVE'],
    ['  ATIVO  ', 'ACTIVE'],
    ['on hold', 'ON_HOLD'],
    ['On Hold', 'ON_HOLD'],
    ['concluido', 'COMPLETED'],
    ['concluído', 'COMPLETED'],
    ['Concluído', 'COMPLETED'],
    ['cancelado', 'CANCELLED'],
    ['a iniciar', 'NOT_STARTED'],
    ['A Iniciar', 'NOT_STARTED'],
  ])('maps "%s" → %s', (input, expected) => {
    expect(mapStatus(input)).toBe(expected);
  });

  it('throws on unknown status', () => {
    expect(() => mapStatus('em revisão')).toThrow(UnknownStatusError);
  });

  it('throws on empty value', () => {
    expect(() => mapStatus('')).toThrow(UnknownStatusError);
    expect(() => mapStatus(null)).toThrow(UnknownStatusError);
  });
});
