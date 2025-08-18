import Heading from '@/components/Heading';
import BookingForm from '@/components/BookingForm';
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
    return <Heading title='Room Not Found' />;
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
          className='flex items-center text-gray-600 hover:text-gray-800 mb-4'
        >
          <FaChevronLeft className='inline mr-1' />
          <span className='ml-2'>Înapoi la să<li></li></span>
        </Link>

        <div className='flex flex-col sm:flex-row sm:space-x-6'>
          <Image
            src={imageSrc}
            alt={room.name}
            width={400}
            height={100}
            className='w-full sm:w-1/3 h-64 object-cover rounded-lg'
          />

          <div className='mt-4 sm:mt-0 sm:flex-1'>
            <p className='text-gray-600 mb-4'>{room.description}</p>

            <ul className='space-y-2'>
              <li>
                <span className='font-semibold text-gray-800'>Suprafață sală:</span>{' '}
                {room.sqm} m²
              </li>
              <li>
                <span className='font-semibold text-gray-800'>Capacitate:</span>{' '}
                {room.sqm} persoane
              </li>
              <li>
                <span className='font-semibold text-gray-800'>Disponibilitate:</span>{' '}
                {room.availability}
              </li>
              <li>
                <span className='font-semibold text-gray-800'>Preț:</span> {room.price_per_hour} lei/oră
              </li>
              <li>
                <span className='font-semibold text-gray-800'>Facilități:</span> {room.amenities}
              </li>
              <li>
                <span className='font-semibold text-gray-800'>Adresă:</span>{' '}
                {room.address}
              </li>
              <li>
                <span className='font-semibold text-gray-800'>Locație:</span>{' '}
                {room.location}
              </li>
              <li>
                <span className='font-semibold text-gray-800'>Contact:</span>{' '}
                {room.contact}
              </li>
              <li>
                <span className='font-semibold text-gray-800'>Postat de:</span>{' '}
                {creator.name} ({creator.email})
              </li>
            </ul>
          </div>
        </div>

        <BookingForm room={room} />
      </div>
    </>
  );
};

export default RoomPage;
