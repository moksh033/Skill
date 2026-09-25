import { useState, useEffect, useCallback } from 'react';
import type { Role, UserRecord, DepartmentRecord, CategoryRecord, ServiceRequest } from './types';
import { api } from './services/api';
import { authService } from './services/auth';
import type { AuthUser } from './services/auth';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { StaffPortal } from './components/StaffPortal';
import { EngineerPortal } from './components/EngineerPortal';
import { TeamLeadPortal } from './components/TeamLeadPortal';
import { AdminPortal } from './components/AdminPortal';
import { RequestDrawer } from './components/RequestDrawer';
import { ToastProvider } from './components/ui/Toast';

function AppInner() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  const [currentRole, setCurrentRole] = useState<Role>('STAFF');
  const [currentUser, setCurrentUser] = useState<UserRecord>({
    user_id: '',
    name: '',
    username: '',
    role: 'STAFF',
    department: '',
  });
  const [engineers, setEngineers] = useState<UserRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [backendHealthy, setBackendHealthy] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Drawer state
  const [drawerRequest, setDrawerRequest] = useState<ServiceRequest | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Check for existing auth on mount
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const user = authService.getUser();
      if (user) {
        setAuthUser(user);
        setIsAuthenticated(true);
        setCurrentRole(user.role as Role);
        setCurrentUser({
          user_id: user.user_id,
          name: user.name,
          username: user.username,
          role: user.role as Role,
          department: user.department,
        });
      }
    }

    const onAuthLogout = () => {
      handleLogout();
    };
    window.addEventListener('auth:logout', onAuthLogout);
    return () => window.removeEventListener('auth:logout', onAuthLogout);
  }, []);

  // Handle login
  const handleLogin = (token: string, user: AuthUser) => {
    authService.setAuth(token, user);
    setAuthUser(user);
    setIsAuthenticated(true);
    setCurrentRole(user.role as Role);
    setCurrentUser({
      user_id: user.user_id,
      name: user.name,
      username: user.username,
      role: user.role as Role,
      department: user.department,
    });
  };

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setAuthUser(null);
    setCurrentRole('STAFF');
    setCurrentUser({
      user_id: '',
      name: '',
      username: '',
      role: 'STAFF',
      department: '',
    });
    setIsDrawerOpen(false);
    setDrawerRequest(null);
  };

  // Load global shared data (departments, categories, engineers)
  const loadSharedData = useCallback(async () => {
    try {
      setIsRefreshing(true);

      // Health check
      const healthRes = await api.checkHealth().catch(() => null);
      setBackendHealthy(!!healthRes && healthRes.status === 'running');

      const [deptRes, catRes, engRes] = await Promise.all([
        api.getAllDepartments().catch(() => ({ departments: [] })),
        api.getAllCategories().catch(() => ({ categories: [] })),
        api.getTeamLeadEngineers().catch(() => ({ engineers: [] })),
      ]);

      setDepartments(deptRes.departments || []);
      setCategories(catRes.categories || []);
      setEngineers(engRes.engineers || []);
    } catch {
      setBackendHealthy(false);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadSharedData();
    const interval = setInterval(loadSharedData, 30000); // auto-sync every 30s
    return () => clearInterval(interval);
  }, [loadSharedData, isAuthenticated]);

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} apiBase={api.getBaseUrl()} />;
  }

  const handleRoleChange = (role: Role) => {
    // Only allow switching if the user's actual role is ADMIN or TEAM_LEAD,
    // or if we're in demo/offline mode
    setCurrentRole(role);
    // Rebuild currentUser for the selected role based on auth user
    if (authUser) {
      setCurrentUser({
        user_id: authUser.user_id,
        name: authUser.name,
        username: authUser.username,
        role: role,
        department: authUser.department,
      });
    }
    setIsDrawerOpen(false);
    setDrawerRequest(null);
  };

  const handleEngineerChange = (eng: UserRecord) => {
    setCurrentUser(eng);
  };

  const handleRequestSelect = (req: ServiceRequest) => {
    setDrawerRequest(req);
    setIsDrawerOpen(true);
  };

  const handleRefreshNeeded = () => {
    setRefreshTrigger((n) => n + 1);
    loadSharedData();
  };

  const handleGlobalRefresh = () => {
    loadSharedData();
    setRefreshTrigger((n) => n + 1);
  };

  // Engineer to use for the Engineer portal (may differ from currentUser if TL is viewing)
  const activeEngineer =
    currentRole === 'SUPPORT_ENGINEER'
      ? engineers.find((e) => e.user_id === currentUser.user_id) || currentUser
      : engineers[0] || currentUser;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        currentUser={currentUser}
        backendHealthy={backendHealthy}
        onRefresh={handleGlobalRefresh}
        isRefreshing={isRefreshing}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Backend Offline / Demo Banner */}
        {!backendHealthy && (
          <div className="mb-6 p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black flex-shrink-0 text-sm">
                ⚡
              </div>
              <div>
                <p className="text-xs font-bold text-amber-900">
                  Interactive Demo Store Active
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  FastAPI server not detected. You can test all workflows with local data. To connect to live MongoDB: run <code className="font-mono bg-amber-100/80 px-1 py-0.5 rounded text-amber-900">uvicorn main:app --reload</code>.
                </p>
              </div>
            </div>
            <button
              onClick={handleGlobalRefresh}
              className="px-3.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200/80 rounded-xl transition-colors whitespace-nowrap shadow-2xs"
            >
              Check Connection
            </button>
          </div>
        )}

        {/* Page Header per Role */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            {currentRole === 'STAFF' && (
              <>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Clinical Support Desk
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Raise, track, and manage biomedical & facility support requests for your department.
                </p>
              </>
            )}
            {currentRole === 'SUPPORT_ENGINEER' && (
              <>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Engineering Workbench
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Your assigned service requests, repair progress, and field diagnostics.
                </p>
              </>
            )}
            {currentRole === 'TEAM_LEAD' && (
              <>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Dispatch &amp; Triage Console
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Assign unattended tickets, monitor engineer workloads, and track team SLA compliance.
                </p>
              </>
            )}
            {currentRole === 'ADMIN' && (
              <>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  System Administration
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Hospital-wide support telemetry, personnel directory, departments, and configuration.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Role Portals */}
        {currentRole === 'STAFF' && (
          <StaffPortal
            currentUser={currentUser}
            departments={departments}
            categories={categories}
            onRequestSelect={handleRequestSelect}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentRole === 'SUPPORT_ENGINEER' && (
          <EngineerPortal
            engineers={engineers}
            activeEngineer={activeEngineer}
            onEngineerChange={handleEngineerChange}
            onRequestSelect={handleRequestSelect}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentRole === 'TEAM_LEAD' && (
          <TeamLeadPortal
            engineers={engineers}
            onRequestSelect={handleRequestSelect}
            refreshTrigger={refreshTrigger}
            onRefreshNeeded={handleRefreshNeeded}
          />
        )}

        {currentRole === 'ADMIN' && (
          <AdminPortal
            onRequestSelect={handleRequestSelect}
            refreshTrigger={refreshTrigger}
            onRefreshNeeded={handleRefreshNeeded}
          />
        )}
      </main>

      {/* Request Drawer */}
      <RequestDrawer
        request={drawerRequest}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setDrawerRequest(null);
        }}
        currentUser={currentUser}
        currentRole={currentRole}
        engineers={engineers}
        onRefreshNeeded={handleRefreshNeeded}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
