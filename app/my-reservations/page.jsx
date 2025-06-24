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
      <Heading title='Rezervări pentru sălile mele' />

      <div className='mt-4'>
        <h2 className='text-lg font-bold'>Rezervări active</h2>
        {upcoming.length > 0 ? (
          upcoming.map((booking) => (
            <ReservedRoomCard key={booking.$id} booking={booking} />
          ))
        ) : (
          <p>Nicio rezervare activă.</p>
        )}
      </div>

      {past.length > 0 && (
        <div className='mt-8'>
          <h2 className='text-lg font-bold'>Rezervări expirate</h2>
          {past.map((booking) => (
            <ReservedRoomCard key={booking.$id} booking={booking} />
          ))}
        </div>
      )}
    </>
  );
};

export default MyReservationsPage;
