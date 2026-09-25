export type Role = 'STAFF' | 'SUPPORT_ENGINEER' | 'TEAM_LEAD' | 'ADMIN';

export type RequestStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ServiceRequest {
  request_id: string;
  title: string;
  description: string;
  category: string;
  department: string;
  priority: string;
  status: RequestStatus;
  assigned_to?: string | null;
  assigned_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRecord {
  user_id: string;
  name: string;
  username: string;
  role: Role;
  department: string;
  created_at?: string;
  updated_at?: string;
}

export interface DepartmentRecord {
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryRecord {
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface CommentRecord {
  request_id?: string;
  user_id: string;
  comment: string;
  created_at?: string;
}

export interface AuditLogRecord {
  user_id: string;
  action: string;
  description: string;
  target_type: string;
  target_id: string;
  created_at?: string;
}

export interface EngineerSummary {
  engineer_id: string;
  total_requests: number;
  requests: {
    ASSIGNED?: number;
    IN_PROGRESS?: number;
    ON_HOLD?: number;
    RESOLVED?: number;
    CLOSED?: number;
  };
}

export interface AdminSummary {
  system: string;
  users: number;
  departments: number;
  categories: number;
  requests: {
    total: number;
    NEW?: number;
    ASSIGNED?: number;
    IN_PROGRESS?: number;
    ON_HOLD?: number;
    RESOLVED?: number;
    CLOSED?: number;
    CANCELLED?: number;
  };
}
