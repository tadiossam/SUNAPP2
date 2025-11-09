/**
 * Fiscal Year Utilities
 * 
 * Uses Ethiopian calendar as the fiscal year basis.
 * Ethiopian New Year (fiscal year start) falls on:
 * - September 11 in normal Gregorian years
 * - September 12 in Gregorian leap years
 * 
 * Fiscal quarters (3 months each):
 * - FY Q1: Sept 11/12 - Dec 10/11
 * - FY Q2: Dec 11/12 - Mar 10/11
 * - FY Q3: Mar 11/12 - Jun 10/11
 * - FY Q4: Jun 11/12 - Sept 10/11
 */

/**
 * Checks if a Gregorian year is a leap year
 */
function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Gets the date of Ethiopian New Year (fiscal year start) for a given Gregorian year
 */
function getEthiopianNewYearDate(gregorianYear: number): Date {
  const month = 8; // September (0-indexed)
  const day = isGregorianLeapYear(gregorianYear) ? 12 : 11;
  return new Date(gregorianYear, month, day, 0, 0, 0, 0);
}

/**
 * Gets the fiscal year for a given date
 * Fiscal year matches Ethiopian year:
 * - Jan 1 - Sept 10/11: Fiscal year = Gregorian year - 1 (still in previous fiscal year)
 * - Sept 11/12 - Dec 31: Fiscal year = Gregorian year (new fiscal year started)
 */
export function getFiscalYear(date: Date = new Date()): number {
  const gregorianYear = date.getFullYear();
  const fiscalYearStart = getEthiopianNewYearDate(gregorianYear);
  
  if (date < fiscalYearStart) {
    // Before fiscal year start - still in previous fiscal year
    return gregorianYear - 1;
  } else {
    // After fiscal year start - in current fiscal year
    return gregorianYear;
  }
}

/**
 * Gets the start and end dates for the entire fiscal year
 * @param fiscalYear The fiscal year (e.g., 2024)
 * @returns Object with start and end dates
 */
export function getFiscalYearBounds(fiscalYear: number): { start: Date; end: Date } {
  // Fiscal year starts on Ethiopian New Year of the specified year
  const start = getEthiopianNewYearDate(fiscalYear);
  
  // Fiscal year ends on the day before next year's Ethiopian New Year
  const nextYearStart = getEthiopianNewYearDate(fiscalYear + 1);
  const end = new Date(nextYearStart);
  end.setDate(end.getDate() - 1);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Gets the start and end dates for a fiscal quarter
 * @param quarter Quarter number (1-4)
 * @param fiscalYear The fiscal year
 * @returns Object with start and end dates
 */
export function getFiscalQuarterRange(quarter: number, fiscalYear: number): { start: Date; end: Date } {
  if (quarter < 1 || quarter > 4) {
    throw new Error('Quarter must be between 1 and 4');
  }
  
  const fiscalYearStart = getEthiopianNewYearDate(fiscalYear);
  const isLeapYear = isGregorianLeapYear(fiscalYear);
  const dayOffset = isLeapYear ? 1 : 0; // Leap years start on Sept 12, normal years on Sept 11
  
  // Each quarter is 3 months
  const monthsFromStart = (quarter - 1) * 3;
  
  // Calculate quarter start date (add 3-month increments to fiscal year start)
  const start = new Date(fiscalYearStart);
  start.setMonth(start.getMonth() + monthsFromStart);
  
  // Calculate quarter end date (day before next quarter starts)
  const end = new Date(start);
  end.setMonth(end.getMonth() + 3);
  end.setDate(end.getDate() - 1);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Gets a human-readable label for a fiscal quarter
 * @param quarter Quarter number (1-4)
 * @param fiscalYear The fiscal year
 * @returns Label like "FY 2024 Q1" or "Q1 2024"
 */
export function labelFiscalQuarter(quarter: number, fiscalYear: number, format: 'full' | 'short' = 'full'): string {
  if (format === 'full') {
    return `FY ${fiscalYear} Q${quarter}`;
  } else {
    return `Q${quarter} ${fiscalYear}`;
  }
}

/**
 * Determines which fiscal quarter a given date falls into
 * @param date The date to check
 * @returns Object with fiscalYear and quarter (1-4)
 */
export function getQuarterForDate(date: Date = new Date()): { fiscalYear: number; quarter: number } {
  const fiscalYear = getFiscalYear(date);
  const { start: fiscalYearStart } = getFiscalYearBounds(fiscalYear);
  
  // Calculate months since fiscal year start
  const monthsSinceStart = 
    (date.getFullYear() - fiscalYearStart.getFullYear()) * 12 +
    (date.getMonth() - fiscalYearStart.getMonth());
  
  // Determine quarter (0-2 months = Q1, 3-5 months = Q2, etc.)
  const quarter = Math.floor(monthsSinceStart / 3) + 1;
  
  // Clamp to 1-4 range
  return { fiscalYear, quarter: Math.min(Math.max(quarter, 1), 4) };
}

/**
 * Gets the current fiscal quarter
 * @returns Object with fiscalYear and quarter (1-4)
 */
export function getCurrentFiscalQuarter(): { fiscalYear: number; quarter: number } {
  return getQuarterForDate(new Date());
}
