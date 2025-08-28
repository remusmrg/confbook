'use server';
import { createAdminClient } from '@/config/appwrite';

async function resetPassword(previousState, formData) {
  const userId = formData.get('userId');
  const secret = formData.get('secret');
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');

  if (!userId || !secret || !password || !confirmPassword) {
    return {
      error: 'Toate câmpurile sunt obligatorii',
    };
  }

  if (password.length < 8) {
    return {
      error: 'Parola trebuie să aibă cel puțin 8 caractere',
    };
  }

  if (password !== confirmPassword) {
    return {
      error: 'Parolele nu se potrivesc',
    };
  }

  try {
    const { account } = await createAdminClient();
    
    // Confirmă resetarea parolei cu token-ul din email
    await account.updateRecovery(userId, secret, password, confirmPassword);

    return {
      success: true,
      message: 'Parola a fost resetată cu succes! Vă puteți loga cu noua parolă.',
    };
  } catch (error) {
    console.log('Eroare la resetarea parolei:', error);
    
    if (error.code === 401) {
      return {
        error: 'Link-ul de resetare este invalid sau a expirat',
      };
    }

    return {
      error: 'A apărut o eroare la resetarea parolei. Încercați din nou.',
    };
  }
}

export default resetPassword;