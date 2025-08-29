import Link from 'next/link';
import { FaEye, FaCalendarAlt, FaUsers, FaClock, FaMoneyBillWave, FaChartLine } from 'react-icons/fa';
import DeleteRoomButton from './DeleteRoomButton';
import { formatDateEuropean } from '@/utils/dateFormatter';

export const dynamic = 'force-dynamic';

const MyRoomCard = ({ room }) => {
  const { stats } = room;
  
  // Determină statusul sălii
  const getStatusInfo = () => {
    if (stats?.activeBookings > 0) {
      return {
        status: 'Ocupată acum',
        color: 'bg-green-100 text-green-800',
        icon: '🟢'
      };
    } else if (stats?.totalBookings > 0) {
      return {
        status: 'Activă',
        color: 'bg-blue-100 text-blue-800',
        icon: '🔵'
      };
    } else {
      return {
        status: 'Nicio rezervare',
        color: 'bg-gray-100 text-gray-600',
        icon: '⚪'
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className='bg-white shadow-md hover:shadow-lg transition-shadow rounded-lg border border-gray-200'>
      {/* Header cu numele sălii și statusul */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className='text-lg font-semibold text-gray-800 mb-1'>{room.name}</h4>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.icon} {statusInfo.status}
              </span>
              {stats?.recentBookings > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  🔥 {stats.recentBookings} rezervări luna aceasta
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">{room.price_per_hour} lei/oră</div>
            <div className="text-sm text-gray-500">{room.capacity} persoane</div>
          </div>
        </div>
      </div>

      {/* Statistici detaliate (doar dacă există rezervări) */}
      {stats && stats.totalBookings > 0 && (
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="text-center">
              <div className="flex items-center justify-center text-blue-500 mb-1">
                <FaCalendarAlt className="text-sm" />
              </div>
              <div className="font-semibold text-blue-600">{stats.totalBookings}</div>
              <div className="text-xs text-blue-700">Rezervări totale</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center text-green-500 mb-1">
                <FaMoneyBillWave className="text-sm" />
              </div>
              <div className="font-semibold text-green-600">{stats.estimatedRevenue}</div>
              <div className="text-xs text-green-700">Lei câștigați</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center text-purple-500 mb-1">
                <FaUsers className="text-sm" />
              </div>
              <div className="font-semibold text-purple-600">{stats.uniqueUsers}</div>
              <div className="text-xs text-purple-700">Clienți unici</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center text-orange-500 mb-1">
                <FaClock className="text-sm" />
              </div>
              <div className="font-semibold text-orange-600">{stats.totalHours}h</div>
              <div className="text-xs text-orange-700">Ore rezervate</div>
            </div>
          </div>

          {/* Informații suplimentare */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
            <div>
              <strong>Rata ocupare:</strong> 
              <span className={`ml-1 ${stats.occupancyRate > 50 ? 'text-green-600' : 'text-gray-600'}`}>
                ~{stats.occupancyRate}% (luna aceasta)
              </span>
            </div>
            <div>
              <strong>Venit/rezervare:</strong> 
              <span className="ml-1 text-green-600">
                ~{Math.round(stats.estimatedRevenue / stats.totalBookings)} lei
              </span>
            </div>
          </div>

          {/* Ultima rezervare */}
          {stats.lastBooking && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <strong>Ultima rezervare:</strong> {formatDateEuropean(stats.lastBooking.check_out)} 
                <span className="ml-2 text-gray-400">
                  de {stats.lastBooking.userName} ({stats.lastBooking.userEmail})
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistici pentru săli fără rezervări */}
      {stats && stats.totalBookings === 0 && (
        <div className="p-4 bg-yellow-50 border-b border-gray-100">
          <div className="text-center text-yellow-700">
            <div className="text-2xl mb-2">📈</div>
            <div className="text-sm font-medium mb-1">Sala ta așteaptă prima rezervare!</div>
            <div className="text-xs">
              Optimizează descrierea și verifică programul de disponibilitate
            </div>
          </div>
        </div>
      )}

      {/* Footer cu acțiuni */}
      <div className='p-4'>
        <div className='flex flex-col sm:flex-row w-full sm:space-x-2 gap-2'>
          <Link
            href={`/rooms/${room.$id}`}
            className='bg-blue-500 text-white px-4 py-2 rounded-lg w-full sm:w-auto text-center hover:bg-blue-600 transition-colors flex items-center justify-center'
          >
            <FaEye className='mr-2' /> Vezi pagina sălii
          </Link>

          {/* Buton către rezervări (doar dacă există) */}
          {stats && stats.totalBookings > 0 && (
            <Link
              href={`/my-reservations`}
              className='bg-green-500 text-white px-4 py-2 rounded-lg w-full sm:w-auto text-center hover:bg-green-600 transition-colors flex items-center justify-center'
            >
              <FaChartLine className='mr-2' /> Rezervări ({stats.totalBookings})
            </Link>
          )}

          <DeleteRoomButton roomId={room.$id} />
        </div>

        {/* Recomandări specifice pentru sală */}
        {stats && (
          <div className="mt-3 text-xs text-gray-500">
            {stats.totalBookings === 0 && (
              <div className="bg-yellow-50 border-l-2 border-yellow-300 p-2">
                💡 <strong>Sfat:</strong> Adaugă mai multe detalii în descriere și verifică dacă prețul este competitiv
              </div>
            )}
            {stats.occupancyRate > 70 && (
              <div className="bg-green-50 border-l-2 border-green-300 p-2">
                🚀 <strong>Excelent!</strong> Rata de ocupare ridicată - consideră creșterea prețului
              </div>
            )}
            {stats.uniqueUsers > 5 && (
              <div className="bg-blue-50 border-l-2 border-blue-300 p-2">
                ⭐ <strong>Popular!</strong> Mulți clienți îți apreciază sala - menține calitatea
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRoomCard;