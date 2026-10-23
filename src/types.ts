export type UserRole = 'student' | 'officer' | 'hod' | 'admin' | 'reviewer';

export type ComplaintStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Initial Review'
  | 'Awaiting Student Information'
  | 'Assigned for Investigation'
  | 'Under Investigation'
  | 'Escalated'
  | 'Resolution Proposed'
  | 'Resolved'
  | 'Closed'
  | 'Reopened'
  | 'Rejected';

export type ComplaintPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone: string;
  avatar_url?: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  registration_number: string;
  level: '100L' | '200L' | '300L' | '400L' | '500L';
  academic_session: string;
  department: string;
  faculty: string;
  entry_year: string;
}

export interface ComplaintCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  default_priority: ComplaintPriority;
  sla_hours: number;
  is_active: boolean;
}

export interface Complaint {
  id: string;
  reference_no: string;
  student_id: string;
  category_id: string;
  title: string;
  description: string;
  course_code?: string;
  level: string;
  semester: 'First Semester' | 'Second Semester';
  academic_session: string;
  requested_outcome?: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assigned_to_id?: string;
  assigned_at?: string;
  sla_due_at?: string;
  is_escalated: boolean;
  escalated_to_id?: string;
  escalated_at?: string;
  escalation_reason?: string;
  resolution_summary?: string;
  resolution_action_taken?: string;
  resolved_by_id?: string;
  resolved_at?: string;
  closed_at?: string;
  closed_by_id?: string;
  rejection_reason?: string;
  reopened_at?: string;
  reopened_reason?: string;
  created_at: string;
  updated_at: string;
  // Enriched fields from API
  category?: ComplaintCategory;
  studentName?: string;
  studentRegNo?: string;
  studentLevel?: string;
  handlerName?: string;
  isOverdue?: boolean;
}

export interface ComplaintStatusHistory {
  id: string;
  complaint_id: string;
  previous_status: ComplaintStatus;
  new_status: ComplaintStatus;
  changed_by_id: string;
  comment?: string;
  is_visible_to_student: boolean;
  created_at: string;
}

export interface ComplaintMessage {
  id: string;
  complaint_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  message: string;
  is_official_response: boolean;
  is_internal_note: boolean;
  created_at: string;
}

export interface ComplaintAttachment {
  id: string;
  complaint_id: string;
  uploader_id: string;
  uploader_name: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_data_url?: string;
  access_level: 'student_and_staff' | 'staff_only';
  created_at: string;
}

export interface ComplaintInternalNote {
  id: string;
  complaint_id: string;
  author_id: string;
  author_name: string;
  note: string;
  action_required?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  complaint_id?: string;
  title: string;
  message: string;
  type: 'info' | 'status_change' | 'action_required' | 'resolved' | 'escalated';
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  category: 'general' | 'workflow' | 'notifications' | 'security';
  updated_at: string;
}

export interface ReportingAnalytics {
  totalComplaints: number;
  resolvedCount: number;
  escalatedCount: number;
  overdueCount: number;
  resolutionRate: number;
  byStatus: Record<string, number>;
  byCategory: { name: string; count: number }[];
  byHandler: { name: string; activeCount: number; resolvedCount: number }[];
}

export interface DemoAccount {
  role: UserRole;
  roleTitle: string;
  email: string;
  name: string;
  regNo: string;
  password: string;
}
