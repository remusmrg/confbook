// utils/dateFormatter.js

/**
 * Formatează o dată în stilul european (DD.MM.YYYY HH:mm)
 * cu fusul orar corect pentru România
 */
export function formatDateEuropean(dateString) {
  const date = new Date(dateString);
  
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // Format 24h, nu AM/PM
    timeZone: 'Europe/Bucharest',
  }).format(date);
}

/**
 * Formatează doar data (fără ora) în stilul european
 */
export function formatDateOnly(dateString) {
  const date = new Date(dateString);
  
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Europe/Bucharest',
  }).format(date);
}

/**
 * Formatează doar ora în format 24h
 */
export function formatTimeOnly(dateString) {
  const date = new Date(dateString);
  
  return new Intl.DateTimeFormat('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Europe/Bucharest',
  }).format(date);
}

/**
 * Verifică dacă o rezervare este încă activă
 */
export function isBookingActive(checkOutDate) {
  const now = new Date();
  const checkOut = new Date(checkOutDate);
  return checkOut > now;
}

/**
 * Calculează durata unei rezervări în ore și minute
 */
export function calculateBookingDuration(checkInDate, checkOutDate) {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  
  const diffMs = checkOut - checkIn;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}min`;
  }
}