'use client';
import { useEffect } from 'react';
import { useActionState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import requestPasswordReset from '@/app/actions/requestPasswordReset';

const ForgotPasswordPage = () => {
  const [state, formAction] = useActionState(requestPasswordReset, {});
  const router = useRouter();

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
    if (state.success) {
      toast.success(state.message);
      // Redirecționează după 3 secunde
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  }, [state, router]);

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='bg-white shadow-lg rounded-lg p-6 w-full max-w-md'>
        <h2 className='text-2xl font-bold text-center text-gray-800 mb-6'>
          Resetare parolă
        </h2>

        {state.success ? (
          <div className='text-center'>
            <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-4'>
              <p className='text-green-700'>{state.message}</p>
            </div>
            <p className='text-sm text-gray-600 mb-4'>
              Verificați-vă căsuța de email și urmați instrucțiunile pentru a vă reseta parola.
            </p>
            <Link
              href='/login'
              className='text-blue-500 hover:text-blue-700 font-medium'
            >
              Înapoi la autentificare
            </Link>
          </div>
        ) : (
          <form action={formAction}>
            <div className='mb-4'>
              <label
                htmlFor='email'
                className='block text-gray-700 font-bold mb-2'
              >
                Adresa de email
              </label>
              <input
                type='email'
                id='email'
                name='email'
                className='border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Introduceți adresa de email'
                autoComplete='email'
                required
              />
            </div>

            <div className='mb-6'>
              <button
                type='submit'
                className='bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600 transition-colors font-medium'
              >
                Trimite instrucțiuni de resetare
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

export default ForgotPasswordPage;