import Heading from '@/components/Heading';
import BookingForm from '@/components/BookingForm';
import AvailabilityDisplay from '@/components/AvailabilityDisplay';
import Image from 'next/image';
import Link from 'next/link';
import { FaChevronLeft } from 'react-icons/fa';
import getSingleRoom from '@/app/actions/getSingleRoom';
import { createAdminClient } from '@/config/appwrite';

export const dynamic = 'force-dynamic';

const RoomPage = async ({ params }) => {
  const id = params.id;

  const room = await getSingleRoom(id);

  if (!room) {
    return <Heading title='Sala nu a fost găsită' />;
  }

  // ✅ Get creator info
  const { databases } = await createAdminClient();
  let creator = null;

  try {
    creator = await databases.getDocument(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE,
      process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USERS,
      room.user_id
    );
  } catch {
    creator = { name: 'Necunoscut', email: '—' };
  }

  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ROOMS;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;

  const imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/${bucketId}/files/${room.image}/view?project=${projectId}`;
  const imageSrc = room.image ? imageUrl : '/images/no-image.jpg';

  return (
    <>
      <Heading title={room.name} />
      <div className='bg-white shadow rounded-lg p-6'>
        <Link
          href='/'
          className='flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors'
        >
          <FaChevronLeft className='inline mr-1' />
          <span className='ml-2'>Înapoi la săli</span>
        </Link>

        <div className='flex flex-col sm:flex-row sm:space-x-6'>
          <Image
            src={imageSrc}
            alt={room.name}
            width={400}
            height={300}
            className='w-full sm:w-1/3 h-64 object-cover rounded-lg'
          />

          <div className='mt-4 sm:mt-0 sm:flex-1'>
            <p className='text-gray-600 mb-4'>{room.description}</p>

            <div className='space-y-3'>
              <div>
                <span className='font-semibold text-gray-800'>Suprafață sală:</span>{' '}
                {room.sqm} m²
              </div>
              <div>
                <span className='font-semibold text-gray-800'>Capacitate:</span>{' '}
                {room.capacity} persoane
              </div>
              
              {/* Afișarea disponibilității cu noua componentă */}
              <AvailabilityDisplay 
                availabilityString={room.availability}
                className="py-2 px-3 bg-blue-50 rounded-lg"
              />
              
              <div>
                <span className='font-semibold text-gray-800'>Preț:</span>{' '}
                {room.price_per_hour} lei/oră
              </div>
              <div>
                <span className='font-semibold text-gray-800'>Facilități:</span>{' '}
                {room.amenities}
              </div>
              <div>
                <span className='font-semibold text-gray-800'>Adresă:</span>{' '}
                {room.address}
              </div>
              <div>
                <span className='font-semibold text-gray-800'>Locație:</span>{' '}
                {room.location}
              </div>
              <div>
                <span className='font-semibold text-gray-800'>Contact:</span>{' '}
                {room.contact}
              </div>
              <div>
                <span className='font-semibold text-gray-800'>Postat de:</span>{' '}
                {creator.name} ({creator.email})
              </div>
            </div>
          </div>
        </div>

        <BookingForm room={room} />
      </div>
    </>
  );
};

export default RoomPage;