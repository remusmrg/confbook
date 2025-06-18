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
      error: 'Please fill in all fields',
    };
  }

  if (password.length < 8) {
    return {
      error: 'Password must be at least 8 characters long',
    };
  }

  if (password !== confirmPassword) {
    return {
      error: 'Passwords do not match',
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
    console.log('Registration Error: ', error);
    return {
      error: 'Could not register user',
    };
  }
}

export default createUser;
