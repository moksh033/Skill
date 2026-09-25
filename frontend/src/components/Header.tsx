import type React from 'react';
import {
  Activity,
  Shield,
  Wrench,
  Users,
  Stethoscope,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import type { Role, UserRecord } from '../types';

interface HeaderProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  currentUser: UserRecord;
  backendHealthy: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  currentUser,
  backendHealthy,
  onRefresh,
  isRefreshing,
  onLogout,
}) => {
  const roleConfigs: Record<
    Role,
    { label: string; icon: React.ReactNode; color: string; badge: string }
  > = {
    STAFF: {
      label: 'Department Staff',
      icon: <Stethoscope className="w-4 h-4" />,
      color: 'text-sky-700 bg-sky-50 border-sky-200',
      badge: 'Nursing & Clinical Wards',
    },
    SUPPORT_ENGINEER: {
      label: 'Support Engineer',
      icon: <Wrench className="w-4 h-4" />,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      badge: 'Biomedical & IT Field Tech',
    },
    TEAM_LEAD: {
      label: 'Team Lead',
      icon: <Users className="w-4 h-4" />,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      badge: 'Dispatch & Workload Triage',
    },
    ADMIN: {
      label: 'Administrator',
      icon: <Shield className="w-4 h-4" />,
      color: 'text-slate-800 bg-slate-100 border-slate-300',
      badge: 'Hospital Operations & Directory',
    },
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  MedDesk
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 uppercase tracking-wider">
                  Ops Core
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Hospital Support & Clinical Engineering System
              </p>
            </div>
          </div>

          {/* Role Navigation Bar */}
          <div className="hidden lg:flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
            {(['STAFF', 'SUPPORT_ENGINEER', 'TEAM_LEAD', 'ADMIN'] as Role[]).map((role) => {
              const config = roleConfigs[role];
              const isActive = currentRole === role;
              return (
                <button
                  key={role}
                  onClick={() => onRoleChange(role)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {config.icon}
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* User Profile & Health Status */}
          <div className="flex items-center gap-3">
            {/* Backend Connectivity Status */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-50 border border-slate-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-slate-700">
                {backendHealthy ? 'FastAPI Live (:8000)' : 'Interactive Demo Store'}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Sync with database"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
            </button>

            {/* Active User Card & Sign Out */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.name || 'User'}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {currentUser.department || 'Hospital Operations'}
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 ml-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Role Switcher Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 border-t border-slate-100 gap-1 scrollbar-none">
          {(['STAFF', 'SUPPORT_ENGINEER', 'TEAM_LEAD', 'ADMIN'] as Role[]).map((role) => {
            const config = roleConfigs[role];
            const isActive = currentRole === role;
            return (
              <button
                key={role}
                onClick={() => onRoleChange(role)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 bg-slate-100'
                }`}
              >
                {config.icon}
                {config.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
