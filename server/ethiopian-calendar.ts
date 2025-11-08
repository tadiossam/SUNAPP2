/**
 * Ethiopian Calendar Utilities
 * 
 * The Ethiopian calendar is approximately 7-8 years behind the Gregorian calendar.
 * Ethiopian New Year (Enkutatash) falls on:
 * - September 11 in normal Gregorian years
 * - September 12 in Gregorian leap years
 */

/**
 * Checks if a Gregorian year is a leap year
 */
export function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Gets the date of Ethiopian New Year for a given Gregorian year
 */
export function getEthiopianNewYearDate(gregorianYear: number): Date {
  const month = 8; // September (0-indexed)
  const day = isGregorianLeapYear(gregorianYear) ? 12 : 11;
  return new Date(gregorianYear, month, day, 0, 0, 0, 0);
}

/**
 * Converts a Gregorian year to Ethiopian year
 * Ethiopian year starts on Sept 11/12, so:
 * - Jan 1 - Sept 10/11: Ethiopian year = Gregorian year - 8
 * - Sept 11/12 - Dec 31: Ethiopian year = Gregorian year - 7
 */
export function gregorianToEthiopian(date: Date): number {
  const gregorianYear = date.getFullYear();
  const ethiopianNewYear = getEthiopianNewYearDate(gregorianYear);
  
  if (date < ethiopianNewYear) {
    // Before Ethiopian New Year - still in previous Ethiopian year
    return gregorianYear - 8;
  } else {
    // After Ethiopian New Year - in new Ethiopian year
    return gregorianYear - 7;
  }
}

/**
 * Gets the current Ethiopian year
 */
export function getCurrentEthiopianYear(): number {
  return gregorianToEthiopian(new Date());
}

/**
 * Gets the next Ethiopian New Year date from today
 */
export function getNextEthiopianNewYear(): Date {
  const today = new Date();
  const currentGregorianYear = today.getFullYear();
  const thisYearNewYear = getEthiopianNewYearDate(currentGregorianYear);
  
  if (today < thisYearNewYear) {
    // Next new year is later this Gregorian year
    return thisYearNewYear;
  } else {
    // Next new year is next Gregorian year
    return getEthiopianNewYearDate(currentGregorianYear + 1);
  }
}

/**
 * Gets information about the Ethiopian calendar year
 */
export function getEthiopianYearInfo() {
  const today = new Date();
  const currentEthiopianYear = getCurrentEthiopianYear();
  const nextNewYear = getNextEthiopianNewYear();
  const nextEthiopianYear = currentEthiopianYear + 1;
  
  const daysUntilNewYear = Math.ceil((nextNewYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    currentEthiopianYear,
    nextEthiopianYear,
    nextNewYearDate: nextNewYear,
    daysUntilNewYear,
    isLeapYear: isGregorianLeapYear(nextNewYear.getFullYear()),
  };
}
