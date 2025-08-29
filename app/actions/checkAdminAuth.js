'use server';
import { createSessionClient } from '@/config/appwrite';
import { cookies } from 'next/headers';

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('appwrite-session');

  if (!sessionCookie) {
    return {
      isAuthenticated: false,
      isAdmin: false,
    };
  }

  try {
    const { account } = await createSessionClient(sessionCookie.value);
    const user = await account.get();

    const isAdmin = user.labels && user.labels.includes('admin');

    return {
      isAuthenticated: true,
      isAdmin,
      user: {
        id: user.$id,
        name: user.name,
        email: user.email,
        labels: user.labels || [],
      },
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      isAdmin: false,
    };
  }
}

export default checkAdminAuth;