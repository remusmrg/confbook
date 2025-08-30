'use server';

import { createSessionClient } from '@/config/appwrite';
import { cookies } from 'next/headers';
import { Query } from 'node-appwrite';
import { redirect } from 'next/navigation';
import { DateTime } from 'luxon';

// ✅ CRITICAL FIX pentru Vercel: Funcție pentru conversii timezone consistente
function toUTCDateTime(dateString) {
  // Forțăm interpretarea ca UTC, exact cum salvăm în bookRoom.js
  return DateTime.fromISO(dateString, { zone: 'utc' });
}

// ✅ CRITICAL FIX: Funcție pentru a verifica suprapunerile
function dateRangesOverlap(checkInA, checkOutA, checkInB, checkOutB) {
  console.log('=== OVERLAP CHECK DEBUG ===');
  console.log('Booking A (new):', checkInA.toISO(), 'to', checkOutA.toISO());
  console.log('Booking B (existing):', checkInB.toISO(), 'to', checkOutB.toISO());
  
  // Două intervale se suprapun dacă:
  // startA < endB AND endA > startB
  const overlaps = checkInA < checkOutB && checkOutA > checkInB;
  
  console.log('Overlaps?', overlaps);
  
  // Debug suplimentar
  console.log('checkInA < checkOutB:', checkInA < checkOutB, `(${checkInA.toISO()} < ${checkOutB.toISO()})`);
  console.log('checkOutA > checkInB:', checkOutA > checkInB, `(${checkOutA.toISO()} > ${checkInB.toISO()})`);
  
  return overlaps;
}

async function checkRoomAvailability(roomId, checkIn, checkOut) {
  console.log('=== checkRoomAvailability START ===');
  console.log('Server timezone (process.env.TZ):', process.env.TZ || 'Not set (defaults to UTC on Vercel)');
  console.log('Input checkIn:', checkIn);
  console.log('Input checkOut:', checkOut);
  
  const sessionCookie = cookies().get('appwrite-session');
  if (!sessionCookie) {
    redirect('/login');
  }

  try {
    const { databases } = await createSessionClient(sessionCookie.value);

    // ✅ CRITICAL: Convertim la UTC DateTime objects folosind Luxon
    // Aceștia ar trebui să fie deja în format UTC ISO de la bookRoom.js
    const checkInDateTime = toUTCDateTime(checkIn);
    const checkOutDateTime = toUTCDateTime(checkOut);
    
    console.log('Converted to UTC DateTime objects:');
    console.log('checkInDateTime:', checkInDateTime.toISO());
    console.log('checkOutDateTime:', checkOutDateTime.toISO());

    // Fetch all bookings for a given room
    console.log('Fetching existing bookings for room:', roomId);
    const { documents: bookings } = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BOOKINGS,
      [Query.equal('room_id', roomId)]
    );

    console.log(`Found ${bookings.length} existing bookings for this room`);

    // ✅ Loop over bookings and check for overlaps
    for (let i = 0; i < bookings.length; i++) {
      const booking = bookings[i];
      console.log(`\n--- Checking booking ${i + 1}/${bookings.length} ---`);
      console.log('Booking data from DB:', {
        id: booking.$id,
        check_in: booking.check_in,
        check_out: booking.check_out
      });
      
      // ✅ CRITICAL: Convertim și rezervările existente la UTC DateTime
      const bookingCheckInDateTime = toUTCDateTime(booking.check_in);
      const bookingCheckOutDateTime = toUTCDateTime(booking.check_out);
      
      console.log('Converted existing booking times:');
      console.log('bookingCheckInDateTime:', bookingCheckInDateTime.toISO());
      console.log('bookingCheckOutDateTime:', bookingCheckOutDateTime.toISO());

      // ✅ Verificăm suprapunerea
      if (dateRangesOverlap(
        checkInDateTime,
        checkOutDateTime,
        bookingCheckInDateTime,
        bookingCheckOutDateTime
      )) {
        console.log('❌ OVERLAP DETECTED! Booking not allowed.');
        return false; // Overlap found, do not book
      } else {
        console.log('✅ No overlap with this booking.');
      }
    }

    // No overlap found, continue to book
    console.log('✅ No overlaps found with any existing bookings. Booking is allowed.');
    console.log('=== checkRoomAvailability END ===');
    return true;
    
  } catch (error) {
    console.error('❌ Error in checkRoomAvailability:', error);
    return {
      error: 'Eroare în verificarea disponibilității',
    };
  }
}

export default checkRoomAvailability;