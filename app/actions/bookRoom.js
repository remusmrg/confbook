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

    if (!user) return { error: 'Trebuie sa fiți autentificat ca să faceți o rezervare.' };

    const checkInDate = formData.get('check_in_date');
    const checkInTime = formData.get('check_in_time');
    const checkOutDate = formData.get('check_out_date');
    const checkOutTime = formData.get('check_out_time');
    const roomId = formData.get('room_id');
    const userTimezone = formData.get('user_timezone') || 'Europe/Bucharest';

    console.log('=== BOOKING TIMEZONE DEBUG (VERCEL FIXED) ===');
    console.log('User timezone:', userTimezone);
    console.log('Server timezone (process.env.TZ):', process.env.TZ || 'UTC (Vercel default)');
    console.log('Input values:', { checkInDate, checkInTime, checkOutDate, checkOutTime });

    // ✅ CRITICAL FIX: Crează DateTime-uri explicite în fusul orar al utilizatorului
    // Funcționează perfect pe Vercel unde serverul e în UTC
    const checkInLocal = DateTime.fromFormat(
      `${checkInDate} ${checkInTime}`,
      'yyyy-MM-dd HH:mm',
      { zone: userTimezone }
    );

    const checkOutLocal = DateTime.fromFormat(
      `${checkOutDate} ${checkOutTime}`,
      'yyyy-MM-dd HH:mm',
      { zone: userTimezone }
    );

    // ✅ Pentru validarea disponibilității, ÎNTOTDEAUNA convertim la România
    const checkInRomania = checkInLocal.setZone('Europe/Bucharest');
    const checkOutRomania = checkOutLocal.setZone('Europe/Bucharest');
    
    // ✅ "Acum" în România pentru validarea "în trecut"
    const nowRomania = DateTime.now().setZone('Europe/Bucharest');

    console.log('=== TIMEZONE CONVERSIONS ===');
    console.log('checkInLocal (user tz):', checkInLocal.toISO());
    console.log('checkOutLocal (user tz):', checkOutLocal.toISO());
    console.log('checkInRomania (validation tz):', checkInRomania.toISO());
    console.log('checkOutRomania (validation tz):', checkOutRomania.toISO());
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

    // ✅ Validare disponibilitate - FOLOSEȘTE ORELE DIN ROMÂNIA!
    if (room.availability) {
      const availability = parseAvailability(room.availability);

      // ✅ CRITICAL: Convertește la JavaScript Date în fusul României
      // pentru că funcția isBookingWithinAvailability lucrează cu Date native
      const checkInRomaniaJS = checkInRomania.toJSDate();
      const checkOutRomaniaJS = checkOutRomania.toJSDate();

      console.log('=== AVAILABILITY VALIDATION (ROMANIA TIME) ===');
      console.log('checkInRomaniaJS:', checkInRomaniaJS.toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' }));
      console.log('checkOutRomaniaJS:', checkOutRomaniaJS.toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' }));
      console.log('JS Date getHours() for check-in:', checkInRomaniaJS.getHours());
      console.log('JS Date getMinutes() for check-in:', checkInRomaniaJS.getMinutes());

      const availabilityCheck = isBookingWithinAvailability(
        checkInRomaniaJS,
        checkOutRomaniaJS,
        availability
      );

      console.log('availabilityCheck result:', availabilityCheck);

      if (!availabilityCheck.isValid) {
        let errorMessage = availabilityCheck.message;

        // ✅ Afișează orele în fusul utilizatorului pentru claritate
        if (userTimezone !== 'Europe/Bucharest') {
          const userCheckInTime = checkInLocal.toFormat('HH:mm');
          const userCheckOutTime = checkOutLocal.toFormat('HH:mm');
          const romaniaCheckInTime = checkInRomania.toFormat('HH:mm');
          const romaniaCheckOutTime = checkOutRomania.toFormat('HH:mm');

          errorMessage += ` (Orele selectate ${userCheckInTime}-${userCheckOutTime} în fusul dvs. corespund cu ${romaniaCheckInTime}-${romaniaCheckOutTime} ora României)`;
        }

        return { error: errorMessage };
      }
    }

    // ✅ CRITICAL: Pentru baza de date și verificarea disponibilității, ÎNTOTDEAUNA salvează în UTC
    const checkInUTC = checkInLocal.toUTC();
    const checkOutUTC = checkOutLocal.toUTC();

    console.log('=== FINAL UTC STORAGE ===');
    console.log('checkInUTC pentru DB:', checkInUTC.toISO());
    console.log('checkOutUTC pentru DB:', checkOutUTC.toISO());

    // ✅ Verifică disponibilitatea pentru rezervări existente
    // Trimitem la checkRoomAvailability în format UTC ISO string
    const isAvailable = await checkRoomAvailability(
      roomId,
      checkInUTC.toISO(),
      checkOutUTC.toISO()
    );

    if (!isAvailable) return { error: 'Această sală este deja rezervată pentru perioada selectată' };

    // ✅ Salvează în baza de date în UTC
    const bookingData = {
      check_in: checkInUTC.toISO(),
      check_out: checkOutUTC.toISO(),
      user_id: user.id,
      room_id: roomId,
    };

    console.log('=== SAVING TO DATABASE ===');
    console.log('bookingData:', bookingData);

    await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BOOKINGS,
      ID.unique(),
      bookingData
    );

    return { success: true };

  } catch (error) {
    console.error('Failed to book room:', error);
    return { error: 'A apărut o eroare la rezervarea sălii' };
  }
}

export default bookRoom;