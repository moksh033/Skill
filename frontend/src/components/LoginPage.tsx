import { useState } from 'react';
import {
  Activity,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  UserPlus,
  User,
  Shield,
  Stethoscope,
  Wrench,
  Users,
  Building2,
  IdCard,
  AlertCircle,
} from 'lucide-react';
import type { AuthUser } from '../services/auth';

interface LoginPageProps {
  onLogin: (token: string, user: AuthUser) => void;
  apiBase: string;
}

const ROLES = [
  { value: 'STAFF', label: 'Staff', icon: Stethoscope, color: 'bg-sky-50 border-sky-200 text-sky-700', activeRing: 'ring-sky-300' },
  { value: 'SUPPORT_ENGINEER', label: 'Engineer', icon: Wrench, color: 'bg-amber-50 border-amber-200 text-amber-700', activeRing: 'ring-amber-300' },
  { value: 'TEAM_LEAD', label: 'Team Lead', icon: Users, color: 'bg-indigo-50 border-indigo-200 text-indigo-700', activeRing: 'ring-indigo-300' },
  { value: 'ADMIN', label: 'Admin', icon: Shield, color: 'bg-slate-100 border-slate-300 text-slate-700', activeRing: 'ring-slate-400' },
];

const DEMO_ACCOUNTS = [
  { username: 'elena', role: 'Staff', icon: Stethoscope, accent: 'text-sky-600 bg-sky-50 border-sky-200 hover:bg-sky-100' },
  { username: 'arun', role: 'Engineer', icon: Wrench, accent: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100' },
  { username: 'marcus', role: 'Team Lead', icon: Users, accent: 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100' },
  { username: 'admin', role: 'Admin', icon: Shield, accent: 'text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100' },
];

export function LoginPage({ onLogin, apiBase }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Register-only fields
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('STAFF');
  const [department, setDepartment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const body = isRegister
        ? { user_id: userId, name, username, password, role, department }
        : { username, password };

      const res = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(err.detail || 'Authentication failed');
      }

      const data = await res.json();
      const token = data.access_token;

      // Decode the JWT to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user: AuthUser = {
        user_id: payload.user_id,
        username: payload.sub,
        name: payload.name,
        role: payload.role,
        department: payload.department,
      };

      onLogin(token, user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (uname: string) => {
    setUsername(uname);
    setPassword('password123');
    setIsRegister(false);
    setError('');
  };

  const inputClass =
    'w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all text-sm';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white shadow-sm mb-4">
            <Activity className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            MedDesk
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Hospital Support &amp; Clinical Engineering
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-7">
          {/* Tab Toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                !isRegister
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                isRegister
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Register
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Register-only fields */}
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">User ID</label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="register-user-id"
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      required
                      placeholder="e.g. STF102"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="register-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g. Dr. John Smith"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                          role === r.value
                            ? `${r.color} ring-2 ${r.activeRing} shadow-xs`
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                      >
                        <r.icon className="w-4 h-4" />
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Department</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="register-department"
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                      placeholder="e.g. ICU, Radiology"
                      className={inputClass}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter username"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                  className="w-full pl-10 pr-12 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  {isRegister ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          {!isRegister && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider text-center">
                Demo Accounts — click to autofill
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => fillDemo(acc.username)}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-semibold transition-all duration-200 ${acc.accent}`}
                  >
                    <acc.icon className="w-3.5 h-3.5" />
                    <div className="text-left">
                      <span className="font-mono">@{acc.username}</span>
                      <span className="block text-[10px] opacity-60 mt-0.5">{acc.role}</span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-3">
                Default password: <code className="text-slate-500 font-mono bg-slate-100 px-1 py-0.5 rounded">password123</code>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-5">
          Hospital Support Request System v1.0 — JWT Auth
        </p>
      </div>
    </div>
  );
}
