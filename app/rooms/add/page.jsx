'use client';
import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Heading from '@/components/Heading';
import AvailabilityForm from '@/components/AvailabilityForm';
import createRoom from '@/app/actions/createRoom';

export const dynamic = 'force-dynamic';

const AddRoomPage = () => {
  const [state, formAction] = useActionState(createRoom, {});
  const [availability, setAvailability] = useState('Luni-Vineri 09:00-18:00');
  const router = useRouter();

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success('Sală creată cu succes!');
      router.push('/');
    }
  }, [state, router]);

  const handleSubmit = (formData) => {
    // Adaugă disponibilitatea la formData
    formData.set('availability', availability);
    return formAction(formData);
  };

  return (
    <>
      <Heading title='Adaugă o sală' />
      <div className='bg-white shadow-lg rounded-lg p-6 w-full'>
        <form action={handleSubmit}>
          <div className='mb-4'>
            <label
              htmlFor='name'
              className='block text-gray-700 font-bold mb-2'
            >
              Numele sălii
            </label>
            <input
              type='text'
              id='name'
              name='name'
              className='border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
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
              className='border rounded w-full h-24 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Introduceți o descriere pentru sală'
              required
            ></textarea>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
            <div>
              <label
                htmlFor='sqm'
                className='block text-gray-700 font-bold mb-2'
              >
                Suprafață (m²)
              </label>
              <input
                type='number'
                id='sqm'
                name='sqm'
                min='1'
                className='border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='ex. 50'
                required
              />
            </div>

            <div>
              <label
                htmlFor='capacity'
                className='block text-gray-700 font-bold mb-2'
              >
                Capacitate (persoane)
              </label>
              <input
                type='number'
                id='capacity'
                name='capacity'
                min='1'
                className='border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='ex. 20'
                required
              />
            </div>
          </div>

          <div className='mb-4'>
            <label
              htmlFor='price_per_hour'
              className='block text-gray-700 font-bold mb-2'
            >
              Preț pe oră (lei)
            </label>
            <input
              type='number'
              id='price_per_hour'
              name='price_per_hour'
              min='0'
              step='0.01'
              className='border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='ex. 100'
              required
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
            <div>
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
                className='border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Str. Exemplu nr. 123'
                required
              />
            </div>

            <div>
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
                className='border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Clădirea A, Etajul 2'
                required
              />
            </div>
          </div>

          {/* Componenta de disponibilitate înlocuiește input-ul vechi */}
          <div className='mb-6'>
            <AvailabilityForm 
              initialValue={availability}
              onChange={setAvailability}
            />
            {/* Hidden input pentru a trimite valoarea în form */}
            <input
              type='hidden'
              name='availability'
              value={availability}
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
              className='border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Proiector, Tablă, TV, WiFi, Aer condiționat'
              required
            />
          </div>

          <div className='mb-4'>
            <label 
              htmlFor='contact' 
              className='block text-gray-700 font-bold mb-2'
            >
              Număr de telefon
            </label>
            <input
              type='tel'
              name='contact'
              id='contact'
              className='border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='0712345678'
              pattern='[0-9]{10}'
              required
            />
          </div>

          {/* Image Upload */}
          <div className='mb-8'>
            <label
              htmlFor='image'
              className='block text-gray-700 font-bold mb-2'
            >
              Imagine sală
            </label>
            <input
              type='file'
              id='image'
              name='image'
              className='border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
              accept='image/*'
            />
            <p className='text-sm text-gray-500 mt-1'>
              Adăugați o imagine reprezentativă a sălii (opțional)
            </p>
          </div>

          <div className='flex flex-col gap-5'>
            <button
              type='submit'
              disabled={state.loading}
              className='bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:bg-blue-300 disabled:cursor-not-allowed'
            >
              {state.loading ? 'Se salvează...' : 'Salvează sala'}
            </button>
            
            <div className='text-sm text-gray-600'>
              <p>
                <strong>Notă:</strong> După salvare, sala va fi disponibilă pentru rezervare 
                doar în intervalele de timp specificate în programul de disponibilitate.
              </p>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddRoomPage;