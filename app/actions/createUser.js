'use server';
import { createAdminClient } from '@/config/appwrite';
import { ID } from 'node-appwrite';

async function createUser(previousState, formData) {
  const name = formData.get('name');
  const email = formData.get('email');
  const password = formData.get('password');
  const confirmPassword = formData.get('confirm-password');

  if (!email || !name || !password) {
    return {
      error: 'Va rugăm completați toate câmpurile!',
    };
  }

  if (password.length < 8) {
    return {
      error: 'Parola trebuie să fie măcar de 8 caractere lungime!',
    };
  }

  if (password !== confirmPassword) {
    return {
      error: 'Parolele nu sunt identice!',
    };
  }

  const { account, databases } = await createAdminClient();

  try {
    // Creează user-ul
    const user = await account.create(ID.unique(), email, password, name);

    // Salvează datele în colecția `users` (asigură-te că ID-ul e același cu userul de mai sus)
    await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USERS,
      user.$id, // ID-ul autentificatului (din Appwrite Auth)
      {
        name: user.name,
        email: user.email,
      }
    );

    return {
      success: true,
    };
  } catch (error) {
    console.log('Eroare înregistrare ', error);
    return {
      error: 'Nu s-a putut înregistra utilizatorul.',
    };
  }
}

export default createUser;
