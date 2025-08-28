'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useActionState } from 'react';
import { toast } from 'react-toastify';
import createSession from '../actions/createSession';
import checkAuth from '../actions/checkAuth';
import { useAuth } from '@/context/authContext';

const LoginPage = () => {
  const [state, formAction] = useActionState(createSession, {});
  const { setIsAuthenticated, setCurrentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleLogin = async () => {
      if (state.error) {
        toast.error(state.error);
      } else if (state.success) {
        const { isAuthenticated, user } = await checkAuth();
        setIsAuthenticated(isAuthenticated);
        setCurrentUser(user);
        toast.success('Autentificare reușită!');
        router.push('/');
      }
    };

    handleLogin();
  }, [state, setIsAuthenticated, setCurrentUser, router]);

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='bg-white shadow-lg rounded-lg p-6 w-full max-w-sm'>
        <form action={formAction}>
          <h2 className='text-2xl font-bold text-center text-gray-800 mb-6'>
            Autentificare
          </h2>

          <div className='mb-4'>
            <label htmlFor='email' className='block text-gray-700 font-bold mb-2'>
              Email
            </label>
            <input
              type='email'
              id='email'
              name='email'
              className='border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
              autoComplete='email'
              required
            />
          </div>

          <div className='mb-6'>
            <label htmlFor='password' className='block text-gray-700 font-bold mb-2'>
              Parolă
            </label>
            <input
              type='password'
              id='password'
              name='password'
              className='border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
              autoComplete='current-password'
              required
            />
          </div>

          <div className='flex flex-col gap-4'>
            <button
              type='submit'
              className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-medium'
            >
              Autentificare
            </button>

            <div className='text-center'>
              <Link
                href='/forgot-password'
                className='text-blue-500 hover:text-blue-700 text-sm'
              >
                Am uitat parola
              </Link>
            </div>

            <div className='text-center border-t pt-4'>
              <p className='text-sm text-gray-600'>
                Nu aveți cont?{' '}
                <Link href='/register' className='text-blue-500 hover:text-blue-700 font-medium'>
                  Înregistrare
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;