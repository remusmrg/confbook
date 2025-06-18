'use server';

import { createSessionClient } from '@/config/appwrite';
import { cookies } from 'next/headers';
import { ID } from 'node-appwrite';
import { redirect } from 'next/navigation';
import checkAuth from './checkAuth';
import checkRoomAvailability from './checkRoomAvailability';
import { DateTime } from 'luxon';

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
        error: 'You must be logged in to book a room',
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
      return { error: 'Check-in cannot be in the past' };
    }

    if (checkOutLocal <= checkInLocal) {
      return { error: 'Check-out must be after check-in' };
    }

    // ✅ Verificare disponibilitate
    const isAvailable = await checkRoomAvailability(
      roomId,
      checkInDateTime.toISO(),
      checkOutDateTime.toISO()
    );

    if (!isAvailable) {
      return {
        error: 'This room is already booked for the selected time',
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
      error: 'Something went wrong booking the room',
    };
  }
}

export default bookRoom;
