'use client';
import { toast } from 'react-toastify';
import cancelBooking from '@/app/actions/cancelBooking';
import { useRouter } from 'next/navigation';

const CancelBookingButton = ({ bookingId }) => {
  const router = useRouter();

  const handleCancelClick = async () => {
    if (!confirm('Sunteți sigur că vreți să anulați această rezervare?')) {
      return;
    }

    try {
      const result = await cancelBooking(bookingId);

      if (result.success) {
        toast.success('Rezervare anulată cu succes!');
        router.refresh();  // refresh după succes
      } else {
        toast.error('Anularea rezervării a eșuat!');
      }
    } catch (error) {
      console.log('Anularea rezervării a eșuat!', error);
      toast.error('Anularea rezervării a eșuat!');
    }
  };

  return (
    <button
      onClick={handleCancelClick}
      className='bg-red-500 text-white px-4 py-2 rounded w-full sm:w-auto text-center hover:bg-red-700'
    >
      Anulează rezervare
    </button>
  );
};

export default CancelBookingButton;
