import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, StudentProfile, DemoAccount } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: StudentProfile | null;
  permissions: string[];
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  switchDemoUser: (demo: DemoAccount) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      if (!api.getToken()) {
        setUser(null);
        setProfile(null);
        setPermissions([]);
        setIsLoading(false);
        return;
      }

      const res = await api.getCurrentUser();
      setUser(res.user);
      setProfile(res.profile || null);
      setPermissions(res.permissions || []);
    } catch (err) {
      console.warn('Session expired or invalid, clearing token');
      api.setToken(null);
      setUser(null);
      setProfile(null);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, pass);
      setUser(res.user);
      setProfile(res.profile || null);
      setPermissions(res.permissions || []);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(payload);
      setUser(res.user);
      setProfile(res.profile || null);
      setPermissions(['complaints:create', 'complaints:view_own']);
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoUser = async (demo: DemoAccount) => {
    await login(demo.email, demo.password);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
    } finally {
      setUser(null);
      setProfile(null);
      setPermissions([]);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        permissions,
        isLoading,
        login,
        register,
        switchDemoUser,
        logout,
        refreshUser
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
