'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import logo from '@/assets/images/logo.svg';
import {
  FaUser,
  FaSignInAlt,
  FaSignOutAlt,
  FaBuilding,
  FaClipboardList,
  FaPlusSquare,
  FaCalendarCheck,
  FaHome
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import destroySession from '@/app/actions/destroySession';
import { useAuth } from '@/context/authContext';

const Header = () => {
  const router = useRouter();
  const { isAuthenticated, setIsAuthenticated, currentUser, setCurrentUser } = useAuth();

  const handleLogout = async () => {
    const { success, error } = await destroySession();

    if (success) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      router.push('/login');
    } else {
      toast.error(error);
    }
  };

  return (
    <header className='bg-gray-100'>
      <nav className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>

        {/* Desktop layout */}
        <div className='hidden md:flex h-16 items-center justify-between'>
          <div className='flex items-center'>
            <Link href='/'>
              <Image
                className='h-12 w-12'
                src={logo}
                alt='Confbook'
                priority={true}
              />
            </Link>
            <div className='ml-10 flex items-baseline space-x-4'>
              <Link
                href='/'
                className='rounded-md px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-700 hover:text-white'
              >
                <FaHome className='inline mr-1' /> Rooms
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    href='/bookings'
                    className='rounded-md px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-700 hover:text-white'
                  >
                    <FaCalendarCheck className='inline mr-1' /> Bookings
                  </Link>
                  <Link
                    href='/my-reservations'
                    className='rounded-md px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-700 hover:text-white'
                  >
                    <FaClipboardList className='inline mr-1' /> My Reservations
                  </Link>
                  <Link
                    href='/rooms/add'
                    className='rounded-md px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-700 hover:text-white'
                  >
                    <FaPlusSquare className='inline mr-1' /> Add Room
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className='ml-4 flex items-center'>
            {!isAuthenticated ? (
              <>
                <Link
                  href='/login'
                  className='mr-3 text-gray-800 hover:text-gray-600'
                >
                  <FaSignInAlt className='inline mr-1' /> Login
                </Link>
                <Link
                  href='/register'
                  className='mr-3 text-gray-800 hover:text-gray-600'
                >
                  <FaUser className='inline mr-1' /> Register
                </Link>
              </>
            ) : (
              <>
                <span className='mr-4 font-medium text-gray-800'>
                  <FaUser className='inline mr-1' />
                  {currentUser?.name || currentUser?.email || 'User'}
                </span>
                <Link
                  href='/rooms/my'
                  className='text-gray-800 hover:text-gray-600'
                >
                  <FaBuilding className='inline mr-1' /> My Rooms
                </Link>
                <button
                  onClick={handleLogout}
                  className='mx-3 text-gray-800 hover:text-gray-600'
                >
                  <FaSignOutAlt className='inline mr-1' /> Sign Out
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile layout */}
        <div className='flex flex-col items-start space-y-3 px-4 py-4 md:hidden'>
          <div className='flex items-center space-x-3 mb-2'>
            <Image src={logo} alt='Confbook' width={48} height={48} />
            {isAuthenticated && (
              <span className='text-gray-800 font-semibold'>
                <FaUser className='inline mr-1' />
                {currentUser?.name || currentUser?.email || 'User'}
              </span>
            )}
          </div>

          <Link href='/' className='text-gray-800 hover:underline'>
            <FaHome className='inline mr-2' /> Rooms
          </Link>

          {isAuthenticated ? (
            <>
              <Link href='/bookings' className='text-gray-800 hover:underline'>
                <FaCalendarCheck className='inline mr-2' /> Bookings
              </Link>
              <Link href='/my-reservations' className='text-gray-800 hover:underline'>
                <FaClipboardList className='inline mr-2' /> My Reservations
              </Link>
              <Link href='/rooms/add' className='text-gray-800 hover:underline'>
                <FaPlusSquare className='inline mr-2' /> Add Room
              </Link>
              <Link href='/rooms/my' className='text-gray-800 hover:underline'>
                <FaBuilding className='inline mr-2' /> My Rooms
              </Link>
              <button
                onClick={handleLogout}
                className='text-left text-gray-800 hover:underline'
              >
                <FaSignOutAlt className='inline mr-2' /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href='/login' className='text-gray-800 hover:underline'>
                <FaSignInAlt className='inline mr-2' /> Login
              </Link>
              <Link href='/register' className='text-gray-800 hover:underline'>
                <FaUser className='inline mr-2' /> Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
