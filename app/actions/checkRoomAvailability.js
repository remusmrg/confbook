// app/actions/checkRoomAvailability.js
'use server';

import { createSessionClient } from '@/config/appwrite';
import { cookies } from 'next/headers';
import { Query } from 'node-appwrite';
import { redirect } from 'next/navigation';

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
 * @returns {boolean} true dacă sala este liberă
 */
async function checkRoomAvailability(roomId, checkInUTC, checkOutUTC) {
  const sessionCookie = cookies().get('appwrite-session');
  if (!sessionCookie) redirect('/login');

  try {
    const { databases } = await createSessionClient(sessionCookie.value);

    // Preluăm toate rezervările existente pentru sală
    const { documents: bookings } = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BOOKINGS,
      [Query.equal('room_id', roomId)]
    );

    for (const booking of bookings) {
      const bStart = new Date(booking.check_in);
      const bEnd = new Date(booking.check_out);

      if (dateRangesOverlapUTC(checkInUTC, checkOutUTC, bStart, bEnd)) {
        return false; // overlapping
      }
    }

    return true;
  } catch (err) {
    console.log('Eroare în verificarea disponibilității', err);
    return false;
  }
}

export default checkRoomAvailability;
