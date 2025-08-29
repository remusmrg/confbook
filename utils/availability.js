// utils/availability.js

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
  'marți': 2, // cu diacritice
  'miercuri': 3,
  'joi': 4,
  'vineri': 5,
  'sambata': 6,
  'sâmbătă': 6, // cu diacritice
  'simbata': 6, // fără diacritice alternativ
  'duminica': 7,
  'duminică': 7 // cu diacritice
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
 * ✅ CRITICAL FIX pentru Vercel: 
 * Convertește ziua din sistemul JavaScript (0=duminică) în sistemul european (1=luni)
 * FUNCȚIONEAZĂ CORECT indiferent de timezone-ul serverului!
 */
function getEuropeanDayFromDate(date) {
  // ✅ IMPORTANT: date trebuie să fie deja în timezone-ul corect (România)
  // Nu ne bazăm pe getDay() direct pentru că poate fi afectat de timezone-ul serverului
  
  const jsDay = date.getDay(); // JavaScript: 0=Sunday, 1=Monday, ..., 6=Saturday
  const europeanDay = jsDay === 0 ? 7 : jsDay; // European: 1=Monday, 2=Tuesday, ..., 7=Sunday
  
  console.log('getEuropeanDayFromDate DEBUG:');
  console.log('  Input date:', date.toString());
  console.log('  date.toLocaleString("ro-RO", {timeZone: "Europe/Bucharest"}):', date.toLocaleString('ro-RO', {timeZone: 'Europe/Bucharest'}));
  console.log('  JS day (0=Sun):', jsDay);
  console.log('  European day (1=Mon):', europeanDay);
  console.log('  Day name:', DAYS_REVERSE_MAP[europeanDay]);
  
  return europeanDay;
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
      // Cazul când intervalul trece peste sfârșitul săptămânii (ex: Sâmbătă-Luni)
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
  const match = timeRange.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
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
  const parts = availabilityString.split(/(?<=\d{2}:\d{2})\s*,\s*(?=\w)/);
  
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
      
      const timeMatch = segment.match(/\s(\d{1,2}:\d{2}-\d{1,2}:\d{2})$/);
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
 * ✅ CRITICAL FIX pentru Vercel:
 * Verifică dacă o rezervare este în intervalul de disponibilitate
 * ATENȚIE: Obiectele Date trebuie să fie deja în fusul orar România (Europe/Bucharest)!
 * Această funcție lucrează cu obiecte Date JavaScript native care au fost create
 * folosind Luxon cu timezone-ul corect.
 */
export function isBookingWithinAvailability(checkInDate, checkOutDate, availability) {
  if (!availability || availability.length === 0) {
    return { isValid: true };
  }
  
  console.log('=== AVAILABILITY CHECK DEBUG (VERCEL COMPATIBLE) ===');
  console.log('Server timezone (Vercel runs in):', process.env.TZ || 'UTC');
  console.log('Check-in Date object (should be Romania time):', checkInDate);
  console.log('Check-out Date object (should be Romania time):', checkOutDate);
  console.log('Check-in Romania locale string:', checkInDate.toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' }));
  console.log('Check-out Romania locale string:', checkOutDate.toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' }));
  
  // ✅ CRITICAL: Nu creăm Date noi - folosim direct cele primite care sunt în România
  const checkIn = checkInDate;
  const checkOut = checkOutDate;
  
  const sameDay = checkIn.toDateString() === checkOut.toDateString();
  console.log('Same day?', sameDay);
  
  if (sameDay) {
    const dayOfWeek = getEuropeanDayFromDate(checkIn);
    const startHour = checkIn.getHours();
    const startMinute = checkIn.getMinutes();
    const endHour = checkOut.getHours();
    const endMinute = checkOut.getMinutes();
    
    console.log('Booking time:', `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`);
    
    const dayAvailability = availability.filter(a => a.day === dayOfWeek);
    console.log('Day availability slots:', dayAvailability);
    
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
      
      console.log(`Checking availability slot: ${avail.startHour}:${avail.startMinute.toString().padStart(2, '0')}-${avail.endHour}:${avail.endMinute.toString().padStart(2, '0')}`);
      console.log(`Available minutes: ${availStartMinutes}-${availEndMinutes}`);
      console.log(`Booking minutes: ${bookingStartMinutes}-${bookingEndMinutes}`);
      
      if (bookingStartMinutes >= availStartMinutes && bookingEndMinutes <= availEndMinutes) {
        isValid = true;
        console.log('✓ Booking fits in this slot');
        break;
      } else {
        console.log('✗ Booking does not fit in this slot');
      }
    }
    
    if (!isValid) {
      const availTimes = dayAvailability.map(a => 
        `${a.startHour.toString().padStart(2, '0')}:${a.startMinute.toString().padStart(2, '0')}-${a.endHour.toString().padStart(2, '0')}:${a.endMinute.toString().padStart(2, '0')}`
      ).join(', ');
      
      return {
        isValid: false,
        message: `Rezervarea ${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')} ${DAYS_REVERSE_MAP[dayOfWeek]} nu se încadrează în intervalele disponibile: ${availTimes}`
      };
    }
    
    console.log('✓ Single day booking is valid');
    return { isValid: true };
  } else {
    // Rezervare multi-zi (tratare completă pentru compatibilitate)
    console.log('Multi-day booking validation...');
    const currentDate = new Date(checkIn);
    
    while (currentDate < checkOut) {
      const dayOfWeek = getEuropeanDayFromDate(currentDate);
      const hour = currentDate.getHours();
      const minute = currentDate.getMinutes();
      
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
        const currentMinutes = hour * 60 + minute;
        
        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
          isTimeValid = true;
          break;
        }
      }
      
      if (!isTimeValid) {
        const availTimes = dayAvailability.map(a => 
          `${a.startHour.toString().padStart(2, '0')}:${a.startMinute.toString().padStart(2, '0')}-${a.endHour.toString().padStart(2, '0')}:${a.endMinute.toString().padStart(2, '0')}`
        ).join(', ');
        
        return {
          isValid: false,
          message: `Ora ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${DAYS_REVERSE_MAP[dayOfWeek]} nu este în intervalul disponibil: ${availTimes}`
        };
      }
      
      // Verifică ora de sfârșit pentru ultima zi
      if (currentDate.toDateString() === checkOut.toDateString()) {
        const endHour = checkOut.getHours();
        const endMinute = checkOut.getMinutes();
        const endCurrentMinutes = endHour * 60 + endMinute;
        
        let isEndTimeValid = false;
        for (const avail of dayAvailability) {
          const startMinutes = avail.startHour * 60 + avail.startMinute;
          const endMinutes = avail.endHour * 60 + avail.endMinute;
          
          if (endCurrentMinutes <= endMinutes && endCurrentMinutes > startMinutes) {
            isEndTimeValid = true;
            break;
          }
        }
        
        if (!isEndTimeValid) {
          const availTimes = dayAvailability.map(a => 
            `${a.startHour.toString().padStart(2, '0')}:${a.startMinute.toString().padStart(2, '0')}-${a.endHour.toString().padStart(2, '0')}:${a.endMinute.toString().padStart(2, '0')}`
          ).join(', ');
          
          return {
            isValid: false,
            message: `Ora de sfârșit ${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')} ${DAYS_REVERSE_MAP[dayOfWeek]} nu este în intervalul disponibil: ${availTimes}`
          };
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }
    
    console.log('✓ Multi-day booking is valid');
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
  
  // Grupează după intervalul orar
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