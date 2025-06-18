'use server';

import { createSessionClient } from '@/config/appwrite';
import { cookies } from 'next/headers';
import { ID } from 'node-appwrite';
import { redirect } from 'next/navigation';
import checkAuth from './checkAuth';
import checkRoomAvailability from './checkRoomAvailability';
// import { revalidatePath } from 'next/cache'; // deblochează dacă vrei revalidare

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

    const checkInDateTime = new Date(`${checkInDate}T${checkInTime}`);
    const checkOutDateTime = new Date(`${checkOutDate}T${checkOutTime}`);
    const now = new Date();

    // ✅ Validare date
    if (checkInDateTime < now) {
      return { error: 'Check-in cannot be in the past' };
    }

    if (checkOutDateTime <= checkInDateTime) {
      return { error: 'Check-out must be after check-in' };
    }

    // ✅ Verificare disponibilitate
    const isAvailable = await checkRoomAvailability(
      roomId,
      checkInDateTime.toISOString(),
      checkOutDateTime.toISOString()
    );

    if (!isAvailable) {
      return {
        error: 'This room is already booked for the selected time',
      };
    }

    const bookingData = {
      check_in: checkInDateTime.toISOString(),
      check_out: checkOutDateTime.toISOString(),
      user_id: user.id,
      room_id: roomId,
    };

    await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BOOKINGS,
      ID.unique(),
      bookingData
    );

    // Revalidare dacă e cazul:
    // revalidatePath('/bookings', 'layout');

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
