import Link from 'next/link';
import CancelBookingButton from './CancelBookingButton';

const ReservedRoomCard = ({ booking }) => {
  const { room_id: room, userName } = booking;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Bucharest',
    }).format(date);
  };

  const isPast = new Date(booking.check_out) < new Date();

  return (
    <div className='bg-white shadow rounded-lg p-4 mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center'>
      <div>
        <h4 className='text-lg font-semibold'>{room.name}</h4>
        <p className='text-sm text-gray-600'>
          <strong>Rezervat de:</strong> {userName}
        </p>
        <p className='text-sm text-gray-600'>
          <strong>Check In:</strong> {formatDate(booking.check_in)}
        </p>
        <p className='text-sm text-gray-600'>
          <strong>Check Out:</strong> {formatDate(booking.check_out)}
        </p>
      </div>
      <div className='flex flex-col sm:flex-row w-full sm:w-auto sm:space-x-2 mt-2 sm:mt-0'>
        <Link
          href={`/rooms/${room.$id}`}
          className='bg-blue-500 text-white px-4 py-2 rounded mb-2 sm:mb-0 w-full sm:w-auto text-center hover:bg-blue-700'
        >
          Vezi Sala
        </Link>
        {!isPast && (
          <CancelBookingButton bookingId={booking.$id} />
        )}
      </div>
    </div>
  );
};

export default ReservedRoomCard;
