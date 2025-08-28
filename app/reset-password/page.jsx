'use client';
import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import resetPassword from '@/app/actions/resetPassword';

const ResetPasswordPage = () => {
  const [state, formAction] = useActionState(resetPassword, {});
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
    if (state.success) {
      toast.success(state.message);
      // Redirecționează la login după 2 secunde
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  }, [state, router]);

  if (!mounted) {
    return <div>Se încarcă...</div>;
  }

  if (!userId || !secret) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='bg-white shadow-lg rounded-lg p-6 w-full max-w-md text-center'>
          <h2 className='text-2xl font-bold text-gray-800 mb-4'>
            Link invalid
          </h2>
          <p className='text-gray-600 mb-4'>
            Link-ul de resetare este invalid sau a expirat.
          </p>
          <Link
            href='/forgot-password'
            className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors'
          >
            Solicită un nou link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='bg-white shadow-lg rounded-lg p-6 w-full max-w-md'>
        <h2 className='text-2xl font-bold text-center text-gray-800 mb-6'>
          Setează parola nouă
        </h2>

        {state.success ? (
          <div className='text-center'>
            <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-4'>
              <p className='text-green-700'>{state.message}</p>
            </div>
            <p className='text-sm text-gray-600'>
              Veți fi redirecționat către pagina de autentificare...
            </p>
          </div>
        ) : (
          <form action={formAction}>
            <input type='hidden' name='userId' value={userId} />
            <input type='hidden' name='secret' value={secret} />

            <div className='mb-4'>
              <label
                htmlFor='password'
                className='block text-gray-700 font-bold mb-2'
              >
                Parola nouă
              </label>
              <input
                type='password'
                id='password'
                name='password'
                className='border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Introduceți parola nouă'
                minLength={8}
                required
              />
            </div>

            <div className='mb-6'>
              <label
                htmlFor='confirmPassword'
                className='block text-gray-700 font-bold mb-2'
              >
                Confirmă parola
              </label>
              <input
                type='password'
                id='confirmPassword'
                name='confirmPassword'
                className='border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Confirmați parola nouă'
                minLength={8}
                required
              />
            </div>

            <div className='mb-6'>
              <button
                type='submit'
                className='bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600 transition-colors font-medium'
              >
                Resetează parola
              </button>
            </div>

            <div className='text-center'>
              <Link
                href='/login'
                className='text-blue-500 hover:text-blue-700 text-sm'
              >
                Înapoi la autentificare
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;