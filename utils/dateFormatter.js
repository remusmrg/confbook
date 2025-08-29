// utils/dateFormatter.js
import { DateTime } from 'luxon';

/**
 * ✅ Formatează o dată în stilul european (DD.MM.YYYY HH:mm)
 * cu fusul orar corect pentru România folosind Luxon
 */
export function formatDateEuropean(dateString) {
  // Parsează string-ul ca UTC și convertește la fusul României
  const date = DateTime.fromISO(dateString, { zone: 'utc' }).setZone('Europe/Bucharest');
  
  return date.toFormat('dd.MM.yyyy HH:mm');
}

/**
 * Formatează doar data (fără ora) în stilul european
 */
export function formatDateOnly(dateString) {
  const date = DateTime.fromISO(dateString, { zone: 'utc' }).setZone('Europe/Bucharest');
  
  return date.toFormat('dd.MM.yyyy');
}

/**
 * Formatează doar ora în format 24h
 */
export function formatTimeOnly(dateString) {
  const date = DateTime.fromISO(dateString, { zone: 'utc' }).setZone('Europe/Bucharest');
  
  return date.toFormat('HH:mm');
}

/**
 * ✅ Verifică dacă o rezervare este încă activă
 * Folosește Luxon pentru comparație precisă
 */
export function isBookingActive(checkOutDate) {
  const now = DateTime.now().setZone('Europe/Bucharest');
  const checkOut = DateTime.fromISO(checkOutDate, { zone: 'utc' }).setZone('Europe/Bucharest');
  
  return checkOut > now;
}

/**
 * ✅ Calculează durata unei rezervări în ore și minute
 * Folosește Luxon pentru calcule precise
 */
export function calculateBookingDuration(checkInDate, checkOutDate) {
  const checkIn = DateTime.fromISO(checkInDate, { zone: 'utc' });
  const checkOut = DateTime.fromISO(checkOutDate, { zone: 'utc' });
  
  const diff = checkOut.diff(checkIn, ['hours', 'minutes']);
  const hours = Math.floor(diff.hours);
  const minutes = Math.floor(diff.minutes % 60);
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}min`;
  }
}

/**
 * ✅ Formatează o dată pentru afișarea în fusul orar al utilizatorului
 * Util pentru componente care trebuie să afișeze timpul local
 */
export function formatDateInUserTimezone(dateString, userTimezone = null) {
  const detectedTimezone = userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const date = DateTime.fromISO(dateString, { zone: 'utc' }).setZone(detectedTimezone);
  
  return date.toFormat('dd.MM.yyyy HH:mm');
}

/**
 * ✅ Obține zona orară curentă a utilizatorului
 */
export function getUserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * ✅ Convertește o dată din fusul utilizatorului la UTC pentru server
 */
export function convertUserTimeToUTC(dateString, userTimezone) {
  const userDate = DateTime.fromFormat(dateString, 'yyyy-MM-dd HH:mm', { zone: userTimezone });
  return userDate.toUTC().toISO();
}

/**
 * ✅ Convertește o dată din UTC la fusul utilizatorului pentru afișare
 */
export function convertUTCToUserTime(utcDateString, userTimezone) {
  const utcDate = DateTime.fromISO(utcDateString, { zone: 'utc' });
  return utcDate.setZone(userTimezone);
}