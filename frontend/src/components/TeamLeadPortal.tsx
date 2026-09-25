import type React from 'react';
import { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
  ShieldAlert,
  Building2,
} from 'lucide-react';
import type { ServiceRequest, UserRecord } from '../types';
import { api } from '../services/api';
import { StatusBadge, PriorityBadge } from './ui/Badge';
import { MetricCard } from './ui/MetricCard';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';

interface TeamLeadPortalProps {
  engineers: UserRecord[];
  onRequestSelect: (req: ServiceRequest) => void;
  refreshTrigger: number;
  onRefreshNeeded: () => void;
}

export const TeamLeadPortal: React.FC<TeamLeadPortalProps> = ({
  engineers,
  onRequestSelect,
  refreshTrigger,
  onRefreshNeeded,
}) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'UNASSIGNED' | 'ASSIGNED' | 'ROSTER'>('UNASSIGNED');

  // Assignment Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetRequest, setTargetRequest] = useState<ServiceRequest | null>(null);
  const [selectedEngineerId, setSelectedEngineerId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqRes, sumRes] = await Promise.all([
        api.getAllTeamLeadRequests(),
        api.getTeamLeadSummary().catch(() => ({})),
      ]);
      setRequests(reqRes.requests || []);
      setSummary(sumRes);
    } catch (err: any) {
      toast(err.message || 'Failed to load support requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignModal = (req: ServiceRequest, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargetRequest(req);
    setSelectedEngineerId(req.assigned_to || engineers[0]?.user_id || '');
    setAssignModalOpen(true);
  };

  const handleExecuteAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRequest || !selectedEngineerId) return;

    try {
      setIsAssigning(true);
      if (targetRequest.assigned_to) {
        await api.reassignRequest(targetRequest.request_id, selectedEngineerId);
        toast(`Ticket ${targetRequest.request_id} reassigned to ${selectedEngineerId}`, 'success');
      } else {
        await api.assignRequest(targetRequest.request_id, selectedEngineerId);
        toast(`Ticket ${targetRequest.request_id} dispatched to ${selectedEngineerId}`, 'success');
      }
      setAssignModalOpen(false);
      loadData();
      onRefreshNeeded();
    } catch (err: any) {
      toast(err.message || 'Failed to assign ticket', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const query = searchQuery.toLowerCase().trim();
  const matchesQuery = (r: ServiceRequest) =>
    !query ||
    r.title.toLowerCase().includes(query) ||
    r.request_id.toLowerCase().includes(query) ||
    r.description.toLowerCase().includes(query) ||
    r.department.toLowerCase().includes(query);

  const unassignedRequests = requests.filter(
    (r) => (!r.assigned_to || r.status === 'NEW') && matchesQuery(r)
  );
  const assignedRequests = requests.filter(
    (r) =>
      Boolean(r.assigned_to) &&
      r.status !== 'NEW' &&
      r.status !== 'CLOSED' &&
      r.status !== 'CANCELLED' &&
      matchesQuery(r)
  );

  // Compute workload per engineer
  const engineerWorkloadMap: Record<string, number> = {};
  requests.forEach((r) => {
    if (r.assigned_to && r.status !== 'CLOSED' && r.status !== 'RESOLVED' && r.status !== 'CANCELLED') {
      engineerWorkloadMap[r.assigned_to] = (engineerWorkloadMap[r.assigned_to] || 0) + 1;
    }
  });

  return (
    <div className="space-y-6">
      {/* Team Lead Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Unassigned Triage"
          value={unassignedRequests.length}
          icon={<ShieldAlert className="w-4 h-4" />}
          colorScheme="rose"
          subtext="Urgent dispatch required"
        />
        <MetricCard
          label="Active Deployments"
          value={assignedRequests.length}
          icon={<Users className="w-4 h-4" />}
          colorScheme="indigo"
          subtext="Technicians on floor"
        />
        <MetricCard
          label="In Progress"
          value={summary['IN_PROGRESS'] || 0}
          icon={<Clock className="w-4 h-4" />}
          colorScheme="amber"
          subtext="Bench repairs underway"
        />
        <MetricCard
          label="Resolved Today"
          value={summary['RESOLVED'] || 0}
          icon={<CheckCircle2 className="w-4 h-4" />}
          colorScheme="emerald"
          subtext="Ready for signoff"
        />
      </div>

      {/* Tabs and Actions */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('UNASSIGNED')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'UNASSIGNED'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Triage Queue ({unassignedRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('ASSIGNED')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ASSIGNED'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Active Assignments ({assignedRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('ROSTER')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ROSTER'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Engineer Roster ({engineers.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search triage requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
            />
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      {activeTab === 'UNASSIGNED' && (
        <div className="space-y-3">
          {unassignedRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-700">Triage Queue Empty</p>
              <p className="text-xs text-slate-400 mt-1">
                All raised hospital tickets have been assigned to technicians.
              </p>
            </div>
          ) : (
            unassignedRequests.map((req) => (
              <div
                key={req.request_id}
                onClick={() => onRequestSelect(req)}
                className="bg-white rounded-xl border border-rose-200/70 p-4 shadow-xs hover:border-rose-300 hover:shadow-sm transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100">
                      {req.request_id}
                    </span>
                    <PriorityBadge priority={req.priority} />
                    <span className="text-[11px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      {req.department}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Raised {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                    {req.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-1">{req.description}</p>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={(e) => handleOpenAssignModal(req, e)}
                    className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    Dispatch Engineer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'ASSIGNED' && (
        <div className="space-y-3">
          {assignedRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
              <p className="text-sm font-semibold text-slate-700">No active assignments</p>
            </div>
          ) : (
            assignedRequests.map((req) => (
              <div
                key={req.request_id}
                onClick={() => onRequestSelect(req)}
                className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {req.request_id}
                    </span>
                    <StatusBadge status={req.status} />
                    <PriorityBadge priority={req.priority} />
                    <span className="text-[11px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {req.department}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                    {req.title}
                  </h4>
                </div>

                <div className="flex items-center gap-3 justify-between md:justify-end">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Assigned Tech</span>
                    <span className="font-mono text-xs font-semibold text-sky-700">{req.assigned_to}</span>
                  </div>
                  <button
                    onClick={(e) => handleOpenAssignModal(req, e)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Reassign
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'ROSTER' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {engineers.map((eng) => {
            const activeLoad = engineerWorkloadMap[eng.user_id] || 0;
            return (
              <div
                key={eng.user_id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 font-bold flex items-center justify-center border border-sky-100">
                    {eng.name[0]}
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      activeLoad > 3
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : activeLoad > 0
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {activeLoad} Active Tickets
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{eng.name}</h4>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{eng.user_id}</div>
                  <div className="text-xs text-slate-400 mt-1">{eng.department}</div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Role: Support Engineer</span>
                  <span className="text-emerald-600 font-medium">Available</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dispatch / Reassign Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={targetRequest?.assigned_to ? 'Reassign Support Request' : 'Dispatch Technician'}
        subtitle={`Request ${targetRequest?.request_id} • ${targetRequest?.title}`}
      >
        <form onSubmit={handleExecuteAssign} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Select Field Support Engineer
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {engineers.map((eng) => {
                const load = engineerWorkloadMap[eng.user_id] || 0;
                const isSelected = selectedEngineerId === eng.user_id;

                return (
                  <label
                    key={eng.user_id}
                    onClick={() => setSelectedEngineerId(eng.user_id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-100'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="engineer"
                        checked={isSelected}
                        onChange={() => setSelectedEngineerId(eng.user_id)}
                        className="text-sky-600 focus:ring-sky-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{eng.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {eng.user_id} • {eng.department}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-600">
                      {load} in progress
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAssigning || !selectedEngineerId}
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {isAssigning ? 'Dispatching...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
