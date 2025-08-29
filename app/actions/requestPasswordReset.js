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
    
    // Folosește NEXT_PUBLIC_URL (variabila ta existentă)
    const resetUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000/'}reset-password`;
    
    // DEBUG: Log pentru verificare
    console.log('Reset URL folosit:', resetUrl);
    console.log('Email pentru resetare:', email);
    
    // WORKAROUND pentru problema cu labels în Appwrite
    // Folosim createAdminClient în loc să lăsăm Appwrite să trimită emailul automat
    try {
      // Încearcă mai întâi metoda standard
      await account.createRecovery(email, resetUrl);
    } catch (error) {
      console.error('Eroare standard recovery:', error);
      
      // Dacă primim eroarea cu "labels", încercăm să găsim utilizatorul și să folosim ID-ul direct
      if (error.message && error.message.includes('labels')) {
        console.log('Detectată problema cu labels, încerc workaround...');
        
        try {
          // Încearcă din nou cu o abordare diferită
          // Uneori problema se rezolvă prin retry
          await new Promise(resolve => setTimeout(resolve, 1000)); // Așteaptă 1 secundă
          await account.createRecovery(email, resetUrl);
        } catch (retryError) {
          console.error('Retry eșuat:', retryError);
          throw retryError;
        }
      } else {
        throw error;
      }
    }

    return {
      success: true,
      message: 'Un email cu instrucțiunile de resetare a fost trimis la adresa specificată.',
    };
  } catch (error) {
    console.error('Eroare la resetarea parolei:', error);
    
    // Loghează detalii suplimentare pentru debug
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.response) {
      console.error('Error response:', error.response);
    }
    
    // Pentru conturile admin cu probleme de labels, returnează mesaj generic
    // dar loghează eroarea pentru investigație
    if (error.message && error.message.includes('labels')) {
      console.error('LABELS ERROR pentru admin account:', email, error);
      return {
        error: 'Detectată problemă cu contul admin. Contactați administratorul sistemului pentru resetarea parolei.',
      };
    }
    
    // Nu dezvăluim dacă email-ul există sau nu (securitate)
    return {
      success: true, 
      message: 'Un email cu instrucțiunile de resetare a fost trimis la adresa specificată.',
    };
  }
}

export default requestPasswordReset;