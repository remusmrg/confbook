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

  // State pentru a seta valorile minime ale input-urilor și fusul orar
  const [minDateTime, setMinDateTime] = useState('');
  const [userTimezone, setUserTimezone] = useState('');

  useEffect(() => {
    // ✅ Detectează fusul orar al utilizatorului
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(timezone);
    
    console.log('Detected user timezone:', timezone);
    
    // ✅ CRITICAL FIX: Folosește Luxon în loc de Date native
    // Creează "acum" în fusul orar al utilizatorului
    const now = DateTime.now().setZone(timezone);
    
    // Pentru input de tip datetime-local, avem nevoie de format YYYY-MM-DDTHH:mm
    // Luxon ne dă formatul corect direct
    const minDateTimeString = now.toFormat("yyyy-MM-dd'T'HH:mm");
    
    console.log('=== BOOKING FORM TIMEZONE DEBUG ===');
    console.log('User timezone:', timezone);
    console.log('Current time in user timezone:', now.toISO());
    console.log('Min datetime string for input:', minDateTimeString);
    console.log('Current time formatted for display:', now.toFormat('dd.MM.yyyy HH:mm'));
    
    setMinDateTime(minDateTimeString);
  }, []);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success('Sala a fost rezervată cu succes!');
      router.push('/bookings');
    }
  }, [state, router]);

  const handleSubmit = (formData) => {
    // Preiau valorile din formular
    const checkInDateTime = formData.get('check_in_datetime');
    const checkOutDateTime = formData.get('check_out_datetime');

    if (!checkInDateTime || !checkOutDateTime) {
      toast.error('Vă rugăm să completați toate câmpurile');
      return;
    }

    // ✅ CRITICAL FIX: Folosește Luxon pentru toate validările
    // Parsează input-urile ca fiind în fusul orar al utilizatorului
    const checkIn = DateTime.fromFormat(
      checkInDateTime.replace('T', ' '), 
      'yyyy-MM-dd HH:mm',
      { zone: userTimezone }
    );
    
    const checkOut = DateTime.fromFormat(
      checkOutDateTime.replace('T', ' '), 
      'yyyy-MM-dd HH:mm',
      { zone: userTimezone }
    );
    
    const now = DateTime.now().setZone(userTimezone);

    console.log('=== FORM VALIDATION DEBUG ===');
    console.log('Input check-in string:', checkInDateTime);
    console.log('Input check-out string:', checkOutDateTime);
    console.log('Parsed check-in (user tz):', checkIn.toISO());
    console.log('Parsed check-out (user tz):', checkOut.toISO());
    console.log('Now (user tz):', now.toISO());

    // Validări folosind Luxon
    if (!checkIn.isValid) {
      toast.error('Data și ora de check-in sunt invalide');
      return;
    }
    
    if (!checkOut.isValid) {
      toast.error('Data și ora de check-out sunt invalide');
      return;
    }

    if (checkIn < now) {
      toast.error('Data și ora de check-in nu pot fi în trecut');
      return;
    }

    if (checkOut <= checkIn) {
      toast.error('Check-out trebuie să fie după check-in');
      return;
    }

    // Calculez diferența în ore folosind Luxon
    const diffHours = checkOut.diff(checkIn, 'hours').hours;
    if (diffHours < 0.5) {
      toast.error('Rezervarea trebuie să fie de cel puțin 30 de minute');
      return;
    }

    // ✅ IMPORTANT: Convertim înapoi în format separate pentru server
    // Folosind Luxon pentru a fi siguri de acuratețea conversiei
    const checkInDate = checkIn.toFormat('yyyy-MM-dd');
    const checkInTime = checkIn.toFormat('HH:mm');
    const checkOutDate = checkOut.toFormat('yyyy-MM-dd');
    const checkOutTime = checkOut.toFormat('HH:mm');

    console.log('=== SENDING TO SERVER ===');
    console.log('Check-in date:', checkInDate, 'time:', checkInTime);
    console.log('Check-out date:', checkOutDate, 'time:', checkOutTime);
    console.log('User timezone being sent:', userTimezone);

    // Creez FormData cu formatul așteptat de server
    const serverFormData = new FormData();
    serverFormData.append('room_id', room.$id);
    serverFormData.append('check_in_date', checkInDate);
    serverFormData.append('check_in_time', checkInTime);
    serverFormData.append('check_out_date', checkOutDate);
    serverFormData.append('check_out_time', checkOutTime);
    
    // ✅ ADAUGĂ fusul orar al utilizatorului
    serverFormData.append('user_timezone', userTimezone);

    formAction(serverFormData);
  };

  // ✅ Funcție pentru a afișa informații despre fusul orar
  const getTimezoneInfo = () => {
    if (!userTimezone) return '';
    
    if (userTimezone === 'Europe/Bucharest') {
      return 'Ora României (unde se află sala)';
    }
    
    // Calculează diferența de ore față de România folosind Luxon
    const nowUser = DateTime.now().setZone(userTimezone);
    const nowRomania = DateTime.now().setZone('Europe/Bucharest');
    
    const diffHours = nowRomania.offset - nowUser.offset;
    const diffHoursActual = Math.round(diffHours / 60); // Convert minutes to hours
    
    if (diffHoursActual === 0) {
      return `${userTimezone} (aceeași oră cu România)`;
    } else if (diffHoursActual > 0) {
      return `${userTimezone} (România este cu ${diffHoursActual}h înaintea dvs.)`;
    } else {
      return `${userTimezone} (România este cu ${Math.abs(diffHoursActual)}h în urma dvs.)`;
    }
  };

  // ✅ Funcție helper pentru a formata timpul în fusul utilizatorului
  const formatTimeInUserTimezone = (timeString) => {
    if (!timeString || !userTimezone) return timeString;
    
    try {
      // Parsează availability-ul ca fiind în fusul României
      const romaniaTime = DateTime.fromFormat(timeString, 'HH:mm', { zone: 'Europe/Bucharest' });
      
      // Convertește la fusul utilizatorului pentru afișare
      const userTime = romaniaTime.setZone(userTimezone);
      
      return userTime.toFormat('HH:mm');
    } catch (error) {
      return timeString; // fallback la string-ul original
    }
  };

  return (
    <div className='mt-6'>
      <h2 className='text-xl font-bold'>Rezervă această sală</h2>
      
      {/* ✅ Afișaj informativ despre fusul orar */}
      {userTimezone && userTimezone !== 'Europe/Bucharest' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>📍 Atenție:</strong> Fusul dvs. orar: {getTimezoneInfo()}
            <br />
            Orele afișate în formular sunt în fusul dvs. local, dar validarea se face conform programului sălii din România.
          </p>
        </div>
      )}
      
      <form action={handleSubmit} className='mt-4'>
        <input type='hidden' name='room_id' value={room.$id} />
        
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
          <div>
            <label
              htmlFor='check_in_datetime'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Data și ora de începere
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
            <p className='text-xs text-gray-500 mt-1'>
              {userTimezone === 'Europe/Bucharest' 
                ? `Program: ${room.availability || 'Disponibil oricând'}` 
                : `Program sala (ora României): ${room.availability || 'Disponibil oricând'}`
              }
            </p>
            {userTimezone && userTimezone !== 'Europe/Bucharest' && room.availability && (
              <p className='text-xs text-blue-600 mt-1'>
                În fusul dvs.: {room.availability} (aproximativ - verificați la rezervare)
              </p>
            )}
          </div>
          
          <div>
            <label
              htmlFor='check_out_datetime'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
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
            <p className='text-xs text-gray-500 mt-1'>
              Respectați programul de mai sus
            </p>
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

        {/* Ghid pentru utilizatori */}
        <div className='mt-4 text-sm text-gray-600'>
          <p><strong>Notă:</strong></p>
          <ul className='mt-1 space-y-1 list-disc list-inside text-xs'>
            <li>Fusul dvs. orar detectat: {userTimezone || 'Se detectează...'}</li>
            <li>Orele afișate în formular sunt în fusul dvs. local</li>
            <li>Validarea disponibilității se face conform programului sălii (ora României)</li>
            <li>Rezervarea trebuie să respecte programul de disponibilitate al sălii</li>
            {userTimezone && userTimezone !== 'Europe/Bucharest' && (
              <li className="text-orange-600">
                <strong>Important:</strong> Conversia automată la ora României poate avea mici diferențe - verificați cu atenție orele selectate
              </li>
            )}
          </ul>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;