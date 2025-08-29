'use server';

import { createAdminClient, createSessionClient } from '@/config/appwrite';
import { cookies } from 'next/headers';
import { Query } from 'node-appwrite';
import { redirect } from 'next/navigation';
import checkAdminAuth from '@/app/actions/checkAdminAuth';

// Verifică dacă utilizatorul este admin
async function verifyAdminAccess() {
  const { isAuthenticated, isAdmin } = await checkAdminAuth();
  
  if (!isAuthenticated) {
    redirect('/login');
  }
  
  if (!isAdmin) {
    redirect('/');
  }
  
  return true;
}

// Obține toate sălile
export async function getAllRoomsAdmin() {
  await verifyAdminAccess();
  
  try {
    const { databases } = await createAdminClient();

    const { documents: rooms } = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ROOMS
    );

    if (!rooms.length) return [];

    // Obține informații despre proprietarii sălilor
    const userIds = [...new Set(rooms.map((room) => room.user_id))];
    const usersMap = {};

    for (const id of userIds) {
      try {
        const userDoc = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USERS,
          id
        );
        usersMap[id] = userDoc;
      } catch {
        usersMap[id] = { name: 'Necunoscut', email: '—' };
      }
    }

    const roomsWithOwners = rooms.map((room) => ({
      ...room,
      owner: usersMap[room.user_id] || { name: 'Necunoscut', email: '—' },
    }));

    return roomsWithOwners;
  } catch (error) {
    console.log('Failed to get rooms for admin', error);
    throw new Error('Eroare la obținerea sălilor');
  }
}

// Obține toți utilizatorii
export async function getAllUsersAdmin() {
  await verifyAdminAccess();
  
  try {
    const { databases } = await createAdminClient();

    const { documents: users } = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USERS
    );

    return users;
  } catch (error) {
    console.log('Failed to get users for admin', error);
    throw new Error('Eroare la obținerea utilizatorilor');
  }
}

// Obține toate rezervările
export async function getAllBookingsAdmin() {
  await verifyAdminAccess();
  
  try {
    const { databases } = await createAdminClient();

    const { documents: bookings } = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BOOKINGS
    );

    if (!bookings.length) return [];

    // Debug: Log pentru a vedea structura datelor
    console.log('Sample booking structure:', bookings[0]);

    // Obține informații despre utilizatori și săli
    const userIds = [...new Set(bookings.map((b) => b.user_id))];
    const roomIds = [...new Set(bookings.map((b) => {
      // Verifică dacă room_id este un obiect cu $id sau un string direct
      const roomId = typeof b.room_id === 'object' ? b.room_id.$id : b.room_id;
      return roomId;
    }))];

    console.log('Room IDs extracted:', roomIds);

    const usersMap = {};
    const roomsMap = {};

    // Obține utilizatori
    for (const id of userIds) {
      try {
        const userDoc = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USERS,
          id
        );
        usersMap[id] = userDoc;
      } catch (error) {
        console.log(`Failed to get user ${id}:`, error);
        usersMap[id] = { name: 'Necunoscut', email: '—' };
      }
    }

    // Obține săli
    for (const id of roomIds) {
      if (!id) continue; // Skip dacă id este null/undefined
      
      try {
        const roomDoc = await databases.getDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ROOMS,
          id
        );
        roomsMap[id] = roomDoc;
        console.log(`Successfully got room ${id}:`, roomDoc.name);
      } catch (error) {
        console.log(`Failed to get room ${id}:`, error);
        roomsMap[id] = { name: 'Sala ștearsă' };
      }
    }

    console.log('Rooms map:', Object.keys(roomsMap));

    const bookingsWithDetails = bookings.map((booking) => {
      const roomId = typeof booking.room_id === 'object' ? booking.room_id.$id : booking.room_id;
      const userId = typeof booking.user_id === 'object' ? booking.user_id.$id : booking.user_id;
      
      return {
        ...booking,
        user: usersMap[userId] || { name: 'Necunoscut', email: '—' },
        room: roomsMap[roomId] || { name: 'Sala ștearsă' },
      };
    });

    return bookingsWithDetails;
  } catch (error) {
    console.log('Failed to get bookings for admin', error);
    throw new Error('Eroare la obținerea rezervărilor');
  }
}

// Șterge o sală (doar admin)
export async function deleteRoomAdmin(roomId) {
  await verifyAdminAccess();

  try {
    const { databases } = await createAdminClient();

    await databases.deleteDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ROOMS,
      roomId
    );

    return { success: true };
  } catch (error) {
    console.log('Eroare în ștergerea sălii (admin)', error);
    return { error: 'Eroare în ștergerea sălii' };
  }
}

// Șterge un utilizator (doar admin)
export async function deleteUserAdmin(userId) {
  await verifyAdminAccess();

  try {
    const { databases, account } = await createAdminClient();

    // Șterge documentul utilizatorului din colecția users
    await databases.deleteDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USERS,
      userId
    );

    // Opțional: Șterge și contul din Appwrite Auth
    // Atenție: Aceasta va șterge complet utilizatorul din sistem
    try {
      await account.delete(userId);
    } catch (authError) {
      console.log('Nu s-a putut șterge contul din Auth:', authError);
      // Continuă și returnează succes - cel puțin documentul a fost șters
    }

    return { success: true };
  } catch (error) {
    console.log('Eroare în ștergerea utilizatorului (admin)', error);
    return { error: 'Eroare în ștergerea utilizatorului' };
  }
}

// Șterge o rezervare (doar admin)
export async function deleteBookingAdmin(bookingId) {
  await verifyAdminAccess();

  try {
    const { databases } = await createAdminClient();

    await databases.deleteDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BOOKINGS,
      bookingId
    );

    return { success: true };
  } catch (error) {
    console.log('Eroare în ștergerea rezervării (admin)', error);
    return { error: 'Eroare în ștergerea rezervării' };
  }
}