'use server';

import { createSessionClient, createAdminClient } from '@/config/appwrite';
import { cookies } from 'next/headers';
import { Query } from 'node-appwrite';
import checkAuth from './checkAuth';

async function getMyRoomBookings() {
  const sessionCookie = cookies().get('appwrite-session');
  if (!sessionCookie) return [];

  const { databases } = await createSessionClient(sessionCookie.value);
  const { user } = await checkAuth();

  const { documents: myRooms } = await databases.listDocuments(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ROOMS,
    [Query.equal('user_id', user.id)]
  );

  if (!myRooms.length) return [];

  const roomIds = myRooms.map((room) => room.$id);

  const { documents: bookings } = await databases.listDocuments(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
    process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BOOKINGS,
    [Query.equal('room_id', roomIds)]
  );

  if (!bookings.length) return [];

  const userIds = [...new Set(bookings.map((b) => b.user_id))];

  // Folosește clientul admin pentru acces la usersdata
  const { databases: adminDB } = await createAdminClient();

  const usersMap = {};
  for (const id of userIds) {
    try {
      const userDoc = await adminDB.getDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
        process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USERS,
        id
      );
      usersMap[id] = {
        name: userDoc.name,
        email: userDoc.email,
      };
    } catch {
      usersMap[id] = {
        name: 'Necunoscut',
        email: '—',
      };
    }
  }

  const bookingsWithUsers = bookings.map((booking) => ({
    ...booking,
    userName: usersMap[booking.user_id]?.name || 'Necunoscut',
    userEmail: usersMap[booking.user_id]?.email || '—',
  }));

  return bookingsWithUsers;
}

export default getMyRoomBookings;
