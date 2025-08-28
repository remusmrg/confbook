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
    
    // Folosește NEXT_PUBLIC_APP în loc de NEXT_PUBLIC_APP_URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP || 'http://localhost:3000'}/reset-password`;
    
    // DEBUG: Log pentru verificare (poți să ștergi după ce merge)
    console.log('Reset URL folosit:', resetUrl);
    
    // Appwrite trimite automat email cu link de resetare
    await account.createRecovery(email, resetUrl);

    return {
      success: true,
      message: 'Un email cu instrucțiunile de resetare a fost trimis la adresa specificată.',
    };
  } catch (error) {
    console.error('Eroare la resetarea parolei:', error);
    
    // Nu dezvăluim dacă email-ul există sau nu (securitate)
    return {
      success: true, 
      message: 'Un email cu instrucțiunile de resetare a fost trimis la adresa specificată.',
    };
  }
}

export default requestPasswordReset;