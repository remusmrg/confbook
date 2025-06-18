'use client';
import { toast } from 'react-toastify';
import cancelBooking from '@/app/actions/cancelBooking';
import { useRouter } from 'next/navigation';

const CancelBookingButton = ({ bookingId }) => {
  const router = useRouter();

  const handleCancelClick = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const result = await cancelBooking(bookingId);

      if (result.success) {
        toast.success('Booking cancelled successfully!');
        router.refresh();  // refresh după succes
      } else {
        toast.error('Failed to cancel booking');
      }
    } catch (error) {
      console.log('Failed to cancel booking', error);
      toast.error('Failed to cancel booking');
    }
  };

  return (
    <button
      onClick={handleCancelClick}
      className='bg-red-500 text-white px-4 py-2 rounded w-full sm:w-auto text-center hover:bg-red-700'
    >
      Cancel Booking
    </button>
  );
};

export default CancelBookingButton;
