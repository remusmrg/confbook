// utils/availability.js

import { DateTime } from 'luxon';

/**
 * Parsează string-ul de disponibilitate în format structurat
 * Acceptă formate ca:
 * - "Luni-Vineri 09:00-18:00"
 * - "Luni-Miercuri 10:00-16:00, Vineri 09:00-17:00"
 * - "Luni,Miercuri,Vineri 08:00-20:00"
 */

const DAYS_MAP = {
  'luni': 1,
  'marti': 2,
  'marți': 2,
  'miercuri': 3,
  'joi': 4,
  'vineri': 5,
  'sambata': 6,
  'sâmbătă': 6,
  'simbata': 6,
  'duminica': 7,
  'duminică': 7
};

const DAYS_REVERSE_MAP = {
  1: 'luni',
  2: 'marți',
  3: 'miercuri',
  4: 'joi',
  5: 'vineri',
  6: 'sâmbătă',
  7: 'duminică'
};

/**
 * Normalizează un nume de zi - elimină diacriticele și face lowercase
 */
function normalizeDay(day) {
  return day.toLowerCase()
    .trim()
    .replace(/ă/g, 'a')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't');
}

/**
 * Convertește ziua folosind explicit timezone-ul Europe/Bucharest
 */
function getEuropeanDayFromDate(date) {
  const formatter = new Intl.DateTimeFormat('ro-RO', {
    weekday: 'long',
    timeZone: 'Europe/Bucharest'
  });
  const dayName = normalizeDay(formatter.format(date));
  return DAYS_MAP[dayName];
}

/**
 * Parsează un interval de zile (ex: "luni-vineri")
 */
function parseDayRange(dayRange) {
  const range = normalizeDay(dayRange);

  if (range.includes('-')) {
    const parts = range.split('-');
    if (parts.length !== 2) {
      throw new Error(`Format invalid pentru intervalul de zile: ${dayRange}`);
    }

    const [start, end] = parts.map(d => normalizeDay(d));
    const startDay = DAYS_MAP[start];
    const endDay = DAYS_MAP[end];

    if (startDay === undefined || endDay === undefined) {
      throw new Error(`Zi invalidă în intervalul: ${dayRange} (start: ${start}, end: ${end})`);
    }

    const days = [];
    if (startDay <= endDay) {
      for (let i = startDay; i <= endDay; i++) {
        days.push(i);
      }
    } else {
      for (let i = startDay; i <= 7; i++) days.push(i);
      for (let i = 1; i <= endDay; i++) days.push(i);
    }
    return days;
  } else if (range.includes(',')) {
    return range.split(',').map(day => {
      const normalizedDay = normalizeDay(day);
      const dayNum = DAYS_MAP[normalizedDay];
      if (dayNum === undefined) {
        throw new Error(`Zi invalidă: ${day}`);
      }
      return dayNum;
    });
  } else {
    const normalizedRange = normalizeDay(range);
    const dayNum = DAYS_MAP[normalizedRange];
    if (dayNum === undefined) {
      throw new Error(`Zi invalidă: ${range}`);
    }
    return [dayNum];
  }
}

/**
 * Parsează un interval orar (ex: "09:00-18:00")
 */
function parseTimeRange(timeRange) {
  const match = timeRange.match(/(\d{1,2}):(\d{1,2})-(\d{1,2}):(\d{1,2})/);
  if (!match) {
    throw new Error(`Format orar invalid: ${timeRange}`);
  }

  const [, startHour, startMin, endHour, endMin] = match;
  return {
    start: { hour: parseInt(startHour), minute: parseInt(startMin) },
    end: { hour: parseInt(endHour), minute: parseInt(endMin) }
  };
}

/**
 * Splitează string-ul de disponibilitate în segmente, fiind atent la virgulele din intervale
 */
function smartSplitAvailability(availabilityString) {
  const segments = [];
  const parts = availabilityString.split(/(?<=\d{1,2}:\d{1,2})\s*,\s*(?=\w)/);

  for (const part of parts) {
    if (part.trim()) {
      segments.push(part.trim());
    }
  }

  return segments.length > 0 ? segments : [availabilityString.trim()];
}

/**
 * Parsează string-ul complet de disponibilitate
 */
export function parseAvailability(availabilityString) {
  if (!availabilityString || availabilityString.trim() === '') {
    return [];
  }

  try {
    const segments = smartSplitAvailability(availabilityString);
    const availability = [];

    for (const segment of segments) {
      if (!segment.trim()) continue;

      const timeMatch = segment.match(/\s(\d{1,2}:\d{1,2}-\d{1,2}:\d{1,2})$/);
      if (!timeMatch) {
        continue;
      }

      const timeRange = timeMatch[1];
      const daysPart = segment.replace(timeMatch[0], '').trim();

      if (!daysPart) continue;

      const days = parseDayRange(daysPart);
      const time = parseTimeRange(timeRange);

      for (const day of days) {
        availability.push({
          day,
          startHour: time.start.hour,
          startMinute: time.start.minute,
          endHour: time.end.hour,
          endMinute: time.end.minute
        });
      }
    }

    return availability;
  } catch (error) {
    console.error('Eroare la parsarea disponibilității:', error);
    return [];
  }
}

/**
 * Verifică dacă o rezervare este în intervalul de disponibilitate
 */
export function isBookingWithinAvailability(checkIn, checkOut, availability) {
  if (!availability || availability.length === 0) {
    return { isValid: true };
  }

  // Ensure inputs are DateTime objects in Europe/Bucharest
  const checkInBucharest = checkIn instanceof DateTime
    ? checkIn.setZone('Europe/Bucharest')
    : DateTime.fromJSDate(checkIn, { zone: 'Europe/Bucharest' });
  const checkOutBucharest = checkOut instanceof DateTime
    ? checkOut.setZone('Europe/Bucharest')
    : DateTime.fromJSDate(checkOut, { zone: 'Europe/Bucharest' });

  console.log('=== AVAILABILITY CHECK DEBUG (VERCEL COMPATIBLE) ===');
  console.log('Check-in Bucharest:', checkInBucharest.toISO());
  console.log('Check-out Bucharest:', checkOutBucharest.toISO());

  // Check if booking is on the same day
  const sameDay = checkInBucharest.startOf('day').equals(checkOutBucharest.startOf('day'));

  if (sameDay) {
    const dayOfWeek = getEuropeanDayFromDate(checkInBucharest.toJSDate());
    const startHour = checkInBucharest.hour;
    const startMinute = checkInBucharest.minute;
    const endHour = checkOutBucharest.hour;
    const endMinute = checkOutBucharest.minute;

    const dayAvailability = availability.filter(a => a.day === dayOfWeek);

    if (dayAvailability.length === 0) {
      return {
        isValid: false,
        message: `Sala nu este disponibilă ${DAYS_REVERSE_MAP[dayOfWeek]}`
      };
    }

    let isValid = false;
    for (const avail of dayAvailability) {
      const availStartMinutes = avail.startHour * 60 + avail.startMinute;
      const availEndMinutes = avail.endHour * 60 + avail.endMinute;
      const bookingStartMinutes = startHour * 60 + startMinute;
      const bookingEndMinutes = endHour * 60 + endMinute;

      if (bookingStartMinutes >= availStartMinutes && bookingEndMinutes <= availEndMinutes) {
        isValid = true;
        break;
      }
    }

    if (!isValid) {
      const availTimes = dayAvailability
        .map(a =>
          `${a.startHour.toString().padStart(2, '0')}:${a.startMinute.toString().padStart(2, '0')}-${a.endHour.toString().padStart(2, '0')}:${a.endMinute.toString().padStart(2, '0')}`
        )
        .join(', ');

      return {
        isValid: false,
        message: `Rezervarea ${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')} ${DAYS_REVERSE_MAP[dayOfWeek]} nu se încadrează în intervalele disponibile: ${availTimes}`
      };
    }

    return { isValid: true };
  } else {
    let currentDate = checkInBucharest.startOf('day');

    while (currentDate <= checkOutBucharest.startOf('day')) {
      const dayOfWeek = getEuropeanDayFromDate(currentDate.toJSDate());
      const isCheckInDay = currentDate.startOf('day').equals(checkInBucharest.startOf('day'));
      const isCheckOutDay = currentDate.startOf('day').equals(checkOutBucharest.startOf('day'));

      const dayAvailability = availability.filter(a => a.day === dayOfWeek);

      if (dayAvailability.length === 0) {
        return {
          isValid: false,
          message: `Sala nu este disponibilă ${DAYS_REVERSE_MAP[dayOfWeek]}`
        };
      }

      let isTimeValid = false;
      for (const avail of dayAvailability) {
        const startMinutes = avail.startHour * 60 + avail.startMinute;
        const endMinutes = avail.endHour * 60 + avail.endMinute;

        if (isCheckInDay) {
          const currentMinutes = checkInBucharest.hour * 60 + checkInBucharest.minute;
          if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
            isTimeValid = true;
          }
        } else if (isCheckOutDay) {
          const currentMinutes = checkOutBucharest.hour * 60 + checkOutBucharest.minute;
          if (currentMinutes > startMinutes && currentMinutes <= endMinutes) {
            isTimeValid = true;
          }
        } else {
          // For full days, assume any availability is valid
          isTimeValid = true;
        }

        if (isTimeValid) break;
      }

      if (!isTimeValid) {
        const availTimes = dayAvailability
          .map(a =>
            `${a.startHour.toString().padStart(2, '0')}:${a.startMinute.toString().padStart(2, '0')}-${a.endHour.toString().padStart(2, '0')}:${a.endMinute.toString().padStart(2, '0')}`
          )
          .join(', ');

        const currentHour = isCheckInDay ? checkInBucharest.hour : checkOutBucharest.hour;
        const currentMinute = isCheckInDay ? checkInBucharest.minute : checkOutBucharest.minute;

        return {
          isValid: false,
          message: `Ora ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')} ${DAYS_REVERSE_MAP[dayOfWeek]} nu este în intervalul disponibil: ${availTimes}`
        };
      }

      currentDate = currentDate.plus({ days: 1 });
    }

    return { isValid: true };
  }
}

/**
 * Formatează disponibilitatea într-un string user-friendly
 */
export function formatAvailability(availability) {
  if (!availability || availability.length === 0) {
    return 'Întotdeauna disponibil';
  }

  const timeGroups = {};
  availability.forEach(avail => {
    const key = `${avail.startHour.toString().padStart(2, '0')}:${avail.startMinute.toString().padStart(2, '0')}-${avail.endHour.toString().padStart(2, '0')}:${avail.endMinute.toString().padStart(2, '0')}`;
    if (!timeGroups[key]) {
      timeGroups[key] = [];
    }
    timeGroups[key].push(avail.day);
  });

  const formatted = [];
  Object.entries(timeGroups).forEach(([timeRange, days]) => {
    const uniqueDays = [...new Set(days)].sort((a, b) => a - b);

    const ranges = [];
    let i = 0;

    while (i < uniqueDays.length) {
      let startDay = uniqueDays[i];
      let endDay = startDay;

      while (i + 1 < uniqueDays.length && uniqueDays[i + 1] === uniqueDays[i] + 1) {
        endDay = uniqueDays[i + 1];
        i++;
      }

      if (startDay !== endDay) {
        if (uniqueDays.length === 7 && startDay === 1 && endDay === 7) {
          ranges.push('luni-duminică');
        } else if (startDay === 1 && endDay === 5) {
          ranges.push('luni-vineri');
        } else if (startDay === 6 && endDay === 7 && uniqueDays.length === 2) {
          ranges.push('sâmbătă-duminică');
        } else {
          ranges.push(`${DAYS_REVERSE_MAP[startDay]}-${DAYS_REVERSE_MAP[endDay]}`);
        }
      } else {
        ranges.push(DAYS_REVERSE_MAP[startDay]);
      }

      i++;
    }

    formatted.push(`${ranges.join(', ')} ${timeRange}`);
  });

  return formatted.join('; ');
}