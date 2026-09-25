import type React from 'react';
import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Building2,
  Edit3,
  Trash2,
  Clock,
  ArrowUpDown,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import type { ServiceRequest, DepartmentRecord, CategoryRecord, UserRecord } from '../types';
import { api } from '../services/api';
import { StatusBadge, PriorityBadge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';

interface StaffPortalProps {
  currentUser: UserRecord;
  departments: DepartmentRecord[];
  categories: CategoryRecord[];
  onRequestSelect: (req: ServiceRequest) => void;
  refreshTrigger: number;
}

export const StaffPortal: React.FC<StaffPortalProps> = ({
  currentUser,
  departments,
  categories,
  onRequestSelect,
  refreshTrigger,
}) => {
  const { toast } = useToast();
  const [selectedDept, setSelectedDept] = useState<string>(currentUser.department || 'Nursing');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [deptSummary, setDeptSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'PRIORITY'>('NEWEST');

  // New Request Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState(categories[0]?.name || 'EQUIPMENT_ISSUE');
  const [newPriority, setNewPriority] = useState('HIGH');
  const [customId, setCustomId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Request Modal State (for NEW tickets)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editReq, setEditReq] = useState<ServiceRequest | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCat, setEditCat] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    if (selectedDept) {
      loadDepartmentData(selectedDept);
    }
  }, [selectedDept, refreshTrigger]);

  const loadDepartmentData = async (dept: string) => {
    try {
      setLoading(true);
      const [reqRes, sumRes] = await Promise.all([
        api.getDepartmentRequests(dept),
        api.getDepartmentSummary(dept).catch(() => null),
      ]);
      setRequests(reqRes.requests || []);
      setDeptSummary(sumRes);
    } catch (err: any) {
      toast(err.message || 'Failed to load department requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateId = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setCustomId(`REQ${randomSuffix}`);
  };

  const handleOpenCreateModal = () => {
    handleGenerateId();
    setNewCategory(categories[0]?.name || 'EQUIPMENT_ISSUE');
    setIsModalOpen(true);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !customId.trim()) {
      toast('Please fill out all required fields', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createRequest({
        request_id: customId.trim(),
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory,
        department: selectedDept,
        priority: newPriority,
      });

      toast(`Request ${customId} submitted successfully`, 'success');
      setIsModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      loadDepartmentData(selectedDept);
    } catch (err: any) {
      toast(err.message || 'Failed to create request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (req: ServiceRequest, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditReq(req);
    setEditTitle(req.title);
    setEditDesc(req.description);
    setEditCat(req.category);
    setEditPriority(req.priority);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReq) return;

    try {
      setIsSavingEdit(true);
      await api.updateRequest(editReq.request_id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        category: editCat,
        priority: editPriority,
      });

      toast(`Request ${editReq.request_id} updated successfully`, 'success');
      setEditModalOpen(false);
      setEditReq(null);
      loadDepartmentData(selectedDept);
    } catch (err: any) {
      toast(err.message || 'Failed to update request', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteRequest = async (req: ServiceRequest, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Withdraw and delete ticket ${req.request_id}?`)) return;

    try {
      await api.deleteRequest(req.request_id);
      toast(`Request ${req.request_id} withdrawn`, 'success');
      loadDepartmentData(selectedDept);
    } catch (err: any) {
      toast(err.message || 'Failed to delete request', 'error');
    }
  };

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
        req.description.toLowerCase().includes(searchQuery.toLowerCase());
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
      {/* Department Selector & Quick Stats */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold border border-sky-100 shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider bg-sky-100/70 px-2 py-0.5 rounded-full border border-sky-200/50">
                Department Ward
              </span>
              <div className="flex items-center gap-2 mt-1">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="font-extrabold text-slate-900 bg-transparent text-lg sm:text-xl focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-lg px-1.5 -ml-1.5 border-b-2 border-dashed border-sky-300 hover:border-sky-500 transition-colors"
                >
                  {departments.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name} Unit
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => loadDepartmentData(selectedDept)}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Refresh requests"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Raise Support Request
            </button>
          </div>
        </div>

        {/* Telemetry Chips (Interactive Status Filter) */}
        {deptSummary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
            <div
              onClick={() => setStatusFilter('ALL')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-200'
                  : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100/70'
              }`}
            >
              <span className="text-[11px] text-slate-500 font-semibold">Total Requests</span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {deptSummary.total_requests}
              </div>
            </div>
            <div
              onClick={() => setStatusFilter(statusFilter === 'NEW' ? 'ALL' : 'NEW')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                statusFilter === 'NEW'
                  ? 'bg-sky-100/80 border-sky-300 ring-2 ring-sky-200'
                  : 'bg-sky-50/50 border-sky-100/70 hover:bg-sky-50'
              }`}
            >
              <span className="text-[11px] text-sky-700 font-semibold">New / Unassigned</span>
              <div className="text-2xl font-black text-sky-800 mt-0.5">
                {deptSummary.requests?.NEW || 0}
              </div>
            </div>
            <div
              onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                statusFilter === 'IN_PROGRESS'
                  ? 'bg-amber-100/80 border-amber-300 ring-2 ring-amber-200'
                  : 'bg-amber-50/50 border-amber-100/70 hover:bg-amber-50'
              }`}
            >
              <span className="text-[11px] text-amber-700 font-semibold">In Progress</span>
              <div className="text-2xl font-black text-amber-800 mt-0.5">
                {deptSummary.requests?.IN_PROGRESS || 0}
              </div>
            </div>
            <div
              onClick={() => setStatusFilter(statusFilter === 'RESOLVED' ? 'ALL' : 'RESOLVED')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                statusFilter === 'RESOLVED'
                  ? 'bg-emerald-100/80 border-emerald-300 ring-2 ring-emerald-200'
                  : 'bg-emerald-50/50 border-emerald-100/70 hover:bg-emerald-50'
              }`}
            >
              <span className="text-[11px] text-emerald-700 font-semibold">Resolved</span>
              <div className="text-2xl font-black text-emerald-800 mt-0.5">
                {deptSummary.requests?.RESOLVED || 0}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by request ID, title, or clinical symptom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50 focus:bg-white transition-all"
            />
          </div>

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

        {/* Status Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          {['ALL', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              {st === 'ALL' ? `All (${requests.length})` : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Feed / List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-500" />
            <p className="text-xs">Loading department requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-sky-400" />
            <p className="text-sm font-bold text-slate-700">No requests found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are currently no support requests matching your criteria in {selectedDept}.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isCritical = req.priority === 'CRITICAL';
            const isNew = req.status === 'NEW';
            return (
              <div
                key={req.request_id}
                onClick={() => onRequestSelect(req)}
                className={`bg-white rounded-2xl border p-5 shadow-xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 group ${
                  isCritical ? 'border-rose-300/80 bg-rose-50/10' : 'border-slate-200/80'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                      {req.request_id}
                    </span>
                    <StatusBadge status={req.status} />
                    <PriorityBadge priority={req.priority} />
                    <span className="text-[11px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                      {req.category.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium ml-auto lg:ml-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(req.created_at)}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                    {req.title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{req.description}</p>
                </div>

                <div
                  className="flex items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-end flex-wrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Assigned Tech Info */}
                  <div className="text-right mr-2 hidden sm:block">
                    <span className="text-[10px] text-slate-400 block font-medium">Assigned Engineer</span>
                    <span className="text-xs font-bold text-slate-700">
                      {req.assigned_to ? (
                        <span className="text-sky-700 font-mono">{req.assigned_to}</span>
                      ) : (
                        <span className="text-amber-600 font-medium italic">Pending Triage</span>
                      )}
                    </span>
                  </div>

                  {/* Edit Button for NEW requests */}
                  {isNew && (
                    <button
                      onClick={(e) => handleOpenEditModal(req, e)}
                      className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Ticket
                    </button>
                  )}

                  {/* Withdraw / Delete Button for NEW requests */}
                  {isNew && (
                    <button
                      onClick={(e) => handleDeleteRequest(req, e)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Withdraw
                    </button>
                  )}

                  {/* View Details */}
                  <button
                    onClick={() => onRequestSelect(req)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-1 transition-colors"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Support Request Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Raise Clinical Support Request"
        subtitle={`Filing ticket for ${selectedDept} Department`}
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Request ID <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={handleGenerateId}
                  className="px-2.5 py-1 text-[11px] font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                >
                  Gen
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Priority Level <span className="text-rose-500">*</span>
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="CRITICAL">🔴 Critical (Life-Safety / ICU down)</option>
                <option value="HIGH">🟠 High (Major Diagnostic / Urgent)</option>
                <option value="MEDIUM">🟡 Medium (Standard Maintenance)</option>
                <option value="LOW">🟢 Low (Cosmetic / Facility)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Issue Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name.replace('_', ' ')} — {c.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Issue Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Syringe pump infusion rate error, Bay 3"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Clinical Symptom &amp; Equipment Details <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Detail error codes, equipment serial numbers, patient impact, or exact room/bed location..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Support Request'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Support Request Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Clinical Support Request"
        subtitle={`Editing unassigned ticket ${editReq?.request_id}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Priority Level <span className="text-rose-500">*</span>
              </label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="CRITICAL">🔴 Critical (Life-Safety / ICU down)</option>
                <option value="HIGH">🟠 High (Major Diagnostic / Urgent)</option>
                <option value="MEDIUM">🟡 Medium (Standard Maintenance)</option>
                <option value="LOW">🟢 Low (Cosmetic / Facility)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Issue Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={editCat}
                onChange={(e) => setEditCat(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Issue Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Clinical Symptom &amp; Equipment Details <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingEdit}
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {isSavingEdit ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
