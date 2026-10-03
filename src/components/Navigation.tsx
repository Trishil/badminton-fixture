import React from 'react';
import {
  Trophy,
  Calendar,
  Layers,
  Settings,
  Flame,
} from 'lucide-react';
import { useTournament } from '../context/TournamentContext';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, court1Match, court2Match } = useTournament();

  const navItems = [
    {
      id: 'courts' as const,
      label: 'Live Courts',
      shortLabel: 'Courts',
      icon: Flame,
      badge: court1Match || court2Match ? 'LIVE' : undefined,
    },
    {
      id: 'schedule' as const,
      label: 'Fixtures & Schedule',
      shortLabel: 'Fixtures',
      icon: Calendar,
    },
    {
      id: 'standings' as const,
      label: 'Group Standings',
      shortLabel: 'Standings',
      icon: Layers,
    },
    {
      id: 'knockout' as const,
      label: 'Knockout Playoff',
      shortLabel: 'Playoffs',
      icon: Trophy,
    },
    {
      id: 'admin' as const,
      label: 'Setup & Admin',
      shortLabel: 'Admin',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Desktop / Tablet Top Tabs */}
      <nav className="hidden md:block bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center space-x-1.5 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isActive
                          ? 'bg-white text-emerald-700'
                          : 'bg-emerald-100 text-emerald-700 animate-pulse'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Sticky Bottom Navigation Bar (Thumb Friendly & Ergonomic) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 pb-safe shadow-floating">
        <div className="grid grid-cols-5 px-1 py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-xl transition-all relative ${
                  isActive
                    ? 'text-emerald-700 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'text-emerald-600 scale-110' : 'text-slate-500'}`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </div>
                <span className={`text-[10px] mt-1 tracking-tight truncate max-w-[58px] ${isActive ? 'font-bold text-emerald-700' : 'font-medium'}`}>
                  {item.shortLabel}
                </span>
                {isActive && (
                  <span className="w-5 h-0.5 bg-emerald-600 rounded-full mt-0.5 absolute bottom-1" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
