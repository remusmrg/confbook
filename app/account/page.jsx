'use client';
import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { toast } from 'react-toastify';
import Heading from '@/components/Heading';
import { useAuth } from '@/context/authContext';
import { FaUser, FaEnvelope, FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import changePassword from '@/app/actions/changePassword';

const AccountPage = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [state, formAction] = useActionState(changePassword, {});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
    if (state.success) {
      toast.success(state.message);
      // Reset form
      document.getElementById('password-form').reset();
    }
  }, [state]);

  if (!isAuthenticated || !currentUser) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-600'>Trebuie să fiți autentificat pentru a accesa această pagină.</p>
      </div>
    );
  }

  return (
    <>
      <Heading title='Contul meu' />
      
      <div className='max-w-2xl mx-auto space-y-6'>
        
        {/* Informații cont */}
        <div className='bg-white shadow rounded-lg p-6'>
          <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center'>
            <FaUser className='mr-2 text-blue-500' />
            Informații cont
          </h2>
          
          <div className='space-y-4'>
            <div className='flex items-center p-3 bg-gray-50 rounded-lg'>
              <FaUser className='text-gray-400 mr-3' />
              <div>
                <label className='block text-sm font-medium text-gray-600'>Nume</label>
                <p className='text-gray-800 font-medium'>
                  {currentUser.name || 'Nu este specificat'}
                </p>
              </div>
            </div>
            
            <div className='flex items-center p-3 bg-gray-50 rounded-lg'>
              <FaEnvelope className='text-gray-400 mr-3' />
              <div>
                <label className='block text-sm font-medium text-gray-600'>Email</label>
                <p className='text-gray-800 font-medium'>{currentUser.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Schimbare parolă */}
        <div className='bg-white shadow rounded-lg p-6'>
          <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center'>
            <FaKey className='mr-2 text-green-500' />
            Schimbare parolă
          </h2>
          
          <form id='password-form' action={formAction} className='space-y-4'>
            
            {/* Parola actuală */}
            <div>
              <label 
                htmlFor='currentPassword' 
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Parola actuală
              </label>
              <div className='relative'>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  id='currentPassword'
                  name='currentPassword'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600'
                >
                  {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Parola nouă */}
            <div>
              <label 
                htmlFor='newPassword' 
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Parola nouă
              </label>
              <div className='relative'>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id='newPassword'
                  name='newPassword'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10'
                  minLength={8}
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600'
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <p className='text-xs text-gray-500 mt-1'>
                Parola trebuie să aibă cel puțin 8 caractere
              </p>
            </div>

            {/* Confirmă parola */}
            <div>
              <label 
                htmlFor='confirmPassword' 
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Confirmă parola nouă
              </label>
              <div className='relative'>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id='confirmPassword'
                  name='confirmPassword'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10'
                  minLength={8}
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600'
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className='pt-4'>
              <button
                type='submit'
                className='bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors font-medium'
              >
                Schimbă parola
              </button>
            </div>
          </form>
        </div>

        {/* Informații suplimentare */}
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <h3 className='font-medium text-blue-800 mb-2'>Securitatea contului</h3>
          <ul className='text-sm text-blue-700 space-y-1'>
            <li>• Folosiți o parolă puternică și unică</li>
            <li>• Nu împărtășiți parola cu nimeni</li>
            <li>• Schimbați parola periodic pentru securitate maximă</li>
          </ul>
        </div>

      </div>
    </>
  );
};

export default AccountPage;