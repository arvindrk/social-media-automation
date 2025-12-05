/**
 * Time utilities for scheduling jobs within account posting windows
 */

import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import type { AccountConfig } from './index';

/**
 * Parses a time string in "HH:mm" format
 */
function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours: hours ?? 0, minutes: minutes ?? 0 };
}

/**
 * Creates a Date object for a specific time on a given date in a timezone
 */
function createTimeInTimezone(
  date: Date,
  hours: number,
  minutes: number,
  timezone: string
): Date {
  // Get the date in the target timezone
  const zonedDate = toZonedTime(date, timezone);
  
  // Set the time components
  let result = setHours(zonedDate, hours);
  result = setMinutes(result, minutes);
  result = setSeconds(result, 0);
  result = setMilliseconds(result, 0);
  
  // Convert back to UTC
  return fromZonedTime(result, timezone);
}

/**
 * Generates a random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates random timestamps within an account's posting window for a given date.
 * 
 * @param account - The account config with timezone and posting window
 * @param date - The date to generate times for (uses the date portion only)
 * @param count - Number of random times to generate
 * @returns Array of UTC Date objects within the posting window
 * 
 * @example
 * const times = getRandomTimesInWindow(account, new Date(), 3);
 * // Returns 3 random times between account.postingWindowStart and account.postingWindowEnd
 */
export function getRandomTimesInWindow(
  account: Pick<AccountConfig, 'timezone' | 'postingWindowStart' | 'postingWindowEnd'>,
  date: Date,
  count: number
): Date[] {
  if (count <= 0) {
    return [];
  }

  const { timezone, postingWindowStart, postingWindowEnd } = account;
  
  const start = parseTimeString(postingWindowStart);
  const end = parseTimeString(postingWindowEnd);
  
  // Convert start and end times to UTC Date objects for the given date
  const startTime = createTimeInTimezone(date, start.hours, start.minutes, timezone);
  const endTime = createTimeInTimezone(date, end.hours, end.minutes, timezone);
  
  // Handle edge case: start == end (single point window)
  if (startTime.getTime() === endTime.getTime()) {
    return Array(count).fill(startTime);
  }
  
  // Handle edge case: end is before start (window crosses midnight)
  // For now, we assume the window doesn't cross midnight
  // If endTime < startTime, swap them
  const actualStart = startTime.getTime() < endTime.getTime() ? startTime : endTime;
  const actualEnd = startTime.getTime() < endTime.getTime() ? endTime : startTime;
  
  const startMs = actualStart.getTime();
  const endMs = actualEnd.getTime();
  const rangeMs = endMs - startMs;
  
  // Generate random times
  const times: Date[] = [];
  for (let i = 0; i < count; i++) {
    const randomOffset = Math.floor(Math.random() * rangeMs);
    times.push(new Date(startMs + randomOffset));
  }
  
  // Sort chronologically
  times.sort((a, b) => a.getTime() - b.getTime());
  
  return times;
}

/**
 * Gets the start of today in a specific timezone as a UTC Date
 */
export function getStartOfDayInTimezone(date: Date, timezone: string): Date {
  return createTimeInTimezone(date, 0, 0, timezone);
}

/**
 * Gets the end of today in a specific timezone as a UTC Date
 */
export function getEndOfDayInTimezone(date: Date, timezone: string): Date {
  return createTimeInTimezone(date, 23, 59, timezone);
}

