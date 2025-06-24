'use client';
import { toast } from 'react-toastify';
import { FaTrash } from 'react-icons/fa';
import deleteRoom from '@/app/actions/deleteRoom';
import { useRouter } from 'next/navigation';

const DeleteRoomButton = ({ roomId }) => {
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Sunteți sigur că vreți să ștergeți această sală?'
    );

    if (confirmed) {
      try {
        await deleteRoom(roomId);
        toast.success('Cameră ștearsă cu succes!');
        router.refresh();  // aici faci refresh
      } catch (error) {
        console.log('Ștergerea camerei a eșuat', error);
        toast.error('Ștergerea camerei a eșuat');
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      className='bg-red-500 text-white px-4 py-2 rounded mb-2 sm:mb-0 w-full sm:w-auto text-center hover:bg-red-700'
    >
      <FaTrash className='inline mr-1' /> Șterge
    </button>
  );
};

export default DeleteRoomButton;
