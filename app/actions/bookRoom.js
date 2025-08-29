'use server';

import { createSessionClient } from '@/config/appwrite';
import { cookies } from 'next/headers';
import { ID } from 'node-appwrite';
import { redirect } from 'next/navigation';
import checkAuth from './checkAuth';
import checkRoomAvailability from './checkRoomAvailability';
import { DateTime } from 'luxon';
import { parseAvailability, isBookingWithinAvailability } from '@/utils/availability';

async function bookRoom(previousState, formData) {
  const sessionCookie = cookies().get('appwrite-session');
  if (!sessionCookie) {
    redirect('/login');
  }

  try {
    const { databases } = await createSessionClient(sessionCookie.value);
    const { user } = await checkAuth();

    if (!user) {
      return {
        error: 'Trebuie sa fiți autentificat ca să faceți o rezervare.',
      };
    }

    const checkInDate = formData.get('check_in_date');
    const checkInTime = formData.get('check_in_time');
    const checkOutDate = formData.get('check_out_date');
    const checkOutTime = formData.get('check_out_time');
    const roomId = formData.get('room_id');

    // Construiește datele în fusul orar local (Bucharest)
    const checkInLocal = DateTime.fromISO(`${checkInDate}T${checkInTime}`, {
      zone: 'Europe/Bucharest',
    });
    const checkOutLocal = DateTime.fromISO(`${checkOutDate}T${checkOutTime}`, {
      zone: 'Europe/Bucharest',
    });

    // Pentru comparații și validări, lucrează în local time
    const now = DateTime.now().setZone('Europe/Bucharest');

    // ✅ Validare date de bază
    if (!checkInLocal.isValid) {
      return { error: 'Data și ora de check-in sunt invalide' };
    }

    if (!checkOutLocal.isValid) {
      return { error: 'Data și ora de check-out sunt invalide' };
    }

    if (checkInLocal < now) {
      return { error: 'Check-in nu poate fi în trecut' };
    }

    if (checkOutLocal <= checkInLocal) {
      return { error: 'Check-out trebuie să fie după check-in' };
    }

    // ✅ Obține informații despre sală pentru validarea disponibilității
    let room;
    try {
      room = await databases.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ROOMS,
        roomId
      );
    } catch (error) {
      return { error: 'Sala nu a fost găsită' };
    }

    // ✅ Validare disponibilitate pe baza programului sălii (în timp local!)
    if (room.availability) {
      const availability = parseAvailability(room.availability);
      
      // IMPORTANT: Folosim obiectele Date native pentru validarea disponibilității
      // pentru că funcția isBookingWithinAvailability așteaptă obiectele Date JavaScript
      const checkInDate_JS = checkInLocal.toJSDate();
      const checkOutDate_JS = checkOutLocal.toJSDate();
      
      console.log('=== DEBUG AVAILABILITY ===');
      console.log('Check-in local:', checkInLocal.toISO());
      console.log('Check-out local:', checkOutLocal.toISO());
      console.log('Check-in JS Date:', checkInDate_JS);
      console.log('Check-out JS Date:', checkOutDate_JS);
      console.log('Day of week (JS):', checkInDate_JS.getDay()); // 0=Sunday
      console.log('Day of week (European):', checkInDate_JS.getDay() === 0 ? 7 : checkInDate_JS.getDay()); // 1=Monday
      console.log('Room availability:', room.availability);
      console.log('Parsed availability:', availability);
      
      const availabilityCheck = isBookingWithinAvailability(
        checkInDate_JS,
        checkOutDate_JS,
        availability
      );
      
      console.log('Availability check result:', availabilityCheck);
      
      if (!availabilityCheck.isValid) {
        return {
          error: `Rezervarea nu respectă programul sălii: ${availabilityCheck.message}`
        };
      }
    }

    // ✅ Verificare disponibilitate (conflicte cu alte rezervări)
    // Pentru baza de date, convertim la UTC
    const checkInUTC = checkInLocal.toUTC();
    const checkOutUTC = checkOutLocal.toUTC();
    
    const isAvailable = await checkRoomAvailability(
      roomId,
      checkInUTC.toISO(),
      checkOutUTC.toISO()
    );

    if (!isAvailable) {
      return {
        error: 'Această sală este deja rezervată pentru perioada selectată',
      };
    }

    // ✅ Salvează în baza de date în format UTC
    const bookingData = {
      check_in: checkInUTC.toISO(),
      check_out: checkOutUTC.toISO(),
      user_id: user.id,
      room_id: roomId,
    };

    console.log('=== SAVING BOOKING ===');
    console.log('Local check-in:', checkInLocal.toISO());
    console.log('Local check-out:', checkOutLocal.toISO());
    console.log('UTC check-in (saved):', checkInUTC.toISO());
    console.log('UTC check-out (saved):', checkOutUTC.toISO());

    await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BOOKINGS,
      ID.unique(),
      bookingData
    );

    return {
      success: true,
    };
  } catch (error) {
    console.log('Failed to book room', error);
    return {
      error: 'A apărut o eroare la rezervarea sălii',
    };
  }
}

export default bookRoom;