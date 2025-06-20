import Heading from '@/components/Heading';
import getMyRoomBookings from '@/app/actions/getMyRoomBookings';
import ReservedRoomCard from '@/components/ReservedRoomCard';

export const dynamic = 'force-dynamic';

const MyReservationsPage = async () => {
  const bookings = await getMyRoomBookings();

  const now = new Date();

  const upcoming = bookings.filter(b => new Date(b.check_out) > now);
  const past = bookings.filter(b => new Date(b.check_out) <= now);

  return (
    <>
      <Heading title='Reservations for My Rooms' />

      <div className='mt-4'>
        <h2 className='text-lg font-bold'>Active Reservations</h2>
        {upcoming.length > 0 ? (
          upcoming.map((booking) => (
            <ReservedRoomCard key={booking.$id} booking={booking} />
          ))
        ) : (
          <p>No upcoming reservations.</p>
        )}
      </div>

      {past.length > 0 && (
        <div className='mt-8'>
          <h2 className='text-lg font-bold'>Past Reservations</h2>
          {past.map((booking) => (
            <ReservedRoomCard key={booking.$id} booking={booking} />
          ))}
        </div>
      )}
    </>
  );
};

export default MyReservationsPage;
