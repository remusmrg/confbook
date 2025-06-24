'use server';

import { createSessionClient } from '@/config/appwrite';
import { cookies } from 'next/headers';
import { Query } from 'node-appwrite';
import { redirect } from 'next/navigation';
import checkAuth from './checkAuth';

async function getMyBookings() {
  const cookieStore = cookies();           // obține store-ul de cookie-uri
  const sessionCookie = cookieStore.get('appwrite-session');  // obține cookie-ul

  if (!sessionCookie) {
    redirect('/login');
  }

  try {
    const { databases } = await createSessionClient(sessionCookie.value);

    // Get user's ID
    const { user } = await checkAuth();

    if (!user) {
      return {
        error: 'Trebuie să fii autentificat pentru a vedea rezervările.',
      };
    }

    // Fetch users bookings
    const { documents: bookings } = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_BOOKINGS,
      [Query.equal('user_id', user.id)]
    );

    return bookings;
  } catch (error) {
    console.log('Nu s-au putut obține rezervările utilizatorului!', error);
    return {
      error: 'Nu s-au putut obține rezervările',
    };
  }
}

export default getMyBookings;
