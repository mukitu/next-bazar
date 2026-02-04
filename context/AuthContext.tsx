
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

// প্রমিজ টাইম-আউট ফাংশন
async function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Database Timeout')), ms);
  });
  return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initializationRef = useRef(false);

  const refreshProfile = useCallback(async (forceUserId?: string): Promise<Profile | null> => {
    try {
      let uid = forceUserId;
      
      if (!uid) {
        // Fix: Cast sessionRes to any to resolve 'unknown' type error on property 'data'
        const sessionRes = await withTimeout(supabase.auth.getSession(), 3000).catch(() => ({ data: { session: null } })) as any;
        uid = sessionRes.data?.session?.user?.id;
      }

      if (uid) {
        // প্রোফাইল চেক করার সময় রিট্রাই (Retry) লজিক
        for (let i = 0; i < 3; i++) {
          try {
            // Fix: Cast withTimeout result to any to resolve '{}' type error during destructuring of 'data' and 'error'
            const { data: profile, error } = (await withTimeout(
              supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
              3000
            )) as any;
            
            if (profile) {
              const profileData = profile as Profile;
              setUser(profileData);
              return profileData;
            }
          } catch (err) {
            console.warn(`Attempt ${i+1} failed to fetch profile:`, err);
          }
          await new Promise(r => setTimeout(r, 800));
        }
      }
    } catch (e) {
      console.warn("Auth initialization failed, proceeding as guest.");
    }
    
    if (!forceUserId) setUser(null);
    return null;
  }, []);

  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initAuth = async () => {
      try {
        await refreshProfile();
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await refreshProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
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
