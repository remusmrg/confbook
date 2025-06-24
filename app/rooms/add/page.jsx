'use client';
import { useEffect } from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Heading from '@/components/Heading';
import createRoom from '@/app/actions/createRoom';
export const dynamic = 'force-dynamic';

const AddRoomPage = () => {
  const [state, formAction] = useActionState(createRoom, {});

  const router = useRouter();

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success('Sală creată cu succes!');
      router.push('/');
    }
  }, [state]);

  return (
    <>
      <Heading title='Adaugă o sală' />
      <div className='bg-white shadow-lg rounded-lg p-6 w-full'>
        <form action={formAction}>
          <div className='mb-4'>
            <label
              htmlFor='name'
              className='block text-gray-700 font-bold mb-2'
            >
              Room Name
            </label>
            <input
              type='text'
              id='name'
              name='name'
              className='border rounded w-full py-2 px-3'
              placeholder='Introduceți un nume sugestiv (ex. Sală mare de conferințe)'
              required
            />
          </div>

          <div className='mb-4'>
            <label
              htmlFor='description'
              className='block text-gray-700 font-bold mb-2'
            >
              Descriere
            </label>
            <textarea
              id='description'
              name='description'
              className='border rounded w-full h-24 py-2 px-3'
              placeholder='Introduceți o descriere pentru sală'
              required
            ></textarea>
          </div>

          <div className='mb-4'>
            <label
              htmlFor='sqm'
              className='block text-gray-700 font-bold mb-2'
            >
              Suprafață
            </label>
            <input
              type='number'
              id='sqm'
              name='sqm'
              className='border rounded w-full py-2 px-3'
              placeholder='Introduceți suprafața în metri pătrați'
              required
            />
          </div>

          <div className='mb-4'>
            <label
              htmlFor='capacity'
              className='block text-gray-700 font-bold mb-2'
            >
              Capacitate
            </label>
            <input
              type='number'
              id='capacity'
              name='capacity'
              className='border rounded w-full py-2 px-3'
              placeholder='Numărul maxim de persoane pe care sala îi poate acomoda'
              required
            />
          </div>

          <div className='mb-4'>
            <label
              htmlFor='price_per_hour'
              className='block text-gray-700 font-bold mb-2'
            >
              Preț pe oră
            </label>
            <input
              type='number'
              id='price_per_hour'
              name='price_per_hour'
              className='border rounded w-full py-2 px-3'
              placeholder='Introduceți prețul pe oră în lei'
              required
            />
          </div>

          <div className='mb-4'>
            <label
              htmlFor='address'
              className='block text-gray-700 font-bold mb-2'
            >
              Adresă
            </label>
            <input
              type='text'
              id='address'
              name='address'
              className='border rounded w-full py-2 px-3'
              placeholder='Introduceți'
              required
            />
          </div>

          <div className='mb-4'>
            <label
              htmlFor='location'
              className='block text-gray-700 font-bold mb-2'
            >
              Completări adresă
            </label>
            <input
              type='text'
              id='location'
              name='location'
              className='border rounded w-full py-2 px-3'
              placeholder='Completări la adresă (ex. Clădirea, Corp etc.)'
              required
            />
          </div>

          <div className='mb-4'>
            <label
              htmlFor='availability'
              className='block text-gray-700 font-bold mb-2'
            >
              Disponibilitate
            </label>
            <input
              type='text'
              id='availability'
              name='availability'
              className='border rounded w-full py-2 px-3'
              placeholder='Disponibil Luni-Vineri 10:00-18:00'
              required
            />
          </div>

          <div className='mb-4'>
            <label
              htmlFor='amenities'
              className='block text-gray-700 font-bold mb-2'
            >
              Facilități
            </label>
            <input
              type='text'
              id='amenities'
              name='amenities'
              className='border rounded w-full py-2 px-3'
              placeholder='Facilitați (Proiector, Tablă, TV etc.)'
              required
            />
          </div>

          <div className='mb-4'>
            <label htmlFor='contact' className='block font-semibold mb-1'>
                Număr de telefon
                  </label>
                <input
                    type='text'
                    name='contact'
                    id='contact'
                    placeholder='07XXXXXXXX'
                    className='w-full border rounded px-3 py-2'
                    required
                  />
                </div>


          {/* <!-- Image Upload --> */}
          <div className='mb-8'>
            <label
              htmlFor='image'
              className='block text-gray-700 font-bold mb-2'
            >
              Imagine
            </label>

            <input
              type='file'
              id='image'
              name='image'
              className='border rounded w-full py-2 px-3'
            />
          </div>

          <div className='flex flex-col gap-5'>
            <button
              type='submit'
              className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700'
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddRoomPage;
