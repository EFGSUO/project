import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export type AppUser = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  assigned_vehicles: string[];
  created_at: string;
  created_by?: string;
};

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppUser = async (email: string) => {
    try {
      console.log('Fetching app user for email:', email);
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('Error fetching app user:', error);
        setAppUser(null);
        return;
      }

      if (!data) {
        console.log('User not found in app_users, creating...');
        const { data: newUser, error: createError } = await supabase
          .from('app_users')
          .insert([
            {
              email: email,
              full_name: email.split('@')[0],
              role: 'user',
              assigned_vehicles: []
            }
          ])
          .select()
          .single();
        
        if (createError) {
          console.error('Error creating app user:', createError);
          setAppUser(null);
        } else {
          console.log('Created new app user:', newUser);
          setAppUser(newUser);
        }
      } else {
        console.log('Found existing app user:', data);
        setAppUser(data);
      }
    } catch (error) {
      console.error('Error fetching app user:', error);
      setAppUser(null);
    }
  };
  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user?.email) {
        await fetchAppUser(session.user.email);
      }
      
      setLoading(false);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user?.email) {
          setLoading(true);
          await fetchAppUser(session.user.email);
        } else {
          setAppUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const refreshAppUser = async () => {
    if (user?.email) {
      setLoading(true);
      await fetchAppUser(user.email);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    appUser,
    loading,
    signIn,
    signOut,
    refreshAppUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}