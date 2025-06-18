'use server';

import { createAdminClient } from '@/config/appwrite';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function getAllRooms() {
  try {
    const { databases } = await createAdminClient();

    // Fetch rooms
    const { documents: rooms } = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ROOMS
    );

    if (!rooms.length) return [];

    // Colectează user_id-urile
    const userIds = [...new Set(rooms.map((room) => room.user_id))];

    const usersMap = {};

    for (const id of userIds) {
      try {
        const userDoc = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USERS,
          id
        );
        usersMap[id] = userDoc.name;
      } catch {
        usersMap[id] = 'Necunoscut';
      }
    }

    // Atașează numele userului la fiecare cameră
    const roomsWithPostedBy = rooms.map((room) => ({
      ...room,
      postedBy: usersMap[room.user_id] || 'Necunoscut',
    }));

    // revalidatePath('/', 'layout');

    return roomsWithPostedBy;
  } catch (error) {
    console.log('Failed to get rooms', error);
    redirect('/error');
  }
}

export default getAllRooms;
