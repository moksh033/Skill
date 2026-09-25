import type React from 'react';
import { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Building2,
  Tag,
  User,
  Wrench,
  Send,
  Trash2,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import type { ServiceRequest, CommentRecord, UserRecord, Role } from '../types';
import { StatusBadge, PriorityBadge } from './ui/Badge';
import { api } from '../services/api';
import { useToast } from './ui/Toast';

interface RequestDrawerProps {
  request: ServiceRequest | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserRecord;
  currentRole: Role;
  engineers: UserRecord[];
  onRefreshNeeded: () => void;
}

export const RequestDrawer: React.FC<RequestDrawerProps> = ({
  request,
  isOpen,
  onClose,
  currentUser,
  currentRole,
  engineers,
  onRefreshNeeded,
}) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [assignEngineerId, setAssignEngineerId] = useState('');

  useEffect(() => {
    if (request && isOpen) {
      loadComments(request.request_id);
      setAssignEngineerId(request.assigned_to || '');
    }
  }, [request, isOpen]);

  const loadComments = async (requestId: string) => {
    try {
      const res = await api.getComments(requestId);
      setComments(res.comments || []);
    } catch {
      // ignore
    }
  };

  if (!isOpen || !request) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmittingComment(true);
      await api.addComment(request.request_id, {
        user_id: currentUser.user_id,
        comment: newComment.trim(),
      });
      setNewComment('');
      toast('Comment posted successfully', 'success');
      loadComments(request.request_id);
    } catch (err: any) {
      toast(err.message || 'Failed to post comment', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEngineerStatusChange = async (status: 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED') => {
    let note = '';
    if (status === 'ON_HOLD') {
      note = window.prompt('Reason for putting on hold (e.g. Spares needed, vendor dispatch):') || '';
    } else if (status === 'RESOLVED') {
      note = window.prompt('Technical repair & calibration notes for resolution:') || '';
    }

    try {
      setIsUpdatingStatus(true);
      await api.updateEngineerStatus(currentUser.user_id, request.request_id, status);
      if (note.trim()) {
        const prefix = status === 'RESOLVED' ? '✅ [REPAIR RESOLUTION]' : '⏸️ [HOLD REASON]';
        await api.addEngineerComment(currentUser.user_id, request.request_id, `${prefix} ${note.trim()}`);
      }
      toast(`Status updated to ${status.replace('_', ' ')}`, 'success');
      onRefreshNeeded();
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to update status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStaffSignoffClose = async () => {
    try {
      setIsUpdatingStatus(true);
      await api.updateAdminStatus(request.request_id, 'CLOSED');
      await api.addComment(request.request_id, {
        user_id: currentUser.user_id,
        comment: '✅ [CLINICAL SIGNOFF] Nurse / clinical staff confirmed equipment is fully functional in ward. Ticket closed.',
      });
      toast(`Ticket ${request.request_id} verified and closed`, 'success');
      onRefreshNeeded();
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to close ticket', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStaffReopen = async () => {
    const reason = window.prompt('Please detail what is still malfunctioning on this device:');
    if (!reason || !reason.trim()) return;

    try {
      setIsUpdatingStatus(true);
      await api.updateAdminStatus(request.request_id, 'IN_PROGRESS');
      await api.addComment(request.request_id, {
        user_id: currentUser.user_id,
        comment: `⚠️ [REOPENED BY CLINICAL STAFF] Device issue persists: ${reason.trim()}`,
      });
      toast(`Ticket returned to technician for re-inspection`, 'info');
      onRefreshNeeded();
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to reopen ticket', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignEngineer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEngineerId) return;

    try {
      setIsUpdatingStatus(true);
      if (request.assigned_to) {
        await api.reassignRequest(request.request_id, assignEngineerId);
        toast(`Reassigned to ${assignEngineerId}`, 'success');
      } else {
        await api.assignRequest(request.request_id, assignEngineerId);
        toast(`Assigned to ${assignEngineerId}`, 'success');
      }
      onRefreshNeeded();
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to assign engineer', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!window.confirm('Are you sure you want to delete this pending request?')) return;
    try {
      await api.deleteRequest(request.request_id);
      toast('Request deleted successfully', 'success');
      onRefreshNeeded();
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to delete request', 'error');
    }
  };

  const handleCancelTL = async () => {
    if (!window.confirm('Cancel this request ticket?')) return;
    try {
      await api.cancelRequest(request.request_id);
      toast('Request ticket cancelled', 'info');
      onRefreshNeeded();
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to cancel request', 'error');
    }
  };

  // Status lifecycle steps
  const lifecycleSteps = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  const currentIndex = lifecycleSteps.indexOf(request.status);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                  {request.request_id}
                </span>
                <StatusBadge status={request.status} />
                <PriorityBadge priority={request.priority} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">{request.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Status Flow Bar */}
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                Lifecycle Progression
              </span>
              <div className="flex items-center justify-between relative">
                <div className="absolute left-3 right-3 top-3 h-0.5 bg-slate-200 -z-0" />
                {lifecycleSteps.map((step, idx) => {
                  const isDone = currentIndex >= idx;
                  const isCurrent = currentIndex === idx;
                  return (
                    <div key={step} className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                          isCurrent
                            ? 'bg-sky-600 border-sky-600 text-white ring-4 ring-sky-100'
                            : isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-slate-300 text-slate-400'
                        }`}
                      >
                        {isDone && !isCurrent ? '✓' : idx + 1}
                      </div>
                      <span
                        className={`text-[10px] mt-1.5 font-medium tracking-tight whitespace-nowrap ${
                          isCurrent
                            ? 'text-sky-700 font-bold'
                            : isDone
                            ? 'text-slate-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Department</div>
                  <div className="text-sm font-semibold text-slate-800">{request.department}</div>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Category</div>
                  <div className="text-sm font-semibold text-slate-800">
                    {request.category.replace('_', ' ')}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Assigned Engineer</div>
                  <div className="text-sm font-semibold text-slate-800">
                    {request.assigned_to ? (
                      <span className="text-sky-700 font-mono">{request.assigned_to}</span>
                    ) : (
                      <span className="text-amber-600 italic">Unassigned</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Submitted</div>
                  <div className="text-xs font-semibold text-slate-700">
                    {new Date(request.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Description Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Clinical Problem Description
              </label>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {request.description}
              </div>
            </div>

            {/* Role-Specific Actions */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Workflow Actions ({currentRole})
              </span>

              {/* Engineer Actions */}
              {currentRole === 'SUPPORT_ENGINEER' && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-500">
                    Update the physical inspection/repair progress of this ticket:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleEngineerStatusChange('IN_PROGRESS')}
                      disabled={isUpdatingStatus || request.status === 'IN_PROGRESS'}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Mark In Progress
                    </button>
                    <button
                      onClick={() => handleEngineerStatusChange('ON_HOLD')}
                      disabled={isUpdatingStatus || request.status === 'ON_HOLD'}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <PauseCircle className="w-4 h-4" />
                      Place On Hold
                    </button>
                    <button
                      onClick={() => handleEngineerStatusChange('RESOLVED')}
                      disabled={isUpdatingStatus || request.status === 'RESOLVED'}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Resolved
                    </button>
                  </div>
                </div>
              )}

              {/* Team Lead Actions */}
              {currentRole === 'TEAM_LEAD' && (
                <div className="space-y-3">
                  <form onSubmit={handleAssignEngineer} className="flex items-center gap-2">
                    <select
                      value={assignEngineerId}
                      onChange={(e) => setAssignEngineerId(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">Select Support Engineer...</option>
                      {engineers.map((eng) => (
                        <option key={eng.user_id} value={eng.user_id}>
                          {eng.name} ({eng.user_id}) — {eng.department}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={!assignEngineerId || isUpdatingStatus}
                      className="px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <UserCheck className="w-4 h-4" />
                      {request.assigned_to ? 'Reassign' : 'Assign'}
                    </button>
                  </form>
                  {request.status !== 'CLOSED' && request.status !== 'CANCELLED' && (
                    <button
                      onClick={handleCancelTL}
                      className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      Cancel Ticket
                    </button>
                  )}
                </div>
              )}

              {/* Staff Actions */}
              {currentRole === 'STAFF' && (
                <div className="space-y-3">
                  {request.status === 'NEW' && (
                    <button
                      onClick={handleDeleteStaff}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Trash2 className="w-4 h-4" />
                      Withdraw / Delete Request
                    </button>
                  )}

                  {request.status === 'RESOLVED' && (
                    <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        Repairs Complete — Clinical Verification Needed
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        The assigned technician reported this issue resolved. Please inspect the device in your ward and confirm normal clinical operation to close the ticket.
                      </p>
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <button
                          onClick={handleStaffSignoffClose}
                          disabled={isUpdatingStatus}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verify &amp; Sign-off Ticket
                        </button>
                        <button
                          onClick={handleStaffReopen}
                          disabled={isUpdatingStatus}
                          className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          Device Still Faulty (Reopen)
                        </button>
                      </div>
                    </div>
                  )}

                  {request.status === 'CLOSED' && (
                    <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>This request has been resolved, verified, and officially closed.</span>
                    </div>
                  )}

                  {request.status !== 'NEW' && request.status !== 'RESOLVED' && request.status !== 'CLOSED' && (
                    <p className="text-xs text-slate-500">
                      Request has been assigned and is being actively handled by technical support.
                    </p>
                  )}
                </div>
              )}

              {/* Admin Actions */}
              {currentRole === 'ADMIN' && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500">Override Status:</span>
                  {['NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      onClick={async () => {
                        try {
                          await api.updateAdminStatus(request.request_id, st);
                          toast(`Admin updated status to ${st}`, 'success');
                          onRefreshNeeded();
                          onClose();
                        } catch (err: any) {
                          toast(err.message, 'error');
                        }
                      }}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded border ${
                        request.status === st
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Diagnostic & Communication Comments */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Diagnostic & Resolution Activity ({comments.length})
                </span>
                <span className="text-[11px] text-slate-400">Chronological Record</span>
              </div>

              <div className="space-y-2.5">
                {comments.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                    No notes or comments recorded yet.
                  </div>
                ) : (
                  comments.map((c, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {c.user_id}
                        </span>
                        {c.created_at && (
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{c.comment}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={`Post diagnostic note as ${currentUser.name}...`}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  Post
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
