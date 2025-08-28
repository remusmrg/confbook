'use server';
import { createAdminClient } from '@/config/appwrite';

async function requestPasswordReset(previousState, formData) {
  const email = formData.get('email');

  if (!email) {
    return {
      error: 'Vă rugăm să introduceți adresa de email',
    };
  }

  try {
    const { account } = await createAdminClient();
    
    // Appwrite trimite automat email cu link de resetare
    await account.createRecovery(
      email,
      `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/reset-password`
    );

    return {
      success: true,
      message: 'Un email cu instrucțiunile de resetare a fost trimis la adresa specificată.',
    };
  } catch (error) {
    console.log('Eroare la resetarea parolei:', error);
    
    // Nu dezvăluim dacă email-ul există sau nu (securitate)
    return {
      success: true, 
      message: 'Un email cu instrucțiunile de resetare a fost trimis la adresa specificată.',
    };
  }
}

export default requestPasswordReset;