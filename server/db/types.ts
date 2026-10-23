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
  password_hash: string;
  role: UserRole;
  full_name: string;
  phone: string;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  registration_number: string; // e.g. UG20/ENG/MEC/1042
  level: '100L' | '200L' | '300L' | '400L' | '500L';
  academic_session: string; // e.g. 2025/2026
  department: string; // Department of Mechanical Engineering
  faculty: string; // Faculty of Engineering
  entry_year: string;
}

export interface Role {
  id: string;
  name: UserRole;
  display_name: string;
  description: string;
  is_system: boolean;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string;
}

export interface RolePermission {
  role_name: UserRole;
  permission_code: string;
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
  reference_no: string; // e.g. MECH-2026-000001
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
}

export interface ComplaintAssignment {
  id: string;
  complaint_id: string;
  assigned_by_id: string;
  assigned_to_id: string;
  previous_handler_id?: string;
  reassignment_reason?: string;
  assigned_at: string;
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

export interface DatabaseSchema {
  users: User[];
  student_profiles: StudentProfile[];
  roles: Role[];
  permissions: Permission[];
  role_permissions: RolePermission[];
  complaint_categories: ComplaintCategory[];
  complaints: Complaint[];
  complaint_assignments: ComplaintAssignment[];
  complaint_status_history: ComplaintStatusHistory[];
  complaint_messages: ComplaintMessage[];
  complaint_attachments: ComplaintAttachment[];
  complaint_internal_notes: ComplaintInternalNote[];
  notifications: Notification[];
  audit_logs: AuditLog[];
  system_settings: SystemSetting[];
}
