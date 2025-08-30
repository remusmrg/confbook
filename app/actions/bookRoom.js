// app/actions/bookRoom.js
'use server';

import { createSessionClient } from '@/config/appwrite';
import { cookies } from 'next/headers';
import { ID, Query } from 'node-appwrite';
import { redirect } from 'next/navigation';

async function checkRoomAvailability(roomId, checkInUTC, checkOutUTC) {
  const sessionCookie = cookies().get('appwrite-session');
  if (!sessionCookie) redirect('/login');

  const { databases } = await createSessionClient(sessionCookie.value);

  const { documents: bookings } = await databases.listDocuments(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BOOKINGS,
    [Query.equal('room_id', roomId)]
  );

  for (const booking of bookings) {
    const bStart = new Date(booking.check_in).getTime();
    const bEnd = new Date(booking.check_out).getTime();

    if (checkInUTC.getTime() < bEnd && checkOutUTC.getTime() > bStart) {
      return false; // overlap
    }
  }

  return true;
}

async function bookRoom(previousState, formData) {
  const sessionCookie = cookies().get('appwrite-session');
  if (!sessionCookie) redirect('/login');

  try {
    const { databases } = await createSessionClient(sessionCookie.value);
    const user = { id: 'dummy' }; // înlocuiește cu checkAuth() dacă ai

    if (!user) return { error: 'Trebuie să fiți autentificat pentru a face o rezervare.' };

    const checkInUTC = new Date(formData.get('check_in'));   // deja UTC de la frontend
    const checkOutUTC = new Date(formData.get('check_out')); // deja UTC de la frontend
    const roomId = formData.get('room_id');

    if (checkOutUTC <= checkInUTC) return { error: 'Check-out trebuie să fie după check-in.' };

    const available = await checkRoomAvailability(roomId, checkInUTC, checkOutUTC);
    if (!available) return { error: 'Sala este deja rezervată în acest interval.' };

    await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BOOKINGS,
      ID.unique(),
      {
        room_id: roomId,
        user_id: user.id,
        check_in: checkInUTC.toISOString(),
        check_out: checkOutUTC.toISOString()
      }
    );

    return { success: true };
  } catch (err) {
    console.log('Failed to book room', err);
    return { error: 'A apărut o eroare la rezervarea sălii.' };
  }
}

export default bookRoom;
