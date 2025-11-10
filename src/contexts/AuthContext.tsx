import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api';

interface User {
  id: string;
  email: string;
  name: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    name: string;
    username: string;
    phone_number: string;
  }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(username, password);
      const { access, refresh } = response.data;
      
      // Store tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      // Create user object
      const user = {
        id: '1',
        email: username,
        name: username,
        username,
      };
      
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Invalid credentials';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: {
    email: string;
    password: string;
    name: string;
    username: string;
    phone_number: string;
  }) => {
    setIsLoading(true);
    try {
      const [firstName, ...lastNameParts] = data.name.split(' ');
      const lastName = lastNameParts.join(' ') || firstName;
      
      await authApi.signup({
        email: data.email,
        first_name: firstName,
        last_name: lastName,
        password: data.password,
        username: data.username,
        phone_number: data.phone_number,
      });
      
      // Don't auto-login after signup, show activation message
      return;
    } catch (error: any) {
      const errorData = error.response?.data;
      let errorMessage = 'Signup failed';
      
      if (errorData) {
        if (errorData.username) {
          errorMessage = errorData.username[0];
        } else if (errorData.email) {
          errorMessage = errorData.email[0];
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
