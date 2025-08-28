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
  'duminica': 0,
  'duminică': 0 // cu diacritice
};

const DAYS_REVERSE_MAP = {
  1: 'luni',
  2: 'marți',
  3: 'miercuri',
  4: 'joi',
  5: 'vineri',
  6: 'sâmbătă',
  0: 'duminică'
};

/**
 * Parsează un interval de zile (ex: "luni-vineri")
 */
function parseDayRange(dayRange) {
  // Normalizează string-ul - elimină diacriticele și face lowercase
  const normalizeDay = (day) => {
    return day.toLowerCase()
      .trim()
      .replace(/ă/g, 'a')
      .replace(/â/g, 'a')
      .replace(/î/g, 'i')
      .replace(/ș/g, 's')
      .replace(/ț/g, 't');
  };

  const range = normalizeDay(dayRange);
  
  if (range.includes('-')) {
    const [start, end] = range.split('-').map(d => normalizeDay(d));
    const startDay = DAYS_MAP[start];
    const endDay = DAYS_MAP[end];
    
    if (startDay === undefined || endDay === undefined) {
      throw new Error(`Zi invalidă în intervalul: ${dayRange}`);
    }
    
    const days = [];
    if (startDay <= endDay) {
      for (let i = startDay; i <= endDay; i++) {
        days.push(i);
      }
    } else {
      // Cazul când intervalul trece peste weekend (ex: vineri-luni)
      for (let i = startDay; i <= 6; i++) days.push(i);
      for (let i = 0; i <= endDay; i++) days.push(i);
    }
    return days;
  } else if (range.includes(',')) {
    // Format: "luni,miercuri,vineri"
    return range.split(',').map(day => {
      const normalizedDay = normalizeDay(day);
      const dayNum = DAYS_MAP[normalizedDay];
      if (dayNum === undefined) {
        throw new Error(`Zi invalidă: ${day}`);
      }
      return dayNum;
    });
  } else {
    // O singură zi
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
 * Parsează string-ul complet de disponibilitate
 */
export function parseAvailability(availabilityString) {
  if (!availabilityString || availabilityString.trim() === '') {
    return [];
  }
  
  try {
    // Împarte după virgulă pentru multiple intervale
    const segments = availabilityString.split(',').map(s => s.trim());
    const availability = [];
    
    for (const segment of segments) {
      // Găsește ultimul interval orar din segment
      const timeMatch = segment.match(/(\d{1,2}:\d{2}-\d{1,2}:\d{2})$/);
      if (!timeMatch) {
        continue; // Skip segments fără format orar valid
      }
      
      const timeRange = timeMatch[1];
      const daysPart = segment.replace(timeRange, '').trim();
      
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
    return []; // Returnează array gol în caz de eroare
  }
}

/**
 * Verifică dacă o rezervare este în intervalul de disponibilitate
 */
export function isBookingWithinAvailability(checkInDate, checkOutDate, availability) {
  if (!availability || availability.length === 0) {
    // Dacă nu există restricții de disponibilitate, permite orice rezervare
    return { isValid: true };
  }
  
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  
  // Verifică fiecare zi din rezervare
  const currentDate = new Date(checkIn);
  while (currentDate < checkOut) {
    const dayOfWeek = currentDate.getDay();
    const hour = currentDate.getHours();
    const minute = currentDate.getMinutes();
    
    // Găsește disponibilitatea pentru această zi
    const dayAvailability = availability.filter(a => a.day === dayOfWeek);
    
    if (dayAvailability.length === 0) {
      return {
        isValid: false,
        message: `Sala nu este disponibilă ${DAYS_REVERSE_MAP[dayOfWeek]}`
      };
    }
    
    // Verifică dacă ora este în intervalul permis
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
    
    // Verifică sfârșitul rezervării pentru aceeași zi
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
    
    // Trece la ziua următoare
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(0, 0, 0, 0);
  }
  
  return { isValid: true };
}

/**
 * Formatează disponibilitatea într-un string user-friendly
 */
export function formatAvailability(availability) {
  if (!availability || availability.length === 0) {
    return 'Întotdeauna disponibil';
  }
  
  // Grupează după zile
  const dayGroups = {};
  availability.forEach(avail => {
    const key = `${avail.startHour}:${avail.startMinute.toString().padStart(2, '0')}-${avail.endHour}:${avail.endMinute.toString().padStart(2, '0')}`;
    if (!dayGroups[key]) {
      dayGroups[key] = [];
    }
    dayGroups[key].push(avail.day);
  });
  
  // Formatează pentru afișare
  const formatted = [];
  Object.entries(dayGroups).forEach(([timeRange, days]) => {
    const sortedDays = days.sort((a, b) => a - b);
    const dayNames = sortedDays.map(day => DAYS_REVERSE_MAP[day]);
    
    // Încearcă să creeze intervale de zile
    const ranges = [];
    let start = 0;
    
    while (start < sortedDays.length) {
      let end = start;
      while (end + 1 < sortedDays.length && sortedDays[end + 1] === sortedDays[end] + 1) {
        end++;
      }
      
      if (end > start) {
        ranges.push(`${dayNames[start]}-${dayNames[end]}`);
      } else {
        ranges.push(dayNames[start]);
      }
      
      start = end + 1;
    }
    
    formatted.push(`${ranges.join(', ')} ${timeRange}`);
  });
  
  return formatted.join('; ');
}