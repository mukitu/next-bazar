
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
        // Fast timeout for profile fetch
        const fetchPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .single();
          
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile sync timeout')), 5000)
        );

        const result: any = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (result.data) {
          const profileData = result.data as Profile;
          setUser(profileData);
          return profileData;
        } else {
          // Fallback logic
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser && authUser.id === uid) {
             const fallbackProfile: Profile = {
                id: authUser.id,
                email: authUser.email!,
                role: 'user',
                full_name: authUser.user_metadata?.full_name || '',
                created_at: new Date().toISOString()
             };
             setUser(fallbackProfile);
             return fallbackProfile;
          }
        }
      }
    } catch (e) {
      console.warn("Auth sync warning:", e);
    } finally {
      // CRITICAL: Always ensure loading state is cleared
      setLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await refreshProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error("Auth init error:", e);
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          await refreshProfile(session.user.id);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshProfile]);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
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
