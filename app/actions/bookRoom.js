// app/actions/bookRoom.js
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
      return { error: 'Trebuie sa fiți autentificat ca să faceți o rezervare.' };
    }

    const checkInDate = formData.get('check_in_date');
    const checkInTime = formData.get('check_in_time');
    const checkOutDate = formData.get('check_out_date');
    const checkOutTime = formData.get('check_out_time');
    const roomId = formData.get('room_id');
    const userTimezone = formData.get('user_timezone') || 'Europe/Bucharest';

    console.log('=== BOOKING TIMEZONE DEBUG ===');
    console.log('User timezone:', userTimezone);
    console.log('Input values:', { checkInDate, checkInTime, checkOutDate, checkOutTime });

    // ✅ Parse inputul exact ca ora locală a utilizatorului
    const checkInLocal = DateTime.fromFormat(
      `${checkInDate}T${checkInTime}`,
      "yyyy-MM-dd'T'HH:mm",
      { zone: userTimezone, setZone: true }
    );

    const checkOutLocal = DateTime.fromFormat(
      `${checkOutDate}T${checkOutTime}`,
      "yyyy-MM-dd'T'HH:mm",
      { zone: userTimezone, setZone: true }
    );

    // ✅ Conversie pentru validarea disponibilității în fusul României
    const checkInRomania = checkInLocal.setZone('Europe/Bucharest');
    const checkOutRomania = checkOutLocal.setZone('Europe/Bucharest');
    const nowRomania = DateTime.now().setZone('Europe/Bucharest');

    console.log('checkInLocal (user tz):', checkInLocal.toISO());
    console.log('checkOutLocal (user tz):', checkOutLocal.toISO());
    console.log('checkInRomania:', checkInRomania.toISO());
    console.log('checkOutRomania:', checkOutRomania.toISO());
    console.log('nowRomania:', nowRomania.toISO());

    // ✅ Validări
    if (!checkInLocal.isValid) return { error: 'Data și ora de check-in sunt invalide' };
    if (!checkOutLocal.isValid) return { error: 'Data și ora de check-out sunt invalide' };
    if (checkInRomania < nowRomania) return { error: 'Check-in nu poate fi în trecut' };
    if (checkOutRomania <= checkInRomania) return { error: 'Check-out trebuie să fie după check-in' };

    // ✅ Obține sala
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

    // ✅ Validare disponibilitate (România)
    if (room.availability) {
      const availability = parseAvailability(room.availability);

      const checkInRomaniaJS = checkInRomania.toJSDate();
      const checkOutRomaniaJS = checkOutRomania.toJSDate();

      console.log('=== AVAILABILITY VALIDATION ===');
      console.log('checkInRomaniaJS:', checkInRomaniaJS);
      console.log('checkOutRomaniaJS:', checkOutRomaniaJS);

      const availabilityCheck = isBookingWithinAvailability(
        checkInRomaniaJS,
        checkOutRomaniaJS,
        availability
      );

      console.log('availabilityCheck result:', availabilityCheck);

      if (!availabilityCheck.isValid) {
        const userCheckInTime = checkInLocal.toFormat('HH:mm');
        const userCheckOutTime = checkOutLocal.toFormat('HH:mm');
        const romaniaCheckInTime = checkInRomania.toFormat('HH:mm');
        const romaniaCheckOutTime = checkOutRomania.toFormat('HH:mm');

        let errorMessage = availabilityCheck.message;

        if (userTimezone !== 'Europe/Bucharest') {
          errorMessage += ` (Orele selectate ${userCheckInTime}-${userCheckOutTime} în fusul dvs. corespund cu ${romaniaCheckInTime}-${romaniaCheckOutTime} ora României)`;
        }

        return { error: errorMessage };
      }
    }

    // ✅ Convertim în UTC pentru DB
    const checkInUTC = checkInLocal.toUTC();
    const checkOutUTC = checkOutLocal.toUTC();

    const isAvailable = await checkRoomAvailability(
      roomId,
      checkInUTC.toISO(),
      checkOutUTC.toISO()
    );

    if (!isAvailable) {
      return { error: 'Această sală este deja rezervată pentru perioada selectată' };
    }

    const bookingData = {
      check_in: checkInUTC.toISO(),
      check_out: checkOutUTC.toISO(),
      user_id: user.id,
      room_id: roomId,
    };

    await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BOOKINGS,
      ID.unique(),
      bookingData
    );

    return { success: true };

  } catch (error) {
    console.log('Failed to book room', error);
    return { error: 'A apărut o eroare la rezervarea sălii' };
  }
}

export default bookRoom;
