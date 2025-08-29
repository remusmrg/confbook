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
 * Splitează string-ul de disponibilitate în segmente, fiind atent la virgulele din intervale
 */
function smartSplitAvailability(availabilityString) {
  // Strategie simplă: split după pattern de timp urmat de virgulă și spațiu
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
    // Folosește funcția de split inteligentă
    const segments = smartSplitAvailability(availabilityString);
    const availability = [];
    
    console.log('String original:', availabilityString); // Debug
    console.log('Segmente detectate:', segments); // Debug
    
    for (const segment of segments) {
      if (!segment.trim()) continue;
      
      // Găsește ultimul interval orar din segment folosind regex mai strict
      const timeMatch = segment.match(/\s(\d{1,2}:\d{2}-\d{1,2}:\d{2})$/);
      if (!timeMatch) {
        console.warn(`Segment fără format orar valid: "${segment}"`);
        continue;
      }
      
      const timeRange = timeMatch[1];
      const daysPart = segment.replace(timeMatch[0], '').trim(); // Înlătură spațiul și timpul
      
      console.log(`Procesez segment: "${segment}"`); // Debug
      console.log(`-> Zile: "${daysPart}"`); // Debug 
      console.log(`-> Timp: "${timeRange}"`); // Debug
      
      if (!daysPart) {
        console.warn(`Nu s-au găsit zile în segmentul: "${segment}"`);
        continue;
      }
      
      const days = parseDayRange(daysPart);
      const time = parseTimeRange(timeRange);
      
      console.log(`Zile parsate:`, days); // Debug
      
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
    
    console.log('Disponibilitate finală:', availability); // Debug
    return availability;
  } catch (error) {
    console.error('Eroare la parsarea disponibilității:', error);
    console.error('String-ul problematic:', availabilityString);
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
  
  console.log('Verificare disponibilitate:', {
    checkIn: checkIn.toString(),
    checkOut: checkOut.toString(),
    availability
  });
  
  // Verifică dacă rezervarea este în aceeași zi
  const sameDay = checkIn.toDateString() === checkOut.toDateString();
  
  if (sameDay) {
    // Rezervare într-o singură zi
    const dayOfWeek = checkIn.getDay();
    const startHour = checkIn.getHours();
    const startMinute = checkIn.getMinutes();
    const endHour = checkOut.getHours();
    const endMinute = checkOut.getMinutes();
    
    console.log(`Rezervare într-o singură zi: ${DAYS_REVERSE_MAP[dayOfWeek]} (${dayOfWeek})`);
    console.log(`Ora: ${startHour}:${startMinute.toString().padStart(2, '0')} - ${endHour}:${endMinute.toString().padStart(2, '0')}`);
    
    // Găsește disponibilitatea pentru această zi
    const dayAvailability = availability.filter(a => a.day === dayOfWeek);
    
    console.log(`Disponibilitate pentru ziua ${dayOfWeek}:`, dayAvailability);
    
    if (dayAvailability.length === 0) {
      return {
        isValid: false,
        message: `Sala nu este disponibilă ${DAYS_REVERSE_MAP[dayOfWeek]}`
      };
    }
    
    // Verifică dacă întreaga rezervare se încadrează în intervalele disponibile
    let isValid = false;
    let validInterval = null;
    
    for (const avail of dayAvailability) {
      const availStartMinutes = avail.startHour * 60 + avail.startMinute;
      const availEndMinutes = avail.endHour * 60 + avail.endMinute;
      const bookingStartMinutes = startHour * 60 + startMinute;
      const bookingEndMinutes = endHour * 60 + endMinute;
      
      console.log(`Verificare interval: ${avail.startHour}:${avail.startMinute.toString().padStart(2, '0')}-${avail.endHour}:${avail.endMinute.toString().padStart(2, '0')} (${availStartMinutes}-${availEndMinutes} min)`);
      console.log(`Rezervare: ${bookingStartMinutes}-${bookingEndMinutes} min`);
      
      // Verifică dacă ÎNTREAGA rezervare se încadrează în acest interval
      if (bookingStartMinutes >= availStartMinutes && bookingEndMinutes <= availEndMinutes) {
        isValid = true;
        validInterval = avail;
        console.log('✓ Rezervarea se încadrează în acest interval');
        break;
      } else {
        console.log('✗ Rezervarea NU se încadrează în acest interval');
        if (bookingStartMinutes < availStartMinutes) {
          console.log(`  - Începe prea devreme: ${bookingStartMinutes} < ${availStartMinutes}`);
        }
        if (bookingEndMinutes > availEndMinutes) {
          console.log(`  - Se termină prea târziu: ${bookingEndMinutes} > ${availEndMinutes}`);
        }
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
    
    return { isValid: true };
  } else {
    // Rezervare pe mai multe zile - logica veche (păstrată pentru compatibilitate)
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
}

/**
 * Formatează disponibilitatea într-un string user-friendly
 */
export function formatAvailability(availability) {
  if (!availability || availability.length === 0) {
    return 'Întotdeauna disponibil';
  }
  
  // Grupează după intervale orare
  const timeGroups = {};
  availability.forEach(avail => {
    const key = `${avail.startHour.toString().padStart(2, '0')}:${avail.startMinute.toString().padStart(2, '0')}-${avail.endHour.toString().padStart(2, '0')}:${avail.endMinute.toString().padStart(2, '0')}`;
    if (!timeGroups[key]) {
      timeGroups[key] = [];
    }
    timeGroups[key].push(avail.day);
  });
  
  console.log('Time groups pentru formatare:', timeGroups); // Debug
  
  // Formatează pentru afișare
  const formatted = [];
  Object.entries(timeGroups).forEach(([timeRange, days]) => {
    const uniqueDays = [...new Set(days)].sort((a, b) => {
      // Sortare specială: luni=1, marți=2, ..., duminică=0
      // Pentru a avea ordinea corectă, tratăm duminica (0) ca pe 7
      const dayA = a === 0 ? 7 : a;
      const dayB = b === 0 ? 7 : b;
      return dayA - dayB;
    });
    
    console.log(`Pentru intervalul ${timeRange}, zile sortate:`, uniqueDays); // Debug
    
    const dayNames = uniqueDays.map(day => DAYS_REVERSE_MAP[day]);
    
    // Încearcă să creeze intervale consecutive de zile
    const ranges = [];
    let i = 0;
    
    while (i < uniqueDays.length) {
      let start = i;
      let end = i;
      
      // Pentru a detecta consecutivitate, trebuie să tratăm special duminica
      while (end + 1 < uniqueDays.length) {
        const currentDay = uniqueDays[end];
        const nextDay = uniqueDays[end + 1];
        
        // Verifică consecutivitate normală (1->2, 2->3, etc.)
        if (nextDay === currentDay + 1) {
          end++;
          continue;
        }
        
        // Verifică cazul special sâmbătă->duminică (6->0, dar în sorted va fi 6->7)
        if (currentDay === 6 && nextDay === 7) { // 7 este duminica tratată special
          end++;
          continue;
        }
        
        break;
      }
      
      if (end > start) {
        // Interval de zile consecutive
        ranges.push(`${dayNames[start]}-${dayNames[end]}`);
      } else {
        // O singură zi
        ranges.push(dayNames[start]);
      }
      
      i = end + 1;
    }
    
    console.log(`Ranges create pentru ${timeRange}:`, ranges); // Debug
    formatted.push(`${ranges.join(', ')} ${timeRange}`);
  });
  
  return formatted.join('; ');
}