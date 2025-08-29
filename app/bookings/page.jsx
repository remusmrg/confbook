import Heading from '@/components/Heading';
import BookedRoomCard from '@/components/BookedRoomCard';
import getMyBookings from '../actions/getMyBookings';

export const dynamic = 'force-dynamic';

const BookingsPage = async () => {
  const bookings = await getMyBookings();

  const now = new Date();

  // Separăm rezervările active și expirate
  const active = bookings.filter((booking) => new Date(booking.check_out) > now);
  const past = bookings.filter((booking) => new Date(booking.check_out) <= now);

  // ✅ Sortăm rezervările active după check-in (cele mai aproape primele)
  const sortedActive = active.sort((a, b) => new Date(a.check_in) - new Date(b.check_in));

  // ✅ Sortăm rezervările expirate după check-out DESC (cele mai recente primele)
  const sortedPast = past.sort((a, b) => new Date(b.check_out) - new Date(a.check_out));

  return (
    <>
      <Heading title='Rezervările mele' />

      <div className='mt-4 space-y-6'>
        {/* Rezervări active */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className='text-lg font-semibold text-green-700'>
              🟢 Rezervări active ({sortedActive.length})
            </h2>
            {sortedActive.length > 0 && (
              <span className="text-xs text-gray-500">
                Sortate după data de început
              </span>
            )}
          </div>
          
          {sortedActive.length > 0 ? (
            <div className="space-y-3">
              {sortedActive.map((booking) => (
                <BookedRoomCard key={booking.$id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-gray-400 mb-2">📅</div>
              <p className='text-gray-600'>Nu aveți rezervări active în acest moment.</p>
              <p className="text-sm text-gray-500 mt-1">
                Rezervările viitoare vor apărea aici.
              </p>
            </div>
          )}
        </div>

        {/* Rezervări expirate - istoric */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className='text-lg font-semibold text-gray-600'>
              📋 Istoric rezervări ({sortedPast.length})
            </h2>
            {sortedPast.length > 0 && (
              <span className="text-xs text-gray-500">
                Cele mai recente primele
              </span>
            )}
          </div>
          
          {sortedPast.length > 0 ? (
            <div className="space-y-3">
              {sortedPast.map((booking, index) => (
                <div key={booking.$id} className="relative">
                  {/* Indicatori cronologici pentru primele câteva rezervări */}
                  {index === 0 && (
                    <div className="absolute -left-2 -top-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full z-10">
                      Cea mai recentă
                    </div>
                  )}
                  <BookedRoomCard booking={booking} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-gray-400 mb-2">📚</div>
              <p className='text-gray-600'>Nu aveți rezervări expirate.</p>
              <p className="text-sm text-gray-500 mt-1">
                Istoricul rezervărilor anterioare va apărea aici.
              </p>
            </div>
          )}
        </div>

        {/* Statistici rapide */}
        {(sortedActive.length > 0 || sortedPast.length > 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">📊 Statistici rezervări</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-blue-600">{sortedActive.length}</div>
                <div className="text-blue-700">Active</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-600">{sortedPast.length}</div>
                <div className="text-gray-700">Finalizate</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-purple-600">{bookings.length}</div>
                <div className="text-purple-700">Total</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">
                  {sortedPast.length > 0 ? '✓' : '—'}
                </div>
                <div className="text-green-700">Istoric</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BookingsPage;