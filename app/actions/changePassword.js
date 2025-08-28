'use server';
import { createSessionClient } from '@/config/appwrite';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import checkAuth from './checkAuth';

async function changePassword(previousState, formData) {
  const sessionCookie = cookies().get('appwrite-session');
  if (!sessionCookie) {
    redirect('/login');
  }

  const currentPassword = formData.get('currentPassword');
  const newPassword = formData.get('newPassword');
  const confirmPassword = formData.get('confirmPassword');

  if (!currentPassword || !newPassword || !confirmPassword) {
    return {
      error: 'Toate câmpurile sunt obligatorii',
    };
  }

  if (newPassword.length < 8) {
    return {
      error: 'Parola nouă trebuie să aibă cel puțin 8 caractere',
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      error: 'Parolele noi nu se potrivesc',
    };
  }

  if (currentPassword === newPassword) {
    return {
      error: 'Parola nouă trebuie să fie diferită de cea actuală',
    };
  }

  try {
    const { account } = await createSessionClient(sessionCookie.value);
    const { user } = await checkAuth();

    if (!user) {
      return {
        error: 'Trebuie să fiți autentificat pentru a schimba parola',
      };
    }

    // Schimbă parola
    await account.updatePassword(newPassword, currentPassword);

    return {
      success: true,
      message: 'Parola a fost schimbată cu succes!',
    };
  } catch (error) {
    console.log('Eroare la schimbarea parolei:', error);
    
    if (error.code === 401) {
      return {
        error: 'Parola actuală este incorectă',
      };
    }

    return {
      error: 'A apărut o eroare la schimbarea parolei. Încercați din nou.',
    };
  }
}

export default changePassword;