'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Heading from '@/components/Heading';
import { useAuth } from '@/context/authContext';
import { useRouter } from 'next/navigation';
import { 
  FaChevronDown, 
  FaChevronUp, 
  FaTrash, 
  FaBuilding, 
  FaUsers, 
  FaCalendarCheck,
  FaExclamationTriangle 
} from 'react-icons/fa';
import { 
  getAllRoomsAdmin, 
  getAllUsersAdmin, 
  getAllBookingsAdmin,
  deleteRoomAdmin,
  deleteUserAdmin,
  deleteBookingAdmin
} from '@/app/actions/adminActions';

const AdminPanel = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    rooms: false,
    users: false,
    bookings: false
  });
  
  const [data, setData] = useState({
    rooms: [],
    users: [],
    bookings: []
  });

  // Verifică accesul admin
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!currentUser?.labels?.includes('admin')) {
      toast.error('Nu aveți permisiuni de administrator');
      router.push('/');
      return;
    }

    loadInitialData();
  }, [isAuthenticated, currentUser, router]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [roomsData, usersData, bookingsData] = await Promise.all([
        getAllRoomsAdmin(),
        getAllUsersAdmin(),
        getAllBookingsAdmin()
      ]);

      setData({
        rooms: roomsData,
        users: usersData,
        bookings: bookingsData
      });
    } catch (error) {
      toast.error('Eroare la încărcarea datelor');
      console.error(error);
    }
    setLoading(false);
  };

  const toggleSection = async (section) => {
    if (!expandedSections[section]) {
      // Se încarcă datele când se deschide secțiunea
      try {
        let newData;
        switch (section) {
          case 'rooms':
            newData = await getAllRoomsAdmin();
            setData(prev => ({ ...prev, rooms: newData }));
            break;
          case 'users':
            newData = await getAllUsersAdmin();
            setData(prev => ({ ...prev, users: newData }));
            break;
          case 'bookings':
            newData = await getAllBookingsAdmin();
            setData(prev => ({ ...prev, bookings: newData }));
            break;
        }
      } catch (error) {
        toast.error('Eroare la încărcarea datelor');
        return;
      }
    }

    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleDeleteRoom = async (roomId, roomName) => {
    if (!confirm(`Sunteți sigur că doriți să ștergeți sala "${roomName}"?`)) {
      return;
    }

    const result = await deleteRoomAdmin(roomId);
    if (result.success) {
      toast.success('Sala a fost ștearsă cu succes');
      setData(prev => ({
        ...prev,
        rooms: prev.rooms.filter(room => room.$id !== roomId)
      }));
    } else {
      toast.error(result.error || 'Eroare la ștergerea sălii');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Sunteți sigur că doriți să ștergeți utilizatorul "${userName}"? Această acțiune va șterge și toate sălile și rezervările asociate.`)) {
      return;
    }

    const result = await deleteUserAdmin(userId);
    if (result.success) {
      toast.success('Utilizatorul a fost șters cu succes');
      setData(prev => ({
        ...prev,
        users: prev.users.filter(user => user.$id !== userId)
      }));
    } else {
      toast.error(result.error || 'Eroare la ștergerea utilizatorului');
    }
  };

  const handleDeleteBooking = async (bookingId, roomName) => {
    if (!confirm(`Sunteți sigur că doriți să ștergeți rezervarea pentru "${roomName}"?`)) {
      return;
    }

    const result = await deleteBookingAdmin(bookingId);
    if (result.success) {
      toast.success('Rezervarea a fost ștearsă cu succes');
      setData(prev => ({
        ...prev,
        bookings: prev.bookings.filter(booking => booking.$id !== bookingId)
      }));
    } else {
      toast.error(result.error || 'Eroare la ștergerea rezervării');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Bucharest',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Se încarcă panoul administrativ...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser?.labels?.includes('admin')) {
    return (
      <div className="text-center py-12">
        <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-600">Nu aveți acces la această pagină.</p>
      </div>
    );
  }

  return (
    <>
      <Heading title="Panou Administrativ" />
      
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-2" />
          <p className="text-red-700 font-medium">
            Atenție! Aveți acces complet la toate datele sistemului. Folosiți aceste funcții cu grijă.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Secțiunea Săli */}
        <div className="bg-white shadow rounded-lg">
          <button
            onClick={() => toggleSection('rooms')}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
          >
            <div className="flex items-center">
              <FaBuilding className="mr-3 text-blue-500" />
              <h2 className="text-lg font-semibold">
                Săli ({data.rooms.length})
              </h2>
            </div>
            {expandedSections.rooms ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          
          {expandedSections.rooms && (
            <div className="border-t">
              {data.rooms.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  Nu există săli în sistem.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nume Sală</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proprietar</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacitate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preț/Oră</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.rooms.map((room) => (
                        <tr key={room.$id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{room.name}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {room.owner.name} ({room.owner.email})
                          </td>
                          <td className="px-6 py-4 text-gray-600">{room.capacity} persoane</td>
                          <td className="px-6 py-4 text-gray-600">{room.price_per_hour} lei</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDeleteRoom(room.$id, room.name)}
                              className="text-red-600 hover:text-red-800 flex items-center gap-1"
                            >
                              <FaTrash /> Șterge
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Secțiunea Utilizatori */}
        <div className="bg-white shadow rounded-lg">
          <button
            onClick={() => toggleSection('users')}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
          >
            <div className="flex items-center">
              <FaUsers className="mr-3 text-green-500" />
              <h2 className="text-lg font-semibold">
                Utilizatori ({data.users.length})
              </h2>
            </div>
            {expandedSections.users ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          
          {expandedSections.users && (
            <div className="border-t">
              {data.users.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  Nu există utilizatori în sistem.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nume</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Înregistrării</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.users.map((user) => (
                        <tr key={user.$id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 text-gray-600">{user.email}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {formatDate(user.$createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            {user.$id !== currentUser.id ? (
                              <button
                                onClick={() => handleDeleteUser(user.$id, user.name)}
                                className="text-red-600 hover:text-red-800 flex items-center gap-1"
                              >
                                <FaTrash /> Șterge
                              </button>
                            ) : (
                              <span className="text-gray-400">Admin curent</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Secțiunea Rezervări */}
        <div className="bg-white shadow rounded-lg">
          <button
            onClick={() => toggleSection('bookings')}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
          >
            <div className="flex items-center">
              <FaCalendarCheck className="mr-3 text-purple-500" />
              <h2 className="text-lg font-semibold">
                Rezervări ({data.bookings.length})
              </h2>
            </div>
            {expandedSections.bookings ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          
          {expandedSections.bookings && (
            <div className="border-t">
              {data.bookings.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  Nu există rezervări în sistem.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sală</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilizator</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-In</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-Out</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.bookings
                        .sort((a, b) => {
                          // Sortează rezervările: active primele, apoi după data check-out
                          const isActiveA = new Date(a.check_out) > new Date();
                          const isActiveB = new Date(b.check_out) > new Date();
                          
                          if (isActiveA && !isActiveB) return -1;
                          if (!isActiveA && isActiveB) return 1;
                          
                          // Dacă ambele sunt active sau ambele sunt expirate, sortează după check_out
                          return new Date(b.check_out) - new Date(a.check_out);
                        })
                        .map((booking) => {
                          const isActive = new Date(booking.check_out) > new Date();
                          return (
                            <tr key={booking.$id} className={`hover:bg-gray-50 ${isActive ? 'bg-green-50' : ''}`}>
                              <td className="px-6 py-4 font-medium text-gray-900">{booking.room.name}</td>
                              <td className="px-6 py-4 text-gray-600">
                                {booking.user.name} ({booking.user.email})
                              </td>
                              <td className="px-6 py-4 text-gray-600">
                                {formatDate(booking.check_in)}
                              </td>
                              <td className="px-6 py-4 text-gray-600">
                                {formatDate(booking.check_out)}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {isActive ? 'Activă' : 'Expirată'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => handleDeleteBooking(booking.$id, booking.room.name)}
                                  className="text-red-600 hover:text-red-800 flex items-center gap-1"
                                >
                                  <FaTrash /> Șterge
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminPanel;