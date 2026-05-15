import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/landing/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import DashboardShell from './components/layout/DashboardShell';
import { Toaster } from 'react-hot-toast';
import { supabase } from './services/supabase';
import type { Session } from '@supabase/supabase-js';

// --- Protected Route ---
const ProtectedRoute = ({ session, children }: { session: Session | null; children: React.ReactNode }) => {
  return session ? <>{children}</> : <Navigate to="/login" />;
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 flex items-center justify-center animate-pulse">
            <img src="/logo.png" alt="Ledgix Logo" className="w-16 h-16 object-contain" />
          </div>
          <p className="text-sm font-black text-slate-900 uppercase tracking-widest animate-pulse">Loading Ledgix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="contents">
      <Toaster position="top-right" reverseOrder={false} />
      <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={session ? <Navigate to="/dashboard" /> : <Register />} />
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute session={session}>
              <DashboardShell />
            </ProtectedRoute>
          } 
        />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </HashRouter>
    </div>
  );
}
