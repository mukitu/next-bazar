
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Profile } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: (forceUserId?: string) => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initializationRef = useRef(false);

  const refreshProfile = useCallback(async (forceUserId?: string): Promise<Profile | null> => {
    try {
      let uid = forceUserId;
      
      if (!uid) {
        const { data: { session } } = await supabase.auth.getSession();
        uid = session?.user?.id;
      }

      if (uid) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .single();
        
        if (profile) {
          const profileData = profile as Profile;
          setUser(profileData);
          return profileData;
        }
      }
    } catch (e) {
      console.warn("Background profile sync failed:", e);
    }
    return null;
  }, []);

  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initAuth = async () => {
      try {
        // Quick session check first
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await refreshProfile(session.user.id);
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        // Always stop loading regardless of success/fail
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await refreshProfile(session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [refreshProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
