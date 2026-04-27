import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, History, BookOpen, MoonStar, MessageCircle, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function Layout() {
  const { isDarkMode } = useAppStore();
  
  return (
    <div className={`flex flex-col h-screen ${isDarkMode ? 'dark' : ''} bg-[#F9F5F0] dark:bg-[var(--color-dark-bg)] text-[#1a1a1a] font-nunito overflow-hidden`}>
      <header className="w-full h-16 bg-[#1B6B3A] flex items-center justify-between px-6 sm:px-8 shadow-md border-b-4 border-[#C9A84C] flex-shrink-0 z-10 transition-colors">
        <div className="flex items-center gap-2">
          <MoonStar size={24} className="text-[#C9A84C]" strokeWidth={2.5} />
          <h1 className="text-2xl font-amiri italic font-bold text-white tracking-wide">HalalScan</h1>
        </div>
        <div className="flex items-center">
          <div className="px-2 py-1 bg-[#C9A84C] text-[#1B6B3A] rounded font-bold text-[10px] sm:text-xs shadow-sm">BETA</div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto dark:text-gray-100 transition-colors relative flex flex-col pt-0">
        <Outlet />
      </div>

      <nav className="flex-none bg-white dark:bg-[#1a2e22] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border-t border-gray-200 dark:border-gray-800 transition-colors z-10 relative h-14 sm:h-16 flex items-center">
        <div className="flex flex-row justify-around max-w-md mx-auto w-full">
          <NavItem to="/" icon={<Home size={22} />} />
          <NavItem to="/history" icon={<History size={22} />} />
          <NavItem to="/chat" icon={<MessageCircle size={22} />} />
          <NavItem to="/knowledge" icon={<BookOpen size={22} />} />
          <NavItem to="/profile" icon={<User size={22} />} />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ to, icon }: { to: string; icon: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <NavLink 
      to={to} 
      className={`flex flex-col items-center justify-center p-2 rounded-full transition-all duration-200 ${isActive ? 'text-[#1B6B3A] dark:text-green-400 bg-[#1B6B3A]/10 dark:bg-green-400/10' : 'text-gray-300 dark:text-gray-500 hover:text-gray-400 dark:hover:text-gray-400'}`}
    >
      {icon}
    </NavLink>
  );
}
