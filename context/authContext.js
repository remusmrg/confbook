import { createContext, useContext, useState, useEffect } from 'react';
import checkAuth from '@/app/actions/checkAuth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      const { isAuthenticated, user } = await checkAuth();
      setIsAuthenticated(isAuthenticated);
      setCurrentUser(user);
      setIsAdmin(user && user.labels && user.labels.includes('admin'));
    };

    checkAuthentication();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        currentUser,
        setCurrentUser,
        isAdmin,
        setIsAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};