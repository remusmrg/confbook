import Heading from '@/components/Heading';
import MyRoomCard from '@/components/MyRoomCard';
import getMyRooms from '@/app/actions/getMyRooms';
import getMyRoomBookings from '@/app/actions/getMyRoomBookings';

export const dynamic = 'force-dynamic';

const MyRoomsPage = async () => {
  const [rooms, allBookings] = await Promise.all([
    getMyRooms(),
    getMyRoomBookings()
  ]);

  // Calculăm statistici per sală
  const roomsWithStats = rooms.map(room => {
    const roomBookings = allBookings.filter(booking => 
      (typeof booking.room_id === 'object' ? booking.room_id.$id : booking.room_id) === room.$id
    );
    
    const now = new Date();
    const activeBookings = roomBookings.filter(b => new Date(b.check_out) > now);
    const completedBookings = roomBookings.filter(b => new Date(b.check_out) <= now);
    
    // Calculează revenue estimat (doar pentru rezervări complete)
    const totalHours = completedBookings.reduce((sum, booking) => {
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);
      const hours = (checkOut - checkIn) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
    
    const estimatedRevenue = totalHours * room.price_per_hour;
    
    // Rata de ocupare (rezervări din ultima lună)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const recentBookings = roomBookings.filter(b => 
      new Date(b.check_in) >= oneMonthAgo
    );
    
    // Utilizatori unici
    const uniqueUsers = [...new Set(roomBookings.map(b => b.userEmail))];
    
    // Ultima rezervare
    const lastBooking = roomBookings.length > 0 
      ? roomBookings.sort((a, b) => new Date(b.check_out) - new Date(a.check_out))[0]
      : null;

    return {
      ...room,
      stats: {
        totalBookings: roomBookings.length,
        activeBookings: activeBookings.length,
        completedBookings: completedBookings.length,
        totalHours: Math.round(totalHours * 10) / 10,
        estimatedRevenue: Math.round(estimatedRevenue),
        recentBookings: recentBookings.length,
        uniqueUsers: uniqueUsers.length,
        lastBooking,
        occupancyRate: recentBookings.length > 0 ? 
          Math.round((recentBookings.length / 30) * 100) : 0 // Estimare simplă
      }
    };
  });

  // Sortăm sălile după activitatea recentă
  const sortedRooms = roomsWithStats.sort((a, b) => {
    if (a.stats.activeBookings !== b.stats.activeBookings) {
      return b.stats.activeBookings - a.stats.activeBookings;
    }
    return b.stats.totalBookings - a.stats.totalBookings;
  });

  // Statistici globale
  const totalStats = roomsWithStats.reduce((acc, room) => ({
    totalRooms: acc.totalRooms + 1,
    totalBookings: acc.totalBookings + room.stats.totalBookings,
    totalRevenue: acc.totalRevenue + room.stats.estimatedRevenue,
    totalActiveBookings: acc.totalActiveBookings + room.stats.activeBookings,
    totalUniqueUsers: acc.totalUniqueUsers + room.stats.uniqueUsers
  }), {
    totalRooms: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalActiveBookings: 0,
    totalUniqueUsers: 0
  });

  return (
    <>
      <Heading title='Sălile mele' />

      {rooms.length > 0 ? (
        <>
          {/* Statistici globale */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">📊 Prezentare generală</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{totalStats.totalRooms}</div>
                <div className="text-sm text-blue-700">Săli publicate</div>
              </div>
              
              <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">{totalStats.totalActiveBookings}</div>
                <div className="text-sm text-green-700">Rezervări active</div>
              </div>
              
              <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{totalStats.totalBookings}</div>
                <div className="text-sm text-purple-700">Total rezervări</div>
              </div>
              
              <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-orange-600">{totalStats.totalUniqueUsers}</div>
                <div className="text-sm text-orange-700">Clienți unici</div>
              </div>
              
              <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">{totalStats.totalRevenue}</div>
                <div className="text-sm text-green-700">Lei câștigați</div>
              </div>
            </div>

            {/* Insights */}
            <div className="mt-4 p-3 bg-white rounded-lg text-sm">
              <div className="font-medium text-gray-700 mb-2">💡 Insights rapide:</div>
              <div className="grid sm:grid-cols-2 gap-2 text-gray-600">
                <div>
                  • Media rezervărilor per sală: <strong>{Math.round((totalStats.totalBookings / totalStats.totalRooms) * 10) / 10}</strong>
                </div>
                <div>
                  • Venit mediu per rezervare: <strong>{totalStats.totalBookings > 0 ? Math.round(totalStats.totalRevenue / totalStats.totalBookings) : 0} lei</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Lista sălilor */}
          <div className="space-y-4">
            {sortedRooms.map((room, index) => (
              <div key={room.$id} className="relative">
                {/* Badge pentru sala cu cele mai multe rezervări */}
                {index === 0 && room.stats.totalBookings > 0 && (
                  <div className="absolute -right-2 -top-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full z-10 shadow-sm">
                    ⭐ Top performantă
                  </div>
                )}
                <MyRoomCard room={room} />
              </div>
            ))}
          </div>

          {/* Recomandări pentru îmbunătățire */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">💡 Recomandări pentru îmbunătățire</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              {totalStats.totalBookings === 0 && (
                <p>• Încercați să optimizați descrierea și prețul sălilor pentru a atrage primele rezervări</p>
              )}
              {totalStats.totalBookings > 0 && totalStats.totalActiveBookings === 0 && (
                <p>• Excelent! Aveți istoric de rezervări. Considerați promovarea pentru rezervări viitoare</p>
              )}
              {sortedRooms.some(room => room.stats.totalBookings === 0) && (
                <p>• Unele săli nu au avut rezervări. Verificați prețul și disponibilitatea</p>
              )}
              {sortedRooms.some(room => room.stats.uniqueUsers > 3) && (
                <p>• Săli populare! Considerați creșterea prețurilor în perioadele de vârf</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">🏢</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Bine ai venit în panoul tău de săli!
          </h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            Încă nu ai publicat nicio sală. Creează prima ta listare și începe să primești rezervări.
          </p>
          <a 
            href="/rooms/add"
            className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            🚀 Publică prima ta sală
          </a>
          
          <div className="mt-6 bg-white rounded-lg p-4 text-left max-w-md mx-auto">
            <h4 className="font-medium text-gray-700 mb-2">Ce vei putea vedea aici:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>📊 Statistici detaliate per sală</div>
              <div>💰 Câștiguri estimate din rezervări</div>
              <div>👥 Numărul de clienți unici</div>
              <div>📈 Rata de ocupare și tendințe</div>
              <div>⭐ Recomandări pentru optimizare</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyRoomsPage;