import type React from 'react';
import { useState, useEffect } from 'react';
import {
  Building2,
  Tag,
  Users,
  Activity,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import type {
  AdminSummary,
  DepartmentRecord,
  CategoryRecord,
  UserRecord,
  ServiceRequest,
  AuditLogRecord,
  Role,
} from '../types';
import { api } from '../services/api';
import { StatusBadge, PriorityBadge } from './ui/Badge';
import { MetricCard } from './ui/MetricCard';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';

interface AdminPortalProps {
  onRequestSelect: (req: ServiceRequest) => void;
  refreshTrigger: number;
  onRefreshNeeded: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onRequestSelect,
  refreshTrigger,
  onRefreshNeeded,
}) => {
  const { toast } = useToast();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'DEPARTMENTS' | 'CATEGORIES' | 'USERS' | 'AUDIT'>('TELEMETRY');
  const [loading, setLoading] = useState(false);

  // Entities
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);

  // Modals
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userRole, setUserRole] = useState<Role>('STAFF');
  const [userDept, setUserDept] = useState('');

  useEffect(() => {
    loadAllAdminData();
  }, [refreshTrigger]);

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      const [sumRes, deptRes, catRes, userRes, reqRes, auditRes] = await Promise.all([
        api.getAdminSummary().catch(() => null),
        api.getAllDepartments().catch(() => ({ departments: [] })),
        api.getAllCategories().catch(() => ({ categories: [] })),
        api.getAllUsers().catch(() => ({ users: [] })),
        api.getAdminRequests().catch(() => ({ requests: [] })),
        api.getAuditLogs().catch(() => ({ audit_logs: [] })),
      ]);

      setSummary(sumRes);
      setDepartments(deptRes.departments || []);
      setCategories(catRes.categories || []);
      setUsers(userRes.users || []);
      setRequests(reqRes.requests || []);
      setAuditLogs(auditRes.audit_logs || []);
    } catch (err: any) {
      toast(err.message || 'Failed to load administration data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Create Department
  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    try {
      await api.createDepartment({ name: deptName.trim(), description: deptDesc.trim() });
      toast(`Department "${deptName}" created successfully`, 'success');
      setIsDeptModalOpen(false);
      setDeptName('');
      setDeptDesc('');
      loadAllAdminData();
      onRefreshNeeded();
    } catch (err: any) {
      toast(err.message || 'Failed to create department', 'error');
    }
  };

  // Delete Department
  const handleDeleteDept = async (name: string) => {
    if (!window.confirm(`Delete department "${name}"?`)) return;
    try {
      await api.deleteDepartment(name);
      toast(`Department "${name}" deleted`, 'success');
      loadAllAdminData();
      onRefreshNeeded();
    } catch (err: any) {
      toast(err.message || 'Failed to delete department', 'error');
    }
  };

  // Create Category
  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      await api.createCategory({ name: catName.trim().toUpperCase(), description: catDesc.trim() });
      toast(`Category "${catName}" created`, 'success');
      setIsCatModalOpen(false);
      setCatName('');
      setCatDesc('');
      loadAllAdminData();
      onRefreshNeeded();
    } catch (err: any) {
      toast(err.message || 'Failed to create category', 'error');
    }
  };

  // Delete Category
  const handleDeleteCat = async (name: string) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await api.deleteCategory(name);
      toast(`Category "${name}" deleted`, 'success');
      loadAllAdminData();
      onRefreshNeeded();
    } catch (err: any) {
      toast(err.message || 'Failed to delete category', 'error');
    }
  };

  // Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !userName.trim() || !userUsername.trim()) return;
    try {
      await api.createUser({
        user_id: userId.trim(),
        name: userName.trim(),
        username: userUsername.trim(),
        role: userRole,
        department: userDept.trim() || 'General',
      });
      toast(`User ${userName} (${userId}) registered`, 'success');
      setIsUserModalOpen(false);
      setUserId('');
      setUserName('');
      setUserUsername('');
      loadAllAdminData();
      onRefreshNeeded();
    } catch (err: any) {
      toast(err.message || 'Failed to register user', 'error');
    }
  };

  // Delete User
  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm(`Delete user "${uid}"?`)) return;
    try {
      await api.deleteUser(uid);
      toast(`User "${uid}" deleted`, 'success');
      loadAllAdminData();
      onRefreshNeeded();
    } catch (err: any) {
      toast(err.message || 'Failed to delete user', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Total Active Requests"
          value={summary?.requests?.total ?? requests.length}
          icon={<Activity className="w-4 h-4" />}
          colorScheme="sky"
          subtext="Hospital-wide support tickets"
        />
        <MetricCard
          label="Departments"
          value={departments.length}
          icon={<Building2 className="w-4 h-4" />}
          colorScheme="indigo"
          subtext="Active clinical divisions"
        />
        <MetricCard
          label="Support Categories"
          value={categories.length}
          icon={<Tag className="w-4 h-4" />}
          colorScheme="amber"
          subtext="Service taxonomy groups"
        />
        <MetricCard
          label="Personnel Registered"
          value={users.length}
          icon={<Users className="w-4 h-4" />}
          colorScheme="emerald"
          subtext="Staff & technical crew"
        />
      </div>

      {/* Admin Tab Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('TELEMETRY')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'TELEMETRY'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            System Telemetry
          </button>
          <button
            onClick={() => setActiveTab('DEPARTMENTS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'DEPARTMENTS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('CATEGORIES')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'CATEGORIES'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'USERS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Personnel ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'AUDIT'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>
        </div>

        <button
          onClick={loadAllAdminData}
          className="p-2 self-end md:self-auto rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          title="Reload admin telemetry"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tab: System Telemetry */}
      {activeTab === 'TELEMETRY' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-4">
              Ticket Status Distribution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {[
                { status: 'NEW', count: summary?.requests?.NEW || 0, color: 'bg-sky-50 text-sky-700' },
                { status: 'ASSIGNED', count: summary?.requests?.ASSIGNED || 0, color: 'bg-indigo-50 text-indigo-700' },
                { status: 'IN_PROGRESS', count: summary?.requests?.IN_PROGRESS || 0, color: 'bg-amber-50 text-amber-700' },
                { status: 'ON_HOLD', count: summary?.requests?.ON_HOLD || 0, color: 'bg-orange-50 text-orange-700' },
                { status: 'RESOLVED', count: summary?.requests?.RESOLVED || 0, color: 'bg-emerald-50 text-emerald-700' },
                { status: 'CLOSED', count: summary?.requests?.CLOSED || 0, color: 'bg-slate-100 text-slate-700' },
                { status: 'CANCELLED', count: summary?.requests?.CANCELLED || 0, color: 'bg-rose-50 text-rose-700' },
              ].map((item) => (
                <div key={item.status} className={`p-4 rounded-xl border border-slate-100 ${item.color}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block">
                    {item.status.replace('_', ' ')}
                  </span>
                  <div className="text-2xl font-extrabold mt-1">{item.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Master Request Feed */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-4">
              Master Request Audit Log ({requests.length})
            </h3>
            <div className="space-y-2.5">
              {requests.map((r) => (
                <div
                  key={r.request_id}
                  onClick={() => onRequestSelect(r)}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {r.request_id}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{r.title}</div>
                      <div className="text-[11px] text-slate-400">
                        {r.department} • {r.category}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    <PriorityBadge priority={r.priority} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Departments */}
      {activeTab === 'DEPARTMENTS' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsDeptModalOpen(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Department
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((d) => (
              <div
                key={d.name}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">{d.name}</h4>
                    <button
                      onClick={() => handleDeleteDept(d.name)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{d.description}</p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400">
                  Clinical Ward Unit
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Categories */}
      {activeTab === 'CATEGORIES' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsCatModalOpen(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div
                key={c.name}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {c.name}
                    </span>
                    <button
                      onClick={() => handleDeleteCat(c.name)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{c.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Personnel Directory */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Register Personnel
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-5 py-3">User ID</th>
                  <th className="px-5 py-3">Full Name</th>
                  <th className="px-5 py-3">Username</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 font-mono font-medium text-slate-700">{u.user_id}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{u.name}</td>
                    <td className="px-5 py-3.5 text-slate-500">@{u.username}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{u.department}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.user_id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: System Audit Trail */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">System Audit Log</h3>
            <span className="text-xs text-slate-400">Captured administrative & operational actions</span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
              No audit records currently found.
            </div>
          ) : (
            <div className="space-y-2.5">
              {auditLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-[10px] font-mono text-slate-400">by {log.user_id}</span>
                      <span className="text-[10px] bg-slate-200/60 px-1.5 py-0.2 rounded text-slate-600">
                        {log.target_type}:{log.target_id}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{log.description}</p>
                  </div>
                  {log.created_at && (
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Department Modal */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="Add Hospital Department"
        subtitle="Register a new clinical ward, laboratory, or operational wing"
      >
        <form onSubmit={handleCreateDept} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Department Name</label>
            <input
              type="text"
              placeholder="e.g. Oncology Ward"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Description & Scope</label>
            <textarea
              rows={3}
              placeholder="Primary surgical and inpatient services..."
              value={deptDesc}
              onChange={(e) => setDeptDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDeptModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs"
            >
              Save Department
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title="Add Request Category"
        subtitle="Define a new support categorization for hospital requests"
      >
        <form onSubmit={handleCreateCat} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Category Code (Uppercase)
            </label>
            <input
              type="text"
              placeholder="e.g. BIO_HAZARD_DISPOSAL"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Scope Description</label>
            <textarea
              rows={3}
              placeholder="Procedures and disposal protocols..."
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCatModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs"
            >
              Save Category
            </button>
          </div>
        </form>
      </Modal>

      {/* Add User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Register Hospital Personnel"
        subtitle="Create an authorized account for staff, technician, or supervisor"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Staff ID</label>
              <input
                type="text"
                placeholder="e.g. ENG220"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Username</label>
              <input
                type="text"
                placeholder="e.g. jsmith"
                value={userUsername}
                onChange={(e) => setUserUsername(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Jonathan Smith"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Assigned Role</label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as Role)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="STAFF">Department Staff (Nurse / Physician)</option>
                <option value="SUPPORT_ENGINEER">Biomedical / IT Support Engineer</option>
                <option value="TEAM_LEAD">Team Lead (Support Supervisor)</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Department</label>
              <input
                type="text"
                placeholder="e.g. Biomedical Services"
                value={userDept}
                onChange={(e) => setUserDept(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
