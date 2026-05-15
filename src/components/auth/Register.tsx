import React, { useState } from 'react';
import { TrendingUp, Mail, Lock, ArrowRight, User, Building, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    password: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            company: formData.company,
          }
        }
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success('Account created! You can now sign in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-8 text-center space-y-2 border-b border-slate-50">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/20 mx-auto mb-4">
            <TrendingUp size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Create Account</h2>
          <p className="text-slate-500 text-sm">Join the professional cloud ledger network.</p>
        </div>

        <form onSubmit={handleRegister} className="p-8 space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-2">
                <User size={14} />
                <span>Full Name</span>
              </label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all"
                placeholder="John Doe"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-2">
                <Building size={14} />
                <span>Company Name</span>
              </label>
              <input 
                type="text" 
                required
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all"
                placeholder="Acme Corp"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-2">
                <Mail size={14} />
                <span>Email Address</span>
              </label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all"
                placeholder="name@company.com"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-2">
                <Lock size={14} />
                <span>Password</span>
              </label>
              <input 
                type="password" 
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all"
                placeholder="Min. 6 characters"
                disabled={loading}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl text-sm font-black shadow-lg shadow-indigo-900/20 hover:bg-indigo-500 hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2 group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <p className="text-center text-sm text-slate-500 pt-4">
            Already have an account? <Link to="/login" className="font-bold text-primary-600 hover:underline">Sign in instead</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
