'use server';

import { createSessionClient } from '@/config/appwrite';
import { cookies } from 'next/headers';
import { Query } from 'node-appwrite';
import { redirect } from 'next/navigation';
import { parseAvailability, isBookingWithinAvailability } from '@/utils/availability';

/**
 * Verifică dacă două intervale UTC se suprapun
 */
function dateRangesOverlapUTC(startA, endA, startB, endB) {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
}

/**
 * Verifică disponibilitatea unei săli
 * @param {string} roomId - ID sala
 * @param {Date} checkInUTC - Date UTC
 * @param {Date} checkOutUTC - Date UTC
 * @returns {boolean} true dacă sala este liberă și în intervalul disponibil
 */
async function checkRoomAvailability(roomId, checkInUTC, checkOutUTC) {
  const sessionCookie = cookies().get('appwrite-session');
  if (!sessionCookie) redirect('/login');

  try {
    const { databases } = await createSessionClient(sessionCookie.value);

    // Preluăm sala
    const { documents: rooms } = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ROOMS,
      [Query.equal('$id', roomId)]
    );

    if (rooms.length === 0) throw new Error('Sala nu există');
    const room = rooms[0];

    // Parsează disponibilitatea sălii
    const availability = parseAvailability(room.availability || '');

    // Convertim UTC în fusul Europe/Bucharest
    const checkIn = new Date(checkInUTC.toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' }));
    const checkOut = new Date(checkOutUTC.toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' }));

    // Verificăm disponibilitatea conform orarului
    const availabilityCheck = isBookingWithinAvailability(checkIn, checkOut, availability);
    if (!availabilityCheck.isValid) {
      console.log('Rezervare în afara programului:', availabilityCheck.message);
      return false;
    }

    // Verificăm suprapunerea rezervărilor existente
    const { documents: bookings } = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BOOKINGS,
      [Query.equal('room_id', roomId)]
    );

    for (const booking of bookings) {
      const bStart = new Date(booking.check_in);
      const bEnd = new Date(booking.check_out);

      if (dateRangesOverlapUTC(checkInUTC, checkOutUTC, bStart, bEnd)) {
        return false; // suprapunere
      }
    }

    return true; // liber și în intervalul disponibil
  } catch (err) {
    console.log('Eroare în verificarea disponibilității', err);
    return false;
  }
}

export default checkRoomAvailability;
