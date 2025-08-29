import Link from 'next/link';
import CancelBookingButton from './CancelBookingButton';
import { formatDateEuropean, isBookingActive, calculateBookingDuration } from '@/utils/dateFormatter';

const BookedRoomCard = ({ booking }) => {
  const { room_id: room } = booking;

  const isPast = !isBookingActive(booking.check_out);
  const duration = calculateBookingDuration(booking.check_in, booking.check_out);

  return (
    <div className='bg-white shadow rounded-lg p-4 mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center'>
      <div className='flex-1'>
        <h4 className='text-lg font-semibold'>{room.name}</h4>
        
        <div className='mt-2 space-y-1'>
          <p className='text-sm text-gray-600'>
            <strong>Check-in:</strong> {formatDateEuropean(booking.check_in)}
          </p>
          <p className='text-sm text-gray-600'>
            <strong>Check-out:</strong> {formatDateEuropean(booking.check_out)}
          </p>
          <p className='text-sm text-gray-500'>
            <strong>Durata:</strong> {duration}
          </p>
        </div>

        {/* Status indicator */}
        <div className='mt-2'>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            isPast 
              ? 'bg-gray-100 text-gray-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {isPast ? 'Expirată' : 'Activă'}
          </span>
        </div>
      </div>

      <div className='flex flex-col sm:flex-row w-full sm:w-auto sm:space-x-2 mt-4 sm:mt-0'>
        <Link
          href={`/rooms/${room.$id}`}
          className='bg-blue-500 text-white px-4 py-2 rounded mb-2 sm:mb-0 w-full sm:w-auto text-center hover:bg-blue-700 transition-colors'
        >
          Vezi sala
        </Link>
        {!isPast && (
          <CancelBookingButton bookingId={booking.$id} />
        )}
      </div>
    </div>
  );
};

export default BookedRoomCard;