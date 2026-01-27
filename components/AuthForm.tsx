
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { User } from '../types';

interface AuthFormProps {
  onSuccess: (user: User) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const user = storageService.login(email);
      if (user) {
        onSuccess(user);
      } else {
        setError('User not found. Please register first.');
      }
    } else {
      if (!username || !email) {
        setError('Please fill in all fields.');
        return;
      }
      const user = storageService.register(username, email);
      storageService.login(email);
      onSuccess(user);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
          <i className={`fas ${isLogin ? 'fa-lock' : 'fa-user-plus'}`}></i>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="text-slate-500 mt-1">{isLogin ? 'Sign in to access your profile' : 'Join our community of knowledge sharing'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {!isLogin && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              placeholder="John Doe"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
            placeholder="name@company.com"
          />
        </div>

        {error && <p className="text-red-500 text-sm font-medium flex items-center gap-2 bg-red-50 p-3 rounded-lg"><i className="fas fa-info-circle"></i>{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-all transform active:scale-[0.98]"
        >
          {isLogin ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-blue-600 font-semibold hover:text-blue-800 transition-colors"
        >
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
};
