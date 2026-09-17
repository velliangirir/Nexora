import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLogo } from './AppLogo';
import { HowItWorksModal } from './HowItWorksModal';
import { LayoutDashboard, PlusCircle, History, BarChart3, LogOut, HelpCircle, Brain, Download } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        console.log('[PWA] User accepted mobile app installation');
      }
      setDeferredPrompt(null);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <AppLogo className="w-10 h-10 group-hover:scale-105 transition-transform" />
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                NEXORA<span className="text-sky-400"> AI</span>
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-mono">Decision Simulator</span>
            </div>
          </Link>

          {/* Navigation Links */}
          {isAuthenticated ? (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/dashboard') ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              <Link
                to="/create"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/create') ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                New Decision
              </Link>

              <Link
                to="/history"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/history') ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <History className="w-4 h-4" />
                History
              </Link>

              <Link
                to="/analytics"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/analytics') ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Link>

              <Link
                to="/adaptive-insights"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/adaptive-insights') ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Brain className="w-4 h-4 text-purple-400" />
                Adaptive Insights
              </Link>

              <button
                onClick={() => setIsGuideOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-sky-400" />
                How It Works
              </button>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
              <button
                onClick={() => setIsGuideOpen(true)}
                className="hover:text-white transition-colors flex items-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4 text-sky-400" />
                How It Works
              </button>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
            </nav>
          )}

          {/* User / Auth CTAs */}
          <div className="flex items-center gap-3">
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/25 hover:brightness-110 transition-all animate-pulse"
                title="Install NEXORA AI App on Mobile"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
            )}

            <button
              onClick={() => setIsGuideOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-800"
              title="How It Works Guide"
            >
              <HelpCircle className="w-4 h-4 text-sky-400" />
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 hidden sm:inline-block">
                  Hi, <strong className="text-slate-200">{user?.name}</strong>
                </span>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25 hover:brightness-110 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* How It Works Guide Modal */}
      <HowItWorksModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </>
  );
};

