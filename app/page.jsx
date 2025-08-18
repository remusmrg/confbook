// app/page.jsx
import RoomCard from '@/components/RoomCard';
import Heading from '@/components/Heading';
import SearchAndFilters from '@/components/SearchAndFilters';
import getAllRooms from './actions/getAllRooms';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }) {
  const rooms = await getAllRooms();
  
  // Obține parametrii din URL
  const searchTerm = searchParams?.search || '';
  const minCapacity = searchParams?.minCapacity ? Number(searchParams.minCapacity) : '';
  const maxPrice = searchParams?.maxPrice ? Number(searchParams.maxPrice) : '';
  const sortBy = searchParams?.sortBy || 'name';
  
  // Aplică filtrele
  let filteredRooms = rooms;
  
  // Filtru de căutare text
  if (searchTerm) {
    filteredRooms = filteredRooms.filter(room => 
      room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.amenities?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // Filtru capacitate minimă
  if (minCapacity) {
    filteredRooms = filteredRooms.filter(room => 
      room.capacity >= minCapacity
    );
  }
  
  // Filtru preț maxim
  if (maxPrice) {
    filteredRooms = filteredRooms.filter(room => 
      room.price_per_hour <= maxPrice
    );
  }

  // Sortare
  switch(sortBy) {
    case 'price_asc':
      filteredRooms.sort((a, b) => a.price_per_hour - b.price_per_hour);
      break;
    case 'price_desc':
      filteredRooms.sort((a, b) => b.price_per_hour - a.price_per_hour);
      break;
    case 'capacity':
      filteredRooms.sort((a, b) => b.capacity - a.capacity);
      break;
    default:
      filteredRooms.sort((a, b) => a.name.localeCompare(b.name));
  }

  const hasFilters = searchTerm || minCapacity || maxPrice;

  return (
    <>
      <Heading title='Săli de conferință disponibile' />
      
      {/* Search și Filtre */}
      <SearchAndFilters 
        defaultSearch={searchTerm}
        defaultMinCapacity={minCapacity}
        defaultMaxPrice={maxPrice}
        defaultSortBy={sortBy}
        totalRooms={rooms.length}
        filteredCount={filteredRooms.length}
        hasFilters={hasFilters}
      />
      
      {/* Rezultate */}
      <div className="mt-6">
        {filteredRooms.length > 0 ? (
          <div className="space-y-4">
            {filteredRooms.map((room) => (
              <RoomCard room={room} key={room.$id} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg 
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
              />
            </svg>
            
            {hasFilters ? (
              <div>
                <p className="text-gray-600 mb-4">
                  Nu am găsit săli care să corespundă criteriilor tale.
                </p>
                <a 
                  href="/"
                  className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Resetează filtrele
                </a>
              </div>
            ) : (
              <p className="text-gray-600">
                Nicio sală disponibilă în acest moment
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}