import { Injectable } from '@nestjs/common';
import {
  getISOWeek,
  getISOWeekYear,
  setISOWeek,
  setISOWeekYear,
  startOfISOWeek,
  endOfISOWeek,
  addDays,
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Sao_Paulo';

export interface IsoWeekRange {
  isoWeek: number;
  weekStart: Date;
  weekEnd: Date;
}

@Injectable()
export class IsoWeekService {
  /**
   * BR-64: the only place the platform reads the wall clock for analytics.
   * Returns the ISO 8601 week of "now" evaluated in America/Sao_Paulo.
   */
  getCurrentISOWeek(): IsoWeekRange {
    const zoned = toZonedTime(new Date(), TIMEZONE);
    return this.toWeekRange(zoned);
  }

  /**
   * Returns the ISO week range for a given (year, week) anchored in America/Sao_Paulo.
   */
  weekRange(year: number, week: number): IsoWeekRange {
    let anchor = startOfISOWeek(new Date(Date.UTC(year, 5, 1)));
    anchor = setISOWeekYear(anchor, year);
    anchor = setISOWeek(anchor, week);
    return this.toWeekRange(anchor);
  }

  /**
   * BR-57: detects whether a calendar year has ISO week 53.
   * Week 53 exists when the ISO-week-year of December 31 equals the calendar year.
   */
  hasWeek53(year: number): boolean {
    const dec31 = new Date(Date.UTC(year, 11, 31));
    const lastWeek = getISOWeek(dec31);
    if (lastWeek === 53) {
      return getISOWeekYear(dec31) === year;
    }
    const dec28 = new Date(Date.UTC(year, 11, 28));
    return getISOWeek(dec28) === 53 && getISOWeekYear(dec28) === year;
  }

  /**
   * For a given ISO-week-year, returns how many ISO weeks it has (52 or 53).
   */
  weeksInYear(year: number): number {
    return this.hasWeek53(year) ? 53 : 52;
  }

  /**
   * For an ISO-week-year, returns the current week number if the year matches,
   * otherwise either the first week (if year is in the future) or the last week
   * of that year (if year is in the past). Used to cap the dashboard denominator (BR-60).
   */
  effectiveCurrentWeek(referenceYear: number): number {
    const current = this.getCurrentISOWeek();
    const currentYear = getISOWeekYear(current.weekStart);
    if (referenceYear < currentYear) return this.weeksInYear(referenceYear);
    if (referenceYear > currentYear) return 0;
    return current.isoWeek;
  }

  private toWeekRange(zonedDate: Date): IsoWeekRange {
    const startZoned = startOfISOWeek(zonedDate);
    const endZoned = endOfISOWeek(zonedDate);
    return {
      isoWeek: getISOWeek(zonedDate),
      weekStart: fromZonedTime(startZoned, TIMEZONE),
      weekEnd: fromZonedTime(addDays(endZoned, 0), TIMEZONE),
    };
  }
}
