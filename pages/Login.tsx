
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onAuthSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onAuthSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { refreshProfile, user } = useAuth();

  // If user becomes available via global AuthContext while we are processing, navigate forward
  useEffect(() => {
    if (user && !loading) {
      onAuthSuccess();
    }
  }, [user, onAuthSuccess, loading]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    // Safety timeout: Reset processing state after 15 seconds if nothing happens
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError("Network connection is weak. Please check your internet and try again.");
      }
    }, 15000);

    try {
      if (isRegistering) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (signUpError) throw signUpError;
        alert("Registration initiated! If email confirmation is required, please check your inbox. Otherwise, you can now login.");
        setIsRegistering(false);
        setLoading(false);
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        
        // Wait for profile to sync from Supabase
        if (data.user) {
          await refreshProfile(data.user.id);
        }
        
        setLoading(false);
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify your credentials.");
      setLoading(false);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50/30">
      <div className="bg-white p-10 md:p-14 rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-slate-100 w-full max-w-md animate-fadeIn relative overflow-hidden">
        {/* Aesthetic background glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl"></div>
        
        <div className="text-center mb-12 relative">
          <div className="flex flex-col -space-y-1 mb-8">
            <span className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
              মুকি<span className="text-orange-500">ত</span>
            </span>
            <span className="text-[10px] font-black tracking-[0.4em] text-slate-300 uppercase">Premium Shopping</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
            {isRegistering ? 'Identity Setup' : 'Welcome Back'}
          </h2>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-2xl animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          {isRegistering && (
            <div className="group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-orange-500 transition-colors">Legal Full Name</label>
              <input
                required
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-5 px-6 focus:ring-0 focus:border-orange-500/20 focus:bg-white text-sm font-black uppercase italic transition-all outline-none"
                placeholder="YOUR NAME"
              />
            </div>
          )}
          
          <div className="group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-orange-500 transition-colors">Email Address</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-5 px-6 focus:ring-0 focus:border-orange-500/20 focus:bg-white text-sm font-bold transition-all outline-none"
              placeholder="name@example.com"
            />
          </div>

          <div className="group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-orange-500 transition-colors">Access Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-5 px-6 focus:ring-0 focus:border-orange-500/20 focus:bg-white text-sm font-bold transition-all outline-none"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-orange-600 transition-all active:scale-[0.97] shadow-2xl shadow-slate-200 disabled:bg-slate-400 disabled:cursor-not-allowed mt-6 italic"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (isRegistering ? 'Authorize Account' : 'Secure Login')}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-50 text-center">
          <button
            onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-orange-600 transition-all group"
          >
            {isRegistering ? (
              <span>Already verified? <span className="text-orange-500 group-hover:underline">Login</span></span>
            ) : (
              <span>Don't have an account? <span className="text-orange-500 group-hover:underline">Register</span></span>
            )}
          </button>
        </div>
      </div>
      <style>{`
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};

export default Login;
