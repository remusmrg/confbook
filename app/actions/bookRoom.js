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
      return {
        error: 'Trebuie sa fiți autentificat ca să faceți o rezervare.',
      };
    }

    const checkInDate = formData.get('check_in_date');
    const checkInTime = formData.get('check_in_time');
    const checkOutDate = formData.get('check_out_date');
    const checkOutTime = formData.get('check_out_time');
    const roomId = formData.get('room_id');
    
    // ✅ CRUCIAL: Obținem fusul orar al utilizatorului din formular
    const userTimezone = formData.get('user_timezone') || 'Europe/Bucharest';

    console.log('=== BOOKING TIMEZONE DEBUG ===');
    console.log('User timezone:', userTimezone);
    console.log('Input values:', { checkInDate, checkInTime, checkOutDate, checkOutTime });

    // ✅ Creăm obiectele DateTime cu fusul orar al utilizatorului
    const checkInLocal = DateTime.fromISO(`${checkInDate}T${checkInTime}`, {
      zone: userTimezone
    });
    
    const checkOutLocal = DateTime.fromISO(`${checkOutDate}T${checkOutTime}`, {
      zone: userTimezone
    });

    // ✅ Convertim în fusul orar al României pentru validarea disponibilității
    const checkInRomania = checkInLocal.setZone('Europe/Bucharest');
    const checkOutRomania = checkOutLocal.setZone('Europe/Bucharest');

    // Pentru comparații cu timpul curent, folosim fusul României
    const nowRomania = DateTime.now().setZone('Europe/Bucharest');

    console.log('Local user time:', {
      checkIn: checkInLocal.toISO(),
      checkOut: checkOutLocal.toISO()
    });
    console.log('Romania time:', {
      checkIn: checkInRomania.toISO(),
      checkOut: checkOutRomania.toISO()
    });

    // ✅ Validări de bază
    if (!checkInLocal.isValid) {
      return { error: 'Data și ora de check-in sunt invalide' };
    }

    if (!checkOutLocal.isValid) {
      return { error: 'Data și ora de check-out sunt invalide' };
    }

    if (checkInRomania < nowRomania) {
      return { error: 'Check-in nu poate fi în trecut' };
    }

    if (checkOutRomania <= checkInRomania) {
      return { error: 'Check-out trebuie să fie după check-in' };
    }

    // ✅ Obține informații despre sală
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

    // ✅ Validare disponibilitate în fusul orar al României
    if (room.availability) {
      const availability = parseAvailability(room.availability);
      
      // IMPORTANT: Validarea se face în timpul României, folosind Date objects
      const checkInRomaniaJS = checkInRomania.toJSDate();
      const checkOutRomaniaJS = checkOutRomania.toJSDate();
      
      console.log('=== AVAILABILITY VALIDATION (Romania time) ===');
      console.log('Check-in Romania JS Date:', checkInRomaniaJS);
      console.log('Check-out Romania JS Date:', checkOutRomaniaJS);
      
      const availabilityCheck = isBookingWithinAvailability(
        checkInRomaniaJS,
        checkOutRomaniaJS,
        availability
      );
      
      console.log('Availability check result:', availabilityCheck);
      
      if (!availabilityCheck.isValid) {
        // ✅ Mesaj de eroare cu orele în timpul utilizatorului
        const userCheckInTime = checkInLocal.toFormat('HH:mm');
        const userCheckOutTime = checkOutLocal.toFormat('HH:mm');
        const romaniaCheckInTime = checkInRomania.toFormat('HH:mm');
        const romaniaCheckOutTime = checkOutRomania.toFormat('HH:mm');
        
        let errorMessage = availabilityCheck.message;
        
        // Dacă utilizatorul e în alt fus orar, explicăm conversia
        if (userTimezone !== 'Europe/Bucharest') {
          errorMessage += ` (Orele selectate ${userCheckInTime}-${userCheckOutTime} în fusul dvs. orar corespund cu ${romaniaCheckInTime}-${romaniaCheckOutTime} ora României, unde se află sala)`;
        }
        
        return {
          error: errorMessage
        };
      }
    }

    // ✅ Pentru baza de date și verificarea conflictelor, convertim în UTC
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