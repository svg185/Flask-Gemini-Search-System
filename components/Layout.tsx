
import React from 'react';
import { User, AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange, user, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => onViewChange('search')}
          >
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-700 font-bold text-xl group-hover:scale-105 transition-transform">
              <i className="fas fa-brain"></i>
            </div>
            <h1 className="text-xl font-bold tracking-tight">Smart Knowledge</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-1 bg-blue-800 p-1 rounded-lg">
              <button 
                onClick={() => onViewChange('search')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  currentView === 'search' 
                  ? 'bg-white text-blue-700 shadow-sm' 
                  : 'text-blue-100 hover:bg-blue-600'
                }`}
              >
                Search
              </button>
              <button 
                onClick={() => onViewChange('add')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  currentView === 'add' 
                  ? 'bg-white text-blue-700 shadow-sm' 
                  : 'text-blue-100 hover:bg-blue-600'
                }`}
              >
                Contribute
              </button>
              {user && (
                <button 
                  onClick={() => onViewChange('profile')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    currentView === 'profile' 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-blue-100 hover:bg-blue-600'
                  }`}
                >
                  Profile
                </button>
              )}
            </nav>

            <div className="h-8 w-[1px] bg-blue-600 hidden md:block"></div>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs text-blue-200">Logged in as</p>
                    <p className="text-sm font-bold leading-tight">{user.username}</p>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-red-500 transition-colors flex items-center justify-center text-white border border-blue-500 shadow-inner group"
                    title="Logout"
                  >
                    <i className="fas fa-sign-out-alt group-hover:rotate-12 transition-transform"></i>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => onViewChange('auth')}
                  className="bg-white text-blue-700 px-5 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-blue-50 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-8 animate-fade-in">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-blue-700 font-bold opacity-75">
            <i className="fas fa-brain"></i>
            <span>Smart Knowledge Engine</span>
          </div>
          <div className="text-slate-400 text-sm">
            <p>&copy; {new Date().getFullYear()} - Professional AI-Enhanced Search Experience.</p>
          </div>
          <div className="flex gap-4 text-slate-400">
            <a href="#" className="hover:text-blue-600 transition-colors"><i className="fab fa-twitter"></i></a>
            <a href="#" className="hover:text-blue-600 transition-colors"><i className="fab fa-github"></i></a>
            <a href="#" className="hover:text-blue-600 transition-colors"><i className="fas fa-envelope"></i></a>
          </div>
        </div>
      </footer>
    </div>
  );
};
