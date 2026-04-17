import React, { createContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext({
  userRole: null,
  setUserRole: () => {},
  isLoading: true,
});

export const AuthProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const storedRole = await AsyncStorage.getItem('khidmati_role');
        if (storedRole) {
          setUserRole(storedRole);
          return;
        }

        const userData = await AsyncStorage.getItem('khidmati_user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user?.role) {
            setUserRole(user.role);
            await AsyncStorage.setItem('khidmati_role', user.role);
          }
        }
      } catch (error) {
        console.log('Auth context init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  return (
    <AuthContext.Provider value={{ userRole, setUserRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
