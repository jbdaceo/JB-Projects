
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/auth';

interface AuthContextType {
  user: User | null;
  signInWithProvider: (provider: 'google' | 'apple' | 'facebook') => Promise<void>;
  signOut: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session
    const stored = localStorage.getItem('tmc_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const signInWithProvider = async (provider: 'google' | 'apple' | 'facebook') => {
    setLoading(true);
    try {
      // In a real flow, you'd get the provider token from the frontend SDK here
      const mockToken = "mock_provider_token_123";
      
      let userData: User;
      switch (provider) {
        case 'google':
          userData = await authService.loginWithGoogle(mockToken);
          break;
        case 'facebook':
          userData = await authService.loginWithFacebook(mockToken);
          break;
        case 'apple':
          userData = await authService.loginWithApple(mockToken);
          break;
      }

      setUser(userData);
      localStorage.setItem('tmc_user', JSON.stringify(userData));
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await authService.logout();
    setUser(null);
    localStorage.removeItem('tmc_user');
  };

  return (
    <AuthContext.Provider value={{ user, signInWithProvider, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
