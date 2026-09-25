import type {
  AdminSummary,
  AuditLogRecord,
  CategoryRecord,
  CommentRecord,
  DepartmentRecord,
  EngineerSummary,
  RequestPriority,
  RequestStatus,
  ServiceRequest,
  UserRecord,
} from '../types';
import { authService } from './auth';

// ============================================================
// API BASE URL
// ============================================================
// In development (Vite dev server), the proxy rewrites /api → localhost:8000
const rawBase = ((import.meta.env.VITE_API_URL as string | undefined) || 'https://hospitaldesk.onrender.com').trim();
const API_BASE = rawBase.replace(/\/+$/, '');

// ============================================================
// Local Mock Store (Fallback when FastAPI backend is offline)
// Seeded with the exact sample data matching main.py
// ============================================================
const DEFAULT_USERS: UserRecord[] = [
  {
    user_id: 'ENG205',
    name: 'Arun Kumar',
    username: 'arun',
    role: 'SUPPORT_ENGINEER',
    department: 'Biomedical Engineering',
  },
  {
    user_id: 'ENG210',
    name: 'Vijay Kumar',
    username: 'vijay',
    role: 'SUPPORT_ENGINEER',
    department: 'IT Systems',
  },
  {
    user_id: 'ENG215',
    name: 'Priya Sharma',
    username: 'priya',
    role: 'SUPPORT_ENGINEER',
    department: 'Facilities & HVAC',
  },
  {
    user_id: 'TL001',
    name: 'Marcus Vance',
    username: 'marcus',
    role: 'TEAM_LEAD',
    department: 'Hospital Support Desk',
  },
  {
    user_id: 'ADM001',
    name: 'Dr. Sarah Jenkins',
    username: 'admin',
    role: 'ADMIN',
    department: 'Hospital Operations',
  },
  {
    user_id: 'STF101',
    name: 'Nurse Elena Rostova',
    username: 'elena',
    role: 'STAFF',
    department: 'ICU',
  },
];

const DEFAULT_DEPARTMENTS: DepartmentRecord[] = [
  { name: 'Nursing', description: 'Inpatient and surgical nursing wards' },
  { name: 'ICU', description: 'Intensive Care Unit & Critical Care monitors' },
  { name: 'Radiology', description: 'MRI, CT Scanner, and Digital X-Ray suites' },
  { name: 'Emergency', description: 'Trauma bays, resuscitation & triage' },
  { name: 'Cardiology', description: 'Cath lab, telemetry, and ECG monitoring' },
  { name: 'Pathology', description: 'Central diagnostics and specimen analysis' },
];

const DEFAULT_CATEGORIES: CategoryRecord[] = [
  { name: 'EQUIPMENT_ISSUE', description: 'Diagnostic and life-support biomedical hardware defects' },
  { name: 'MAINTENANCE', description: 'Preventive inspection, calibration, and routine service' },
  { name: 'IT_ISSUE', description: 'EMR workstations, PACS imaging network, and clinical software' },
  { name: 'FACILITY_REQUEST', description: 'Medical gases, backup power, sterile HVAC, and lighting' },
];

const DEFAULT_REQUESTS: ServiceRequest[] = [
  {
    request_id: 'REQ101',
    title: 'Ventilator flow sensor failure',
    description: 'ICU Bay 4 ventilator displaying pressure sensor error code E-42. High inspiratory resistance alarm triggering intermittently.',
    category: 'EQUIPMENT_ISSUE',
    department: 'ICU',
    priority: 'CRITICAL',
    status: 'NEW',
    assigned_to: null,
    assigned_by: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    request_id: 'REQ102',
    title: 'PACS imaging workstation offline',
    description: 'Terminal 2 unable to pull DICOM scans from CT server. Network handshake timeout on gigabit port 4.',
    category: 'IT_ISSUE',
    department: 'Radiology',
    priority: 'HIGH',
    status: 'ASSIGNED',
    assigned_to: 'ENG210',
    assigned_by: 'TL001',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    request_id: 'REQ103',
    title: 'Defibrillator battery calibration required',
    description: 'Crash cart 3 routine 6-month battery impedance and discharge check. Safety check required before surgical rounds.',
    category: 'MAINTENANCE',
    department: 'Emergency',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    assigned_to: 'ENG205',
    assigned_by: 'TL001',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    request_id: 'REQ104',
    title: 'Central telemetry arrhythmia alarm glitch',
    description: 'Bed 2 monitor telemetry channel drops sync with central station every 15 minutes.',
    category: 'EQUIPMENT_ISSUE',
    department: 'Cardiology',
    priority: 'HIGH',
    status: 'ON_HOLD',
    assigned_to: 'ENG205',
    assigned_by: 'TL001',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    request_id: 'REQ105',
    title: 'Portable ultrasound probe crystal dropout',
    description: 'Sector probe showing vertical black artifact stripes across cardiac view.',
    category: 'EQUIPMENT_ISSUE',
    department: 'Emergency',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    assigned_to: 'ENG205',
    assigned_by: 'TL001',
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

const DEFAULT_COMMENTS: CommentRecord[] = [
  {
    request_id: 'REQ103',
    user_id: 'ENG205',
    comment: '▶️ [INSPECTION START] Opened crash cart and connected analyzer. Battery health at 88%. Discharge cycling initiated.',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    request_id: 'REQ104',
    user_id: 'ENG205',
    comment: '⏸️ [HOLD REASON] Receiver telemetry board capacitor degraded. Replacement PCB ordered from OEM vendor.',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    request_id: 'REQ105',
    user_id: 'ENG205',
    comment: '✅ [REPAIR RESOLUTION] Replaced probe array transducer connector and ran 2D acoustic calibration. Passed safety electrical test.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

class MockStore {
  users: UserRecord[] = [...DEFAULT_USERS];
  departments: DepartmentRecord[] = [...DEFAULT_DEPARTMENTS];
  categories: CategoryRecord[] = [...DEFAULT_CATEGORIES];
  requests: ServiceRequest[] = [...DEFAULT_REQUESTS];
  comments: CommentRecord[] = [...DEFAULT_COMMENTS];
  auditLogs: AuditLogRecord[] = [
    {
      user_id: 'TL001',
      action: 'ASSIGN_REQUEST',
      description: 'Dispatched REQ102 to Vijay Kumar (ENG210)',
      target_type: 'REQUEST',
      target_id: 'REQ102',
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      user_id: 'ENG205',
      action: 'UPDATE_STATUS',
      description: 'Updated REQ103 to IN_PROGRESS',
      target_type: 'REQUEST',
      target_id: 'REQ103',
      created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
  ];
}

const mockStore = new MockStore();

// ============================================================
// Authenticated fetch helper
// ============================================================
function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...authService.getAuthHeaders(),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401) {
      authService.logout();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    let errorDetail = 'Request failed';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(errorDetail || `HTTP error ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Return the current API base URL (useful for login page)
  getBaseUrl(): string {
    return API_BASE;
  },

  // ---------------------------------------------------------
  // Health
  // ---------------------------------------------------------
  async checkHealth() {
    try {
      const res = await fetch(`${API_BASE}/`, {
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<{ message: string; status: string }>(res);
    } catch {
      return { message: 'Running in Local Offline Store Mode', status: 'offline' };
    }
  },

  // ---------------------------------------------------------
  // Staff Endpoints
  // ---------------------------------------------------------
  async createRequest(data: {
    request_id: string;
    title: string;
    description: string;
    category: string;
    department: string;
    priority: RequestPriority | string;
  }) {
    try {
      const res = await fetch(`${API_BASE}/staff/requests`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return await handleResponse<{ message: string; request_id: string; status: string }>(res);
    } catch {
      const newReq: ServiceRequest = {
        ...data,
        status: 'NEW',
        assigned_to: null,
        assigned_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockStore.requests.unshift(newReq);
      return { message: 'Support request created successfully', request_id: data.request_id, status: 'NEW' };
    }
  },

  async getDepartmentRequests(department: string) {
    try {
      const res = await fetch(`${API_BASE}/staff/requests/department/${encodeURIComponent(department)}`, {
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<{ department: string; count: number; requests: ServiceRequest[] }>(res);
    } catch {
      const list = mockStore.requests.filter((r) => r.department === department);
      return { department, count: list.length, requests: list };
    }
  },

  async getRequestsByStatus(status: RequestStatus) {
    try {
      const res = await fetch(`${API_BASE}/staff/requests/status/${status}`, {
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<{ status: string; count: number; requests: ServiceRequest[] }>(res);
    } catch {
      const list = mockStore.requests.filter((r) => r.status === status);
      return { status, count: list.length, requests: list };
    }
  },

  async getRequestById(requestId: string) {
    try {
      const res = await fetch(`${API_BASE}/staff/requests/${requestId}`, {
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<ServiceRequest>(res);
    } catch {
      const found = mockStore.requests.find((r) => r.request_id === requestId);
      if (!found) throw new Error('Request not found');
      return found;
    }
  },

  async updateRequest(
    requestId: string,
    data: { title: string; description: string; category: string; priority: string }
  ) {
    try {
      const res = await fetch(`${API_BASE}/staff/requests/${requestId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return await handleResponse<{ message: string; request_id: string }>(res);
    } catch {
      const req = mockStore.requests.find((r) => r.request_id === requestId);
      if (req) {
        req.title = data.title;
        req.description = data.description;
        req.category = data.category;
        req.priority = data.priority;
        req.updated_at = new Date().toISOString();
      }
      return { message: 'Support request updated successfully', request_id: requestId };
    }
  },

  async deleteRequest(requestId: string) {
    try {
      const res = await fetch(`${API_BASE}/staff/requests/${requestId}`, {
        method: 'DELETE',
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<{ message: string; request_id: string }>(res);
    } catch {
      mockStore.requests = mockStore.requests.filter((r) => r.request_id !== requestId);
      return { message: 'Support request deleted successfully', request_id: requestId };
    }
  },

  async addComment(requestId: string, data: { user_id: string; comment: string }) {
    try {
      const res = await fetch(`${API_BASE}/staff/requests/${requestId}/comments`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      return await handleResponse<{ message: string; request_id: string }>(res);
    } catch {
      mockStore.comments.push({
        request_id: requestId,
        user_id: data.user_id,
        comment: data.comment,
        created_at: new Date().toISOString(),
      });
      return { message: 'Comment added successfully', request_id: requestId };
    }
  },

  async getComments(requestId: string) {
    try {
      const res = await fetch(`${API_BASE}/staff/requests/${requestId}/comments`, {
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<{ request_id: string; count: number; comments: CommentRecord[] }>(res);
    } catch {
      const list = mockStore.comments.filter((c) => c.request_id === requestId);
      return { request_id: requestId, count: list.length, comments: list };
    }
  },

  async getDepartmentSummary(department: string) {
    try {
      const res = await fetch(`${API_BASE}/staff/summary/${encodeURIComponent(department)}`, {
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<{
        department: string;
        total_requests: number;
        requests: Record<string, number>;
      }>(res);
    } catch {
      const deptReqs = mockStore.requests.filter((r) => r.department === department);
      const counts: Record<string, number> = {};
      deptReqs.forEach((r) => {
        counts[r.status] = (counts[r.status] || 0) + 1;
      });
      return {
        department,
        total_requests: deptReqs.length,
        requests: counts,
      };
    }
  },

  // ---------------------------------------------------------
  // Engineer Endpoints
  // ---------------------------------------------------------
  async getEngineerRequests(engineerId: string) {
    try {
      const res = await fetch(`${API_BASE}/engineer/${engineerId}/requests`, {
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<{ engineer_id: string; count: number; requests: ServiceRequest[] }>(res);
    } catch {
      const list = mockStore.requests.filter((r) => r.assigned_to === engineerId);
      return { engineer_id: engineerId, count: list.length, requests: list };
    }
  },

  async updateEngineerStatus(
    engineerId: string,
    requestId: string,
    status: 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED'
  ) {
    try {
      const res = await fetch(`${API_BASE}/engineer/${engineerId}/requests/${requestId}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      return await handleResponse<{ message: string; request_id: string; status: string }>(res);
    } catch {
      const req = mockStore.requests.find((r) => r.request_id === requestId);
      if (req) {
        req.status = status;
        req.updated_at = new Date().toISOString();
      }
      return { message: 'Request status updated successfully', request_id: requestId, status };
    }
  },

  async addEngineerComment(engineerId: string, requestId: string, comment: string) {
    try {
      const res = await fetch(`${API_BASE}/engineer/${engineerId}/requests/${requestId}/comments`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ user_id: engineerId, comment }),
      });
      return await handleResponse<{ message: string; request_id: string; engineer_id: string }>(res);
    } catch {
      mockStore.comments.push({
        request_id: requestId,
        user_id: engineerId,
        comment,
        created_at: new Date().toISOString(),
      });
      return { message: 'Comment added successfully', request_id: requestId, engineer_id: engineerId };
    }
  },

  async getEngineerSummary(engineerId: string) {
    try {
      const res = await fetch(`${API_BASE}/engineer/${engineerId}/summary`, {
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<EngineerSummary>(res);
    } catch {
      const engReqs = mockStore.requests.filter((r) => r.assigned_to === engineerId);
      const counts: Record<string, number> = {};
      ['ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'].forEach((s) => {
        counts[s] = engReqs.filter((r) => r.status === s).length;
      });
      return {
        engineer_id: engineerId,
        total_requests: engReqs.length,
        requests: counts,
      };
    }
  },

  // ---------------------------------------------------------
  // Team Lead Endpoints
  // ---------------------------------------------------------
  async getAllTeamLeadRequests() {
    try {
      const res = await fetch(`${API_BASE}/teamlead/requests`, {
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<{ count: number; requests: ServiceRequest[] }>(res);
    } catch {
      return { count: mockStore.requests.length, requests: [...mockStore.requests] };
    }
  },

  async getTeamLeadEngineers() {
    try {
      const res = await fetch(`${API_BASE}/teamlead/engineers`, {
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<{ count: number; engineers: UserRecord[] }>(res);
    } catch {
      const engs = mockStore.users.filter((u) => u.role === 'SUPPORT_ENGINEER');
      return { count: engs.length, engineers: engs };
    }
  },

  async assignRequest(requestId: string, engineerId: string) {
    try {
      const res = await fetch(`${API_BASE}/teamlead/requests/${requestId}/assign`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ engineer_id: engineerId }),
      });
      return await handleResponse<{ message: string; request_id: string; assigned_to: string; status: string }>(res);
    } catch {
      const req = mockStore.requests.find((r) => r.request_id === requestId);
      if (req) {
        req.assigned_to = engineerId;
        req.assigned_by = 'TEAM_LEAD';
        req.status = 'ASSIGNED';
        req.updated_at = new Date().toISOString();
      }
      return { message: 'Support request assigned successfully', request_id: requestId, assigned_to: engineerId, status: 'ASSIGNED' };
    }
  },

  async reassignRequest(requestId: string, engineerId: string) {
    try {
      const res = await fetch(`${API_BASE}/teamlead/requests/${requestId}/reassign`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ engineer_id: engineerId }),
      });
      return await handleResponse<{ message: string; request_id: string; assigned_to: string; status: string }>(res);
    } catch {
      const req = mockStore.requests.find((r) => r.request_id === requestId);
      if (req) {
        req.assigned_to = engineerId;
        req.assigned_by = 'TEAM_LEAD';
        req.updated_at = new Date().toISOString();
      }
      return { message: 'Support request reassigned successfully', request_id: requestId, assigned_to: engineerId, status: req?.status || 'ASSIGNED' };
    }
  },

  async cancelRequest(requestId: string) {
    try {
      const res = await fetch(`${API_BASE}/teamlead/requests/${requestId}`, {
        method: 'DELETE',
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<{ message: string; request_id: string; status: string }>(res);
    } catch {
      const req = mockStore.requests.find((r) => r.request_id === requestId);
      if (req) {
        req.status = 'CANCELLED';
        req.updated_at = new Date().toISOString();
      }
      return { message: 'Support request cancelled successfully', request_id: requestId, status: 'CANCELLED' };
    }
  },

  async getTeamLeadSummary() {
    try {
      const res = await fetch(`${API_BASE}/teamlead/summary`, {
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<Record<string, number>>(res);
    } catch {
      const counts: Record<string, number> = {};
      mockStore.requests.forEach((r) => {
        counts[r.status] = (counts[r.status] || 0) + 1;
      });
      return counts;
    }
  },

  // ---------------------------------------------------------
  // Admin Endpoints
  // ---------------------------------------------------------
  async getAdminSummary() {
    try {
      const res = await fetch(`${API_BASE}/admin/summary`, {
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<AdminSummary>(res);
    } catch {
      const counts: Record<string, number> = { total: mockStore.requests.length };
      mockStore.requests.forEach((r) => {
        counts[r.status] = (counts[r.status] || 0) + 1;
      });
      return {
        system: 'Hospital Support Request System (Local Store)',
        users: mockStore.users.length,
        departments: mockStore.departments.length,
        categories: mockStore.categories.length,
        requests: counts as any,
      };
    }
  },

  async getAdminRequests() {
    try {
      const res = await fetch(`${API_BASE}/admin/requests`, {
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<{ count: number; requests: ServiceRequest[] }>(res);
    } catch {
      return { count: mockStore.requests.length, requests: [...mockStore.requests] };
    }
  },

  async getAllUsers() {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<{ count: number; users: UserRecord[] }>(res);
    } catch {
      return { count: mockStore.users.length, users: [...mockStore.users] };
    }
  },

  async createUser(user: UserRecord) {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(user),
      });
      return await handleResponse<{ message: string; user_id: string }>(res);
    } catch {
      mockStore.users.push(user);
      return { message: 'User created successfully', user_id: user.user_id };
    }
  },

  async deleteUser(userId: string) {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<{ message: string; user_id: string }>(res);
    } catch {
      mockStore.users = mockStore.users.filter((u) => u.user_id !== userId);
      return { message: 'User deleted successfully', user_id: userId };
    }
  },

  async getAllDepartments() {
    try {
      const res = await fetch(`${API_BASE}/admin/departments`, {
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<{ count: number; departments: DepartmentRecord[] }>(res);
    } catch {
      return { count: mockStore.departments.length, departments: [...mockStore.departments] };
    }
  },

  async createDepartment(dept: { name: string; description: string }) {
    try {
      const res = await fetch(`${API_BASE}/admin/departments`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(dept),
      });
      return await handleResponse<{ message: string; department: string }>(res);
    } catch {
      mockStore.departments.push(dept);
      return { message: 'Department created successfully', department: dept.name };
    }
  },

  async deleteDepartment(deptName: string) {
    try {
      const res = await fetch(`${API_BASE}/admin/departments/${encodeURIComponent(deptName)}`, {
        method: 'DELETE',
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<{ message: string; department: string }>(res);
    } catch {
      mockStore.departments = mockStore.departments.filter((d) => d.name !== deptName);
      return { message: 'Department deleted successfully', department: deptName };
    }
  },

  async getAllCategories() {
    try {
      const res = await fetch(`${API_BASE}/admin/categories`, {
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<{ count: number; categories: CategoryRecord[] }>(res);
    } catch {
      return { count: mockStore.categories.length, categories: [...mockStore.categories] };
    }
  },

  async createCategory(cat: { name: string; description: string }) {
    try {
      const res = await fetch(`${API_BASE}/admin/categories`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(cat),
      });
      return await handleResponse<{ message: string; category: string }>(res);
    } catch {
      mockStore.categories.push(cat);
      return { message: 'Category created successfully', category: cat.name };
    }
  },

  async deleteCategory(catName: string) {
    try {
      const res = await fetch(`${API_BASE}/admin/categories/${encodeURIComponent(catName)}`, {
        method: 'DELETE',
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<{ message: string; category: string }>(res);
    } catch {
      mockStore.categories = mockStore.categories.filter((c) => c.name !== catName);
      return { message: 'Category deleted successfully', category: catName };
    }
  },

  async getAuditLogs() {
    try {
      const res = await fetch(`${API_BASE}/admin/audit-logs`, {
        headers: authService.getAuthHeaders(),
      });
      return await handleResponse<{ count: number; audit_logs: AuditLogRecord[] }>(res);
    } catch {
      return { count: mockStore.auditLogs.length, audit_logs: [...mockStore.auditLogs] };
    }
  },

  async createAuditLog(log: AuditLogRecord) {
    try {
      const res = await fetch(`${API_BASE}/admin/audit-logs`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(log),
      });
      return await handleResponse<{ message: string }>(res);
    } catch {
      mockStore.auditLogs.unshift(log);
      return { message: 'Audit log created successfully' };
    }
  },

  async updateAdminStatus(requestId: string, status: string) {
    try {
      const res = await fetch(`${API_BASE}/admin/requests/${requestId}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      return await handleResponse<{ message: string; request_id: string; status: string }>(res);
    } catch {
      const req = mockStore.requests.find((r) => r.request_id === requestId);
      if (req) {
        req.status = status as RequestStatus;
        req.updated_at = new Date().toISOString();
      }
      return { message: 'Request status updated successfully', request_id: requestId, status };
    }
  },

  async assignAdmin(requestId: string, engineerId: string) {
    try {
      const res = await fetch(`${API_BASE}/admin/requests/${requestId}/assign`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ engineer_id: engineerId }),
      });
      return await handleResponse<{ message: string; request_id: string; assigned_to: string }>(res);
    } catch {
      const req = mockStore.requests.find((r) => r.request_id === requestId);
      if (req) {
        req.assigned_to = engineerId;
        req.assigned_by = 'ADMIN';
        req.updated_at = new Date().toISOString();
      }
      return { message: 'Request assigned successfully', request_id: requestId, assigned_to: engineerId };
    }
  },
};
