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

      {upcoming.length > 0 ? (
        <>
          <h2 className='text-lg font-bold mt-4'>Active Reservations</h2>
          {upcoming.map((booking) => (
            <ReservedRoomCard key={booking.$id} booking={booking} />
          ))}
        </>
      ) : (
        <p>No upcoming reservations.</p>
      )}

      {past.length > 0 && (
        <>
          <h2 className='text-lg font-bold mt-8'>Past Reservations</h2>
          {past.map((booking) => (
            <ReservedRoomCard key={booking.$id} booking={booking} />
          ))}
        </>
      )}
    </>
  );
};

export default MyReservationsPage;
