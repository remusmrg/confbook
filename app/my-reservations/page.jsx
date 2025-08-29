import Heading from '@/components/Heading';
import getMyRoomBookings from '@/app/actions/getMyRoomBookings';
import ReservedRoomCard from '@/components/ReservedRoomCard';

export const dynamic = 'force-dynamic';

const MyReservationsPage = async () => {
  const bookings = await getMyRoomBookings();

  const now = new Date();

  // Separăm rezervările active și expirate
  const upcoming = bookings.filter(b => new Date(b.check_out) > now);
  const past = bookings.filter(b => new Date(b.check_out) <= now);

  // ✅ Sortăm rezervările active după check-in (cele mai aproape primele)
  const sortedUpcoming = upcoming.sort((a, b) => new Date(a.check_in) - new Date(b.check_in));

  // ✅ Sortăm rezervările expirate după check-out DESC (cele mai recente primele)  
  const sortedPast = past.sort((a, b) => new Date(b.check_out) - new Date(a.check_out));

  return (
    <>
      <Heading title='Rezervări pentru sălile mele' />

      <div className='mt-4 space-y-6'>
        {/* Rezervări active */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className='text-lg font-semibold text-green-700'>
              🟢 Rezervări active ({sortedUpcoming.length})
            </h2>
            {sortedUpcoming.length > 0 && (
              <span className="text-xs text-gray-500">
                Sortate după data de început
              </span>
            )}
          </div>
          
          {sortedUpcoming.length > 0 ? (
            <div className="space-y-3">
              {sortedUpcoming.map((booking) => (
                <ReservedRoomCard key={booking.$id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-gray-400 mb-2">🏢</div>
              <p className='text-gray-600'>Nicio rezervare activă pentru sălile dvs.</p>
              <p className="text-sm text-gray-500 mt-1">
                Rezervările viitoare pentru sălile dvs. vor apărea aici.
              </p>
            </div>
          )}
        </div>

        {/* Istoric rezervări */}
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
                  {/* Marcator pentru cea mai recentă rezervare */}
                  {index === 0 && (
                    <div className="absolute -left-2 -top-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full z-10">
                      Cea mai recentă
                    </div>
                  )}
                  
                  {/* Separator temporal pentru rezervări mai vechi de o săptămână */}
                  {index > 0 && (
                    (() => {
                      const currentBookingDate = new Date(booking.check_out);
                      const previousBookingDate = new Date(sortedPast[index - 1].check_out);
                      const daysDiff = Math.floor((previousBookingDate - currentBookingDate) / (1000 * 60 * 60 * 24));
                      
                      if (daysDiff > 7) {
                        return (
                          <div className="flex items-center my-4">
                            <div className="flex-grow border-t border-gray-300"></div>
                            <div className="mx-4 text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                              Cu mai mult de o săptămână în urmă
                            </div>
                            <div className="flex-grow border-t border-gray-300"></div>
                          </div>
                        );
                      }
                      return null;
                    })()
                  )}
                  
                  <ReservedRoomCard booking={booking} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-gray-400 mb-2">📚</div>
              <p className='text-gray-600'>Nu există rezervări expirate pentru sălile dvs.</p>
              <p className="text-sm text-gray-500 mt-1">
                Istoricul rezervărilor anterioare va apărea aici.
              </p>
            </div>
          )}
        </div>

        {/* Statistici detaliate pentru proprietarii de săli */}
        {(sortedUpcoming.length > 0 || sortedPast.length > 0) && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-3">📊 Statistici rezervări pentru sălile mele</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
              <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                <div className="font-semibold text-green-600 text-lg">{sortedUpcoming.length}</div>
                <div className="text-green-700">Active acum</div>
              </div>
              <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                <div className="font-semibold text-gray-600 text-lg">{sortedPast.length}</div>
                <div className="text-gray-700">Finalizate</div>
              </div>
              <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                <div className="font-semibold text-purple-600 text-lg">{bookings.length}</div>
                <div className="text-purple-700">Total rezervări</div>
              </div>
              <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                <div className="font-semibold text-blue-600 text-lg">
                  {bookings.length > 0 ? Math.round((sortedPast.length / bookings.length) * 100) : 0}%
                </div>
                <div className="text-blue-700">Rata finalizare</div>
              </div>
            </div>

            {/* Utilizatori unici */}
            {bookings.length > 0 && (
              <div className="text-sm text-gray-600">
                <strong>Utilizatori unici care au rezervat:</strong> {
                  [...new Set(bookings.map(b => b.userEmail))].length
                } persoane
              </div>
            )}
          </div>
        )}

        {/* Mesaj pentru proprietarii fără săli */}
        {bookings.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="text-yellow-500 mb-2 text-2xl">🏗️</div>
            <h3 className="font-medium text-yellow-800 mb-2">Nicio rezervare găsită</h3>
            <p className="text-yellow-700 mb-3">
              Aceasta poate fi din următoarele motive:
            </p>
            <ul className="text-sm text-yellow-600 text-left max-w-md mx-auto space-y-1">
              <li>• Nu aveți săli publicate încă</li>
              <li>• Sălile dvs. nu au primit rezervări</li>
              <li>• Toate rezervările au fost anulate</li>
            </ul>
            <div className="mt-4">
              <a 
                href="/rooms/add" 
                className="inline-block bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Adaugă prima ta sală
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MyReservationsPage;