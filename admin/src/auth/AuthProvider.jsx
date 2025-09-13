import React, { useState, useEffect, createContext, useContext } from 'react';
import { AuthService } from '@services/AuthService'; // Ajusta la ruta

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Verificar si hay token guardado
        if (!AuthService.hasStoredToken()) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Validar el token actual
        const userData = await AuthService.validateCurrentToken();
        setUser(userData);
        
      } catch (error) {
        console.error('Error checking authentication:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      setLoading(true);
      const result = await AuthService.login(username, password);
      
      if (result.success) {
        // El token ya se guardó automáticamente en AuthService.login()
        // Ahora obtenemos los datos del usuario
        const userData = await AuthService.getCurrentUser();
        setUser(userData);
        return { success: true, user: userData };
      }
      
      return result;
      
    } catch (error) {
      console.error('Login error in AuthProvider:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout(); // Elimina el token de localStorage
    setUser(null);
  };

  const updateUser = async (userData) => {
    try {
      const result = await AuthService.updateCurrentUser(userData);
      
      if (result.success) {
        // Actualizar el estado local con los nuevos datos
        setUser(result.user);
      }
      
      return result;
    } catch (error) {
      console.error('Update user error in AuthProvider:', error);
      return { success: false, error: error.message };
    }
  };

  const changePassword = async (newPassword) => {
    try {
      const result = await AuthService.changeCurrentPassword(newPassword);
      return result;
    } catch (error) {
      console.error('Change password error in AuthProvider:', error);
      return { success: false, error: error.message };
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await AuthService.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Refresh user error:', error);
      setUser(null);
      return null;
    }
  };

  const isAuthenticated = () => {
    return user !== null && AuthService.hasStoredToken();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      updateUser,
      changePassword,
      refreshUser,
      isAuthenticated,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export { useAuth };
export default AuthProvider;