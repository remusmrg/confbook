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

    // Construiește datele cu fus orar explicit
    const checkInLocal = DateTime.fromISO(`${checkInDate}T${checkInTime}`, {
      zone: 'Europe/Bucharest',
    });
    const checkOutLocal = DateTime.fromISO(`${checkOutDate}T${checkOutTime}`, {
      zone: 'Europe/Bucharest',
    });

    const checkInDateTime = checkInLocal.toUTC();
    const checkOutDateTime = checkOutLocal.toUTC();
    const now = DateTime.now().setZone('Europe/Bucharest');

    // ✅ Validare date
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

    // ✅ Validare disponibilitate pe baza programului sălii
    if (room.availability) {
      const availability = parseAvailability(room.availability);
      const availabilityCheck = isBookingWithinAvailability(
        checkInLocal.toJSDate(),
        checkOutLocal.toJSDate(),
        availability
      );
      
      if (!availabilityCheck.isValid) {
        return {
          error: `Rezervarea nu respectă programul sălii: ${availabilityCheck.message}`
        };
      }
    }

    // ✅ Verificare disponibilitate (conflicte cu alte rezervări)
    const isAvailable = await checkRoomAvailability(
      roomId,
      checkInDateTime.toISO(),
      checkOutDateTime.toISO()
    );

    if (!isAvailable) {
      return {
        error: 'Această sală este deja rezervată pentru perioada selectată',
      };
    }

    const bookingData = {
      check_in: checkInDateTime.toISO(),     // Salvezi în UTC
      check_out: checkOutDateTime.toISO(),
      user_id: user.id,
      room_id: roomId,
    };

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