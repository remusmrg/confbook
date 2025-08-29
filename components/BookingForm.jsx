'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { toast } from 'react-toastify';
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
    
    // Setează data și ora minimă la momentul curent în fusul orar local
    const now = new Date();
    
    // Pentru input de tip datetime-local, avem nevoie de format YYYY-MM-DDTHH:mm
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const minDateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
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

    // Validare suplimentară pe client
    const checkIn = new Date(checkInDateTime);
    const checkOut = new Date(checkOutDateTime);
    const now = new Date();

    if (checkIn < now) {
      toast.error('Data și ora de check-in nu pot fi în trecut');
      return;
    }

    if (checkOut <= checkIn) {
      toast.error('Check-out trebuie să fie după check-in');
      return;
    }

    // Calculez diferența în ore
    const diffHours = (checkOut - checkIn) / (1000 * 60 * 60);
    if (diffHours < 0.5) {
      toast.error('Rezervarea trebuie să fie de cel puțin 30 de minute');
      return;
    }

    // Convertesc înapoi în format separate pentru server
    const checkInDate = checkInDateTime.split('T')[0];
    const checkInTime = checkInDateTime.split('T')[1];
    const checkOutDate = checkOutDateTime.split('T')[0];
    const checkOutTime = checkOutDateTime.split('T')[1];

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
    
    // Calculează diferența de ore față de România
    const romaniaTime = new Intl.DateTimeFormat('en', {
      timeZone: 'Europe/Bucharest',
      hour: '2-digit',
      hour12: false
    }).format(new Date());
    
    const userTime = new Intl.DateTimeFormat('en', {
      timeZone: userTimezone,
      hour: '2-digit',
      hour12: false
    }).format(new Date());
    
    const romaniaHour = parseInt(romaniaTime);
    const userHour = parseInt(userTime);
    const diff = romaniaHour - userHour;
    
    if (diff === 0) {
      return `${userTimezone} (aceeași oră cu România)`;
    } else if (diff > 0) {
      return `${userTimezone} (România este cu ${diff}h înaintea dvs.)`;
    } else {
      return `${userTimezone} (România este cu ${Math.abs(diff)}h în urma dvs.)`;
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
            Orele afișate sunt în fusul dvs. local, dar validarea se face conform programului sălii din România.
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
          </ul>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;