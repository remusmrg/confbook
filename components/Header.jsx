'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
  FaHome,
  FaCog,
  FaChevronDown,
  FaUserShield
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import destroySession from '@/app/actions/destroySession';
import { useAuth } from '@/context/authContext';

const Header = () => {
  const router = useRouter();
  const { isAuthenticated, setIsAuthenticated, currentUser, setCurrentUser, isAdmin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const { success, error } = await destroySession();

    if (success) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setDropdownOpen(false);
      setMobileMenuOpen(false);
      toast.success('V-ați deconectat cu succes');
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
                className='rounded-md px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-700 hover:text-white transition-colors'
              >
                <FaHome className='inline mr-1' /> Săli
              </Link>
              {isAuthenticated && (
                <>
                  <Link
                    href='/bookings'
                    className='rounded-md px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-700 hover:text-white transition-colors'
                  >
                    <FaCalendarCheck className='inline mr-1' /> Rezervări
                  </Link>
                  <Link
                    href='/my-reservations'
                    className='rounded-md px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-700 hover:text-white transition-colors'
                  >
                    <FaClipboardList className='inline mr-1' /> Rezervări săli
                  </Link>
                  <Link
                    href='/rooms/add'
                    className='rounded-md px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-700 hover:text-white transition-colors'
                  >
                    <FaPlusSquare className='inline mr-1' /> Adaugă sală
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
                  className='mr-3 text-gray-800 hover:text-gray-600 transition-colors'
                >
                  <FaSignInAlt className='inline mr-1' /> Autentificare
                </Link>
                <Link
                  href='/register'
                  className='mr-3 text-gray-800 hover:text-gray-600 transition-colors'
                >
                  <FaUser className='inline mr-1' /> Înregistrare
                </Link>
              </>
            ) : (
              <div className='relative'>
                {/* User dropdown trigger */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className='flex items-center text-gray-800 hover:text-gray-600 font-medium transition-colors'
                >
                  <FaUser className='mr-2' />
                  <span className='mr-1'>
                    {currentUser?.name || currentUser?.email || 'Utilizator'}
                  </span>
                  {isAdmin && (
                    <FaUserShield className='ml-1 text-red-500' title='Administrator' />
                  )}
                  <FaChevronDown className={`ml-1 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div className='absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50'>
                    {/* User info */}
                    <div className='px-4 py-2 border-b border-gray-100'>
                      <p className='text-sm font-medium text-gray-800'>
                        {currentUser?.name || 'Utilizator'}
                        {isAdmin && <span className='ml-2 text-red-500 text-xs'>Admin</span>}
                      </p>
                      <p className='text-sm text-gray-600'>
                        {currentUser?.email}
                      </p>
                    </div>

                    {/* Menu items */}
                    <Link
                      href='/account'
                      className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
                    >
                      <FaCog className='mr-3' />
                      Contul meu
                    </Link>

                    <Link
                      href='/rooms/my'
                      className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
                    >
                      <FaBuilding className='mr-3' />
                      Sălile mele
                    </Link>

                    {/* Admin link - doar pentru administratori */}
                    {isAdmin && (
                      <Link
                        href='/admin'
                        className='flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors'
                      >
                        <FaUserShield className='mr-3' />
                        Panou administrativ
                      </Link>
                    )}

                    <div className='border-t border-gray-100 mt-2 pt-2'>
                      <button
                        onClick={handleLogout}
                        className='flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors'
                      >
                        <FaSignOutAlt className='mr-3' />
                        Deconectare
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile layout */}
        <div className='md:hidden py-4'>
          {/* Header cu logo și toggle */}
          <div className='flex items-center justify-between w-full'>
            <div className='flex items-center space-x-3'>
              <Link href='/'>
                <Image src={logo} alt='Confbook' width={48} height={48} />
              </Link>
              {isAuthenticated && (
                <span className='text-gray-800 font-semibold'>
                  <FaUser className='inline mr-1' />
                  {currentUser?.name || currentUser?.email || 'User'}
                  {isAdmin && <FaUserShield className='ml-2 text-red-500' />}
                </span>
              )}
            </div>
            
            {/* Toggle button pentru meniul mobil */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className='text-gray-800 hover:text-gray-600 p-2'
            >
              <FaChevronDown className={`transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Meniul mobil */}
          {mobileMenuOpen && (
            <div className='mt-4 space-y-3 border-t border-gray-200 pt-4'>
              <Link 
                href='/' 
                className='block text-gray-800 hover:underline py-2'
              >
                <FaHome className='inline mr-2' /> Săli
              </Link>

              {isAuthenticated ? (
                <>
                  <Link 
                    href='/bookings' 
                    className='block text-gray-800 hover:underline py-2'
                  >
                    <FaCalendarCheck className='inline mr-2' /> Rezervări
                  </Link>
                  <Link 
                    href='/my-reservations' 
                    className='block text-gray-800 hover:underline py-2'
                  >
                    <FaClipboardList className='inline mr-2' /> Rezervări Săli
                  </Link>
                  <Link 
                    href='/rooms/add' 
                    className='block text-gray-800 hover:underline py-2'
                  >
                    <FaPlusSquare className='inline mr-2' /> Adaugă sală
                  </Link>
                  <Link 
                    href='/rooms/my' 
                    className='block text-gray-800 hover:underline py-2'
                  >
                    <FaBuilding className='inline mr-2' /> Sălile mele
                  </Link>
                  
                  <Link 
                    href='/account' 
                    className='block text-gray-800 hover:underline py-2'
                  >
                    <FaCog className='inline mr-2' /> Contul meu
                  </Link>
                  
                  {isAdmin && (
                    <Link 
                      href='/admin' 
                      className='block text-red-600 hover:underline py-2'
                    >
                      <FaUserShield className='inline mr-2' /> Panou administrativ
                    </Link>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className='block text-left text-red-600 hover:underline py-2 w-full'
                  >
                    <FaSignOutAlt className='inline mr-2' /> Deconectare
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href='/login' 
                    className='block text-gray-800 hover:underline py-2'
                  >
                    <FaSignInAlt className='inline mr-2' /> Autentificare
                  </Link>
                  <Link 
                    href='/register' 
                    className='block text-gray-800 hover:underline py-2'
                  >
                    <FaUser className='inline mr-2' /> Înregistrare
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
