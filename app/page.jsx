import RoomCard from '@/components/RoomCard';
import Heading from '@/components/Heading';
import getAllRooms from './actions/getAllRooms';
export const dynamic = 'force-dynamic';

export default async function Home() {
  const rooms = await getAllRooms();

  return (
    <>
      <Heading title='Săli de conferință disponibile' />
      {rooms.length > 0 ? (
        rooms.map((room) => <RoomCard room={room} key={room.$id} />)
      ) : (
        <p>Nicio sală disponibilă în acest moment</p>
      )}
    </>
  );
}
