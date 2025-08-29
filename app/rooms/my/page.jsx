import Heading from '@/components/Heading';
import MyRoomCard from '@/components/MyRoomCard';
import getMyRooms from '@/app/actions/getMyRooms';
export const dynamic = 'force-dynamic';

const MyRoomsPage = async () => {
  const rooms = await getMyRooms();

  return (
    <>
      <Heading title='Sălile mele' />
      {rooms.length > 0 ? (
        rooms.map((room) => <MyRoomCard key={room.$id} room={room} />)
      ) : (
        <p>Nu ai listări de săli</p>
      )}
    </>
  );
};

export default MyRoomsPage;
