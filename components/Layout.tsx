
import React from 'react';
import { User, AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  user: User | null;
  onLogout: () => void;
}

const Logo = () => (
  <div className="flex items-center gap-3 select-none group">
    <div className="relative">
      <div className="absolute inset-0 bg-white/30 blur-lg rounded-full group-hover:bg-white/50 transition-all"></div>
      <div className="relative w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-xl transform group-hover:rotate-6 transition-transform overflow-hidden">
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-blue-700 fill-current">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" className="opacity-20" />
          <path d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3ZM12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C15.31 6 18 8.69 18 12C18 15.31 15.31 18 12 18Z" />
          <circle cx="12" cy="12" r="3" className="animate-pulse" />
        </svg>
      </div>
    </div>
    <div className="flex flex-col">
      <span className="text-xl font-black leading-none tracking-tight text-white">SK<span className="text-blue-200">ENGINE</span></span>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300 leading-none mt-1">Intelligent Search</span>
    </div>
  </div>
);

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange, user, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-blue-700 text-white shadow-2xl sticky top-0 z-50 border-b border-blue-600/50">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div 
            className="cursor-pointer"
            onClick={() => onViewChange('search')}
          >
            <Logo />
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="hidden lg:flex gap-1 bg-blue-800/40 p-1.5 rounded-2xl border border-blue-600/30">
              <button 
                onClick={() => onViewChange('search')}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                  currentView === 'search' 
                  ? 'bg-white text-blue-700 shadow-xl scale-[1.02]' 
                  : 'text-blue-100 hover:text-white hover:bg-blue-600/50'
                }`}
              >
                Search
              </button>
              <button 
                onClick={() => onViewChange('add')}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                  currentView === 'add' 
                  ? 'bg-white text-blue-700 shadow-xl scale-[1.02]' 
                  : 'text-blue-100 hover:text-white hover:bg-blue-600/50'
                }`}
              >
                Contribute
              </button>
              {user && (
                <button 
                  onClick={() => onViewChange('profile')}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                    currentView === 'profile' 
                    ? 'bg-white text-blue-700 shadow-xl scale-[1.02]' 
                    : 'text-blue-100 hover:text-white hover:bg-blue-600/50'
                  }`}
                >
                  My Profile
                </button>
              )}
              {user?.role === 'admin' && (
                <button 
                  onClick={() => onViewChange('admin')}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                    currentView === 'admin' 
                    ? 'bg-white text-blue-700 shadow-xl scale-[1.02]' 
                    : 'text-blue-100 hover:text-white hover:bg-blue-600/50'
                  }`}
                >
                  <i className="fas fa-shield-alt mr-2 text-blue-300"></i>
                  Admin
                </button>
              )}
            </nav>

            <div className="h-10 w-[1px] bg-blue-600/50 hidden lg:block"></div>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end">
                    <p className="text-[10px] text-blue-300 font-black uppercase tracking-widest">Active Session</p>
                    <p className="text-sm font-bold leading-tight flex items-center gap-2">
                      {user.username}
                      {user.role === 'admin' && <i className="fas fa-check-circle text-blue-300 text-[10px]"></i>}
                    </p>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="w-12 h-12 rounded-2xl bg-blue-600/50 hover:bg-red-500 transition-all flex items-center justify-center text-white border border-blue-500/50 shadow-lg group"
                    title="Logout"
                  >
                    <i className="fas fa-power-off group-hover:scale-110 transition-transform"></i>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => onViewChange('auth')}
                  className="bg-white text-blue-700 px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-blue-50 hover:-translate-y-0.5 transition-all"
                >
                  Authentication
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-12 animate-fade-in">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="opacity-50 grayscale hover:grayscale-0 transition-all">
             <Logo />
          </div>
          <div className="text-slate-400 text-sm font-medium text-center md:text-left">
            <p>&copy; {new Date().getFullYear()} SK ENGINE. Engineered for high-speed knowledge retrieval.</p>
            <p className="text-[10px] uppercase tracking-widest mt-1 opacity-60">Local-First Architecture • Gemini AI Fallback</p>
          </div>
          <div className="flex gap-6 text-slate-300">
            <a href="#" className="hover:text-blue-600 transition-colors text-xl"><i className="fab fa-twitter"></i></a>
            <a href="#" className="hover:text-blue-600 transition-colors text-xl"><i className="fab fa-github"></i></a>
            <a href="#" className="hover:text-blue-600 transition-colors text-xl"><i className="fas fa-shield-virus"></i></a>
          </div>
        </div>
      </footer>
    </div>
  );
};
