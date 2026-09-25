import type React from 'react';
import { useState, useEffect } from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  Building2,
  Tag,
  ArrowUpDown,
  Filter,
  FileText,
  Send,
} from 'lucide-react';
import type { ServiceRequest, EngineerSummary, UserRecord } from '../types';
import { api } from '../services/api';
import { StatusBadge, PriorityBadge } from './ui/Badge';
import { MetricCard } from './ui/MetricCard';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';

interface EngineerPortalProps {
  engineers: UserRecord[];
  activeEngineer: UserRecord;
  onEngineerChange: (eng: UserRecord) => void;
  onRequestSelect: (req: ServiceRequest) => void;
  refreshTrigger: number;
}

export const EngineerPortal: React.FC<EngineerPortalProps> = ({
  engineers,
  activeEngineer,
  onEngineerChange,
  onRequestSelect,
  refreshTrigger,
}) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [summary, setSummary] = useState<EngineerSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'PRIORITY'>('NEWEST');
  const [searchQuery, setSearchQuery] = useState('');

  // Status Change Dialog State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetReq, setTargetReq] = useState<ServiceRequest | null>(null);
  const [pendingStatus, setPendingStatus] = useState<'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED'>('IN_PROGRESS');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Quick Comment Modal State
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentReq, setCommentReq] = useState<ServiceRequest | null>(null);
  const [quickCommentText, setQuickCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (activeEngineer) {
      loadEngineerData(activeEngineer.user_id);
    }
  }, [activeEngineer, refreshTrigger]);

  const loadEngineerData = async (engineerId: string) => {
    try {
      setLoading(true);
      const [reqRes, sumRes] = await Promise.all([
        api.getEngineerRequests(engineerId),
        api.getEngineerSummary(engineerId).catch(() => null),
      ]);
      setRequests(reqRes.requests || []);
      setSummary(sumRes);
    } catch (err: any) {
      toast(err.message || 'Failed to load assigned requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStatusModal = (
    req: ServiceRequest,
    newStatus: 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setTargetReq(req);
    setPendingStatus(newStatus);
    setStatusNotes('');
    setStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetReq) return;

    try {
      setIsUpdatingStatus(true);
      // 1. Update status
      await api.updateEngineerStatus(activeEngineer.user_id, targetReq.request_id, pendingStatus);

      // 2. If notes were entered, also log them as a formal diagnostic comment
      if (statusNotes.trim()) {
        const prefix =
          pendingStatus === 'RESOLVED'
            ? '✅ [REPAIR RESOLUTION]'
            : pendingStatus === 'ON_HOLD'
            ? '⏸️ [HOLD REASON]'
            : '▶️ [INSPECTION START]';
        await api.addEngineerComment(
          activeEngineer.user_id,
          targetReq.request_id,
          `${prefix} ${statusNotes.trim()}`
        );
      }

      toast(`Ticket ${targetReq.request_id} marked as ${pendingStatus.replace('_', ' ')}`, 'success');
      setStatusModalOpen(false);
      setTargetReq(null);
      loadEngineerData(activeEngineer.user_id);
    } catch (err: any) {
      toast(err.message || 'Failed to update ticket status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenCommentModal = (req: ServiceRequest, e: React.MouseEvent) => {
    e.stopPropagation();
    setCommentReq(req);
    setQuickCommentText('');
    setCommentModalOpen(true);
  };

  const handleSubmitQuickComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentReq || !quickCommentText.trim()) return;

    try {
      setIsSubmittingComment(true);
      await api.addEngineerComment(activeEngineer.user_id, commentReq.request_id, quickCommentText.trim());
      toast('Diagnostic note saved', 'success');
      setCommentModalOpen(false);
      setCommentReq(null);
    } catch (err: any) {
      toast(err.message || 'Failed to post note', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Preset chips for rapid diagnosis logging
  const holdPresets = [
    'Spares / OEM replacement part pending',
    'Vendor field specialist scheduled',
    'Awaiting bio-decontamination / clean cycle',
    'Patient in room, restricted access',
  ];

  const resolvePresets = [
    'Replaced faulty component & passed electrical safety test',
    'Recalibrated sensors to factory tolerance; verified with nurse',
    'Software firmware patch reloaded; self-test nominal',
    'Cable / transducer connection secured; 100% operational',
  ];

  // Filtering and Sorting
  const priorityWeights: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const filteredRequests = requests
    .filter((req) => {
      const matchesSearch =
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.request_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.category && req.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || req.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      if (sortBy === 'PRIORITY') {
        const pA = priorityWeights[a.priority] || 0;
        const pB = priorityWeights[b.priority] || 0;
        return pB - pA;
      }
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortBy === 'NEWEST' ? timeB - timeA : timeA - timeB;
    });

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Engineer Identity & Quick Switcher Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold border border-amber-200/60 shadow-xs">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-200/50">
                Technician Station
              </span>
              <span className="text-xs text-slate-400">• {activeEngineer.department}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <select
                value={activeEngineer.user_id}
                onChange={(e) => {
                  const found = engineers.find((eng) => eng.user_id === e.target.value);
                  if (found) onEngineerChange(found);
                }}
                className="font-extrabold text-slate-900 bg-transparent text-lg sm:text-xl focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg px-1.5 -ml-1.5 border-b-2 border-dashed border-amber-300 hover:border-amber-500 transition-colors"
              >
                {engineers.map((eng) => (
                  <option key={eng.user_id} value={eng.user_id}>
                    {eng.name} ({eng.user_id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => loadEngineerData(activeEngineer.user_id)}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all flex items-center gap-2 text-xs font-bold shadow-xs active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${loading ? 'animate-spin' : ''}`} />
            Sync Workload
          </button>
        </div>
      </div>

      {/* Workload Telemetry Cards (Interactive Filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Assigned Queue"
          value={summary?.requests?.ASSIGNED || 0}
          icon={<Clock className="w-4 h-4" />}
          colorScheme="indigo"
          subtext="Click to filter awaiting response"
          onClick={() => setStatusFilter(statusFilter === 'ASSIGNED' ? 'ALL' : 'ASSIGNED')}
        />
        <MetricCard
          label="Active Repair"
          value={summary?.requests?.IN_PROGRESS || 0}
          icon={<PlayCircle className="w-4 h-4" />}
          colorScheme="amber"
          subtext="Under active diagnostic work"
          onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
        />
        <MetricCard
          label="Spares / On Hold"
          value={summary?.requests?.ON_HOLD || 0}
          icon={<PauseCircle className="w-4 h-4" />}
          colorScheme="slate"
          subtext="Awaiting parts or vendor"
          onClick={() => setStatusFilter(statusFilter === 'ON_HOLD' ? 'ALL' : 'ON_HOLD')}
        />
        <MetricCard
          label="Resolved Today"
          value={summary?.requests?.RESOLVED || 0}
          icon={<CheckCircle2 className="w-4 h-4" />}
          colorScheme="emerald"
          subtext="Ready for clinical signoff"
          onClick={() => setStatusFilter(statusFilter === 'RESOLVED' ? 'ALL' : 'RESOLVED')}
        />
      </div>

      {/* Filter, Search & Sort Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assigned tickets by issue title, equipment, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50 focus:bg-white transition-all"
            />
          </div>

          {/* Priority & Sorting Dropdowns */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">🔴 Critical Only</option>
                <option value="HIGH">🟠 High Priority</option>
                <option value="MEDIUM">🟡 Medium Priority</option>
                <option value="LOW">🟢 Low Priority</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="PRIORITY">Urgency (Critical First)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          {['ALL', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              {st === 'ALL' ? `All (${requests.length})` : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Assigned Requests Feed */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
            <p className="text-xs">Loading assigned requests for {activeEngineer.name}...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/80" />
            <p className="text-sm font-bold text-slate-700">No Tickets in this View</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are currently no tickets matching your filter criteria. Try adjusting the search query or priority filter.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isCritical = req.priority === 'CRITICAL';
            return (
              <div
                key={req.request_id}
                onClick={() => onRequestSelect(req)}
                className={`bg-white rounded-2xl border p-5 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 group ${
                  isCritical ? 'border-rose-300/80 bg-rose-50/10' : 'border-slate-200/80'
                }`}
              >
                {/* Request Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                      {req.request_id}
                    </span>
                    <StatusBadge status={req.status} />
                    <PriorityBadge priority={req.priority} />
                    <span className="text-[11px] text-slate-600 font-semibold flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      {req.department}
                    </span>
                    {req.category && (
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {req.category.replace('_', ' ')}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 font-medium ml-auto lg:ml-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(req.created_at)}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                    {req.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {req.description}
                  </p>
                </div>

                {/* Technician Quick Action Bar */}
                <div
                  className="flex items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-end flex-wrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Start Repair Button */}
                  {req.status !== 'IN_PROGRESS' && req.status !== 'RESOLVED' && req.status !== 'CLOSED' && (
                    <button
                      onClick={(e) => handleOpenStatusModal(req, 'IN_PROGRESS', e)}
                      className="px-3.5 py-2 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <PlayCircle className="w-3.5 h-3.5 text-amber-600" />
                      Start Work
                    </button>
                  )}

                  {/* Hold Button */}
                  {req.status === 'IN_PROGRESS' && (
                    <button
                      onClick={(e) => handleOpenStatusModal(req, 'ON_HOLD', e)}
                      className="px-3.5 py-2 text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <PauseCircle className="w-3.5 h-3.5 text-orange-600" />
                      Hold Spares...
                    </button>
                  )}

                  {/* Resume from Hold */}
                  {req.status === 'ON_HOLD' && (
                    <button
                      onClick={(e) => handleOpenStatusModal(req, 'IN_PROGRESS', e)}
                      className="px-3.5 py-2 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <PlayCircle className="w-3.5 h-3.5 text-amber-600" />
                      Resume Work
                    </button>
                  )}

                  {/* Resolve Button */}
                  {req.status !== 'RESOLVED' && req.status !== 'CLOSED' && (
                    <button
                      onClick={(e) => handleOpenStatusModal(req, 'RESOLVED', e)}
                      className="px-3.5 py-2 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Resolve...
                    </button>
                  )}

                  {/* Quick Tech Note */}
                  <button
                    onClick={(e) => handleOpenCommentModal(req, e)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
                    title="Log diagnostic note"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Add Note
                  </button>

                  {/* Full Details Drawer */}
                  <button
                    onClick={() => onRequestSelect(req)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    Details →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Status Transition Modal with Diagnostic Notes */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={
          pendingStatus === 'RESOLVED'
            ? 'Complete Repair & Mark Resolved'
            : pendingStatus === 'ON_HOLD'
            ? 'Place Ticket On Hold'
            : 'Initiate Technical Inspection'
        }
        subtitle={`Ticket ${targetReq?.request_id} • ${targetReq?.title}`}
      >
        <form onSubmit={handleConfirmStatusChange} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
            <span className="font-bold text-slate-800">Current Status:</span> {targetReq?.status} →{' '}
            <span className="font-bold text-amber-700">{pendingStatus}</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              {pendingStatus === 'RESOLVED'
                ? 'Technical Resolution & Calibration Notes'
                : pendingStatus === 'ON_HOLD'
                ? 'Reason for Delay / Parts Required'
                : 'Initial Inspection Observation (Optional)'}
            </label>
            <textarea
              rows={3}
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              placeholder={
                pendingStatus === 'RESOLVED'
                  ? 'Describe component replacements, calibration measurements, and clinical test outcomes...'
                  : pendingStatus === 'ON_HOLD'
                  ? 'Detail part numbers required, expected vendor dispatch date, or clinical constraints...'
                  : 'Note visual equipment conditions or error codes observed on arrival...'
              }
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
            />
          </div>

          {/* Quick preset chips */}
          {(pendingStatus === 'ON_HOLD' || pendingStatus === 'RESOLVED') && (
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Quick Template Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(pendingStatus === 'ON_HOLD' ? holdPresets : resolvePresets).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setStatusNotes((prev) => (prev ? `${prev}\n• ${preset}` : preset))}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-lg transition-colors text-left"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingStatus}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 ${
                pendingStatus === 'RESOLVED'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : pendingStatus === 'ON_HOLD'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isUpdatingStatus ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  {pendingStatus === 'RESOLVED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {pendingStatus === 'ON_HOLD' && <PauseCircle className="w-3.5 h-3.5" />}
                  {pendingStatus === 'IN_PROGRESS' && <PlayCircle className="w-3.5 h-3.5" />}
                  Confirm Status Change
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Diagnostic Note Modal */}
      <Modal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        title="Log Field Diagnostic Note"
        subtitle={`Ticket ${commentReq?.request_id} • ${commentReq?.title}`}
      >
        <form onSubmit={handleSubmitQuickComment} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              Diagnostic Observation or Technical Measurement
            </label>
            <textarea
              rows={4}
              required
              value={quickCommentText}
              onChange={(e) => setQuickCommentText(e.target.value)}
              placeholder="e.g. Measured 24V bus rail: 23.9V nominal. Inspected flow manifold seal for micro-leaks..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCommentModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingComment || !quickCommentText.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmittingComment ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Save Note to Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
