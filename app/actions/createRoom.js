'use server';
import { createAdminClient } from '@/config/appwrite';
import checkAuth from './checkAuth';
import { ID } from 'node-appwrite';
import { revalidatePath } from 'next/cache';

async function createRoom(previousState, formData) {
  // Get databases instance
  const { databases, storage } = await createAdminClient();

  try {
    const { user } = await checkAuth();

    if (!user) {
      return {
        error: 'Trebuie să fii logat pentru a lista o sală',
      };
    }

    // Uploading image
    let imageID;

    const image = formData.get('image');

    if (image && image.size > 0 && image.name !== 'undefined') {
      try {
        // Upload
        const response = await storage.createFile('rooms', ID.unique(), image);
        imageID = response.$id;
      } catch (error) {
        console.log('Eroare încărcare imagine', error);
        return {
          error: 'Eroare încărcare imagine',
        };
      }
    } else {
      console.log('No image file provided or file is invalid');
    }

    // Create room
    const newRoom = await databases.createDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ROOMS,
      ID.unique(),
      {
        user_id: user.id,
        name: formData.get('name'),
        description: formData.get('description'),
        sqm: formData.get('sqm'),
        capacity: formData.get('capacity'),
        location: formData.get('location'),
        address: formData.get('address'),
        availability: formData.get('availability'),
        price_per_hour: formData.get('price_per_hour'),
        amenities: formData.get('amenities'),
        contact: formData.get('contact'),
        image: imageID,
      }
    );

    //revalidatePath('/', 'layout');
    //comentariu ca sa schimb pe git

    return {
      success: true,
    };
  } catch (error) {
    console.log(error);
    const errorMessage =
      error.response.message || 'An unexpected error has occured';
    return {
      error: errorMessage,
    };
  }
}

export default createRoom;
