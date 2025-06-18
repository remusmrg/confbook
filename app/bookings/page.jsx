import Heading from '@/components/Heading';
import BookedRoomCard from '@/components/BookedRoomCard';
import getMyBookings from '../actions/getMyBookings';

export const dynamic = 'force-dynamic';

const BookingsPage = async () => {
  const bookings = await getMyBookings();

  const now = new Date();

  const active = bookings.filter((booking) => new Date(booking.check_out) > now);
  const past = bookings.filter((booking) => new Date(booking.check_out) <= now);

  return (
    <>
      <Heading title='My Bookings' />

      <div className='mt-4 space-y-6'>
        <div>
          <h2 className='text-lg font-semibold mb-2'>Active Bookings</h2>
          {active.length > 0 ? (
            active.map((booking) => (
              <BookedRoomCard key={booking.$id} booking={booking} />
            ))
          ) : (
            <p className='text-gray-600'>You have no active bookings.</p>
          )}
        </div>

        <div>
          <h2 className='text-lg font-semibold mb-2'>Past Bookings</h2>
          {past.length > 0 ? (
            past.map((booking) => (
              <BookedRoomCard key={booking.$id} booking={booking} />
            ))
          ) : (
            <p className='text-gray-600'>You have no past bookings.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default BookingsPage;
