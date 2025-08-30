'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { toast } from 'react-toastify';
import { DateTime } from 'luxon';
import bookRoom from '@/app/actions/bookRoom';

const BookingForm = ({ room }) => {
  const [state, formAction] = useActionState(bookRoom, {});
  const router = useRouter();

  const [minDateTime, setMinDateTime] = useState('');
  const [userTimezone, setUserTimezone] = useState('');

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(timezone);

    const now = DateTime.now().setZone(timezone);
    setMinDateTime(now.toFormat("yyyy-MM-dd'T'HH:mm"));
  }, []);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success('Sala a fost rezervată cu succes!');
      router.push('/bookings');
    }
  }, [state, router]);

  const handleSubmit = (formData) => {
    const checkInISO = formData.get('check_in_datetime');
    const checkOutISO = formData.get('check_out_datetime');

    if (!checkInISO || !checkOutISO) {
      toast.error('Vă rugăm să completați toate câmpurile');
      return;
    }

    // Parse input în fusul userului
    const checkInLocal = DateTime.fromISO(checkInISO, { zone: userTimezone });
    const checkOutLocal = DateTime.fromISO(checkOutISO, { zone: userTimezone });
    const now = DateTime.now().setZone(userTimezone);

    if (!checkInLocal.isValid || !checkOutLocal.isValid) {
      toast.error('Date invalide');
      return;
    }
    if (checkInLocal < now) {
      toast.error('Check-in nu poate fi în trecut');
      return;
    }
    if (checkOutLocal <= checkInLocal) {
      toast.error('Check-out trebuie să fie după check-in');
      return;
    }
    if (checkOutLocal.diff(checkInLocal, 'minutes').minutes < 30) {
      toast.error('Rezervarea trebuie să fie de cel puțin 30 de minute');
      return;
    }

    // Convertim la UTC pentru server
    const serverFormData = new FormData();
    serverFormData.append('room_id', room.$id);
    serverFormData.append('check_in', checkInLocal.toUTC().toISO());
    serverFormData.append('check_out', checkOutLocal.toUTC().toISO());

    formAction(serverFormData);
  };

  return (
    <div className='mt-6'>
      <h2 className='text-xl font-bold'>Rezervă această sală</h2>

      {userTimezone && userTimezone !== 'Europe/Bucharest' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>📍 Atenție:</strong> Orele afișate sunt în fusul dvs. local ({userTimezone}).<br/>
            Validarea disponibilității se face conform programului sălii din România.
          </p>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(new FormData(e.target)); }} className='mt-4'>
        <input type='hidden' name='room_id' value={room.$id} />

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
          <div>
            <label htmlFor='check_in_datetime' className='block text-sm font-medium text-gray-700 mb-2'>
              Data și ora de început
            </label>
            <input
              type='datetime-local'
              id='check_in_datetime'
              name='check_in_datetime'
              min={minDateTime}
              className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              required
              suppressHydrationWarning
            />
          </div>

          <div>
            <label htmlFor='check_out_datetime' className='block text-sm font-medium text-gray-700 mb-2'>
              Data și ora de sfârșit
            </label>
            <input
              type='datetime-local'
              id='check_out_datetime'
              name='check_out_datetime'
              min={minDateTime}
              className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              required
              suppressHydrationWarning
            />
          </div>
        </div>

        <div className='mt-6'>
          <button
            type='submit'
            disabled={state.loading}
            className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed'
          >
            {state.loading ? 'Se rezervă...' : 'Rezervă sala'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
