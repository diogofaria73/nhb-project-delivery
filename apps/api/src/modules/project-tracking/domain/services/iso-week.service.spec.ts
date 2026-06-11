import { IsoWeekService } from './iso-week.service';

describe('IsoWeekService', () => {
  let service: IsoWeekService;

  beforeEach(() => {
    service = new IsoWeekService();
  });

  describe('hasWeek53 / weeksInYear', () => {
    it.each([
      [2020, true], // 2020 has ISO week 53
      [2026, true], // 2026 has ISO week 53
      [2024, false],
      [2025, false],
    ])('hasWeek53(%d) === %s', (year, expected) => {
      expect(service.hasWeek53(year)).toBe(expected);
    });

    it('returns the correct number of weeks', () => {
      expect(service.weeksInYear(2026)).toBe(53);
      expect(service.weeksInYear(2025)).toBe(52);
    });
  });

  describe('effectiveCurrentWeek', () => {
    it('returns 0 for years in the future', () => {
      const future = new Date().getFullYear() + 5;
      expect(service.effectiveCurrentWeek(future)).toBe(0);
    });

    it('returns the last ISO week for past years', () => {
      const past = new Date().getFullYear() - 5;
      expect(service.effectiveCurrentWeek(past)).toBe(
        service.weeksInYear(past),
      );
    });

    it('returns a valid week number for the current year', () => {
      const current = new Date().getFullYear();
      const week = service.effectiveCurrentWeek(current);
      expect(week).toBeGreaterThanOrEqual(1);
      expect(week).toBeLessThanOrEqual(53);
    });
  });

  describe('weekRange', () => {
    it('returns a 7-day range', () => {
      const range = service.weekRange(2026, 18);
      const ms = range.weekEnd.getTime() - range.weekStart.getTime();
      const days = ms / (24 * 60 * 60 * 1000);
      expect(days).toBeGreaterThanOrEqual(6);
      expect(days).toBeLessThan(7);
    });
  });
});
