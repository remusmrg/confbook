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
    
    // Construiește URL-ul corect pentru resetarea parolei
    // În production: folosește VERCEL_URL sau NEXT_PUBLIC_APP_URL
    // În development: folosește localhost
    let resetUrl;
    
    if (process.env.NODE_ENV === 'production') {
      // Pentru production, încearcă să folosești NEXT_PUBLIC_APP_URL, apoi VERCEL_URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
      
      if (!baseUrl) {
        console.error('Nu s-a găsit NEXT_PUBLIC_APP_URL sau VERCEL_URL în production');
        return {
          error: 'Configurația serverului este incorectă. Contactați administratorul.',
        };
      }
      
      resetUrl = `${baseUrl}/reset-password`;
    } else {
      // Pentru development
      resetUrl = 'http://localhost:3000/reset-password';
    }

    console.log('Reset URL folosit:', resetUrl); // Pentru debugging
    
    // Appwrite trimite automat email cu link de resetare
    await account.createRecovery(email, resetUrl);

    return {
      success: true,
      message: 'Un email cu instrucțiunile de resetare a fost trimis la adresa specificată.',
    };
  } catch (error) {
    console.error('Eroare la resetarea parolei:', error);
    
    // Nu dezvăluim dacă email-ul există sau nu (securitate)
    // Dar logăm eroarea pentru debugging
    return {
      success: true, 
      message: 'Un email cu instrucțiunile de resetare a fost trimis la adresa specificată.',
    };
  }
}

export default requestPasswordReset;