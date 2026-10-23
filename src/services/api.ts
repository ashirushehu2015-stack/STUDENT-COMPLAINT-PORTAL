import {
  User,
  StudentProfile,
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
  ComplaintMessage,
  ComplaintAttachment,
  ComplaintInternalNote,
  Notification,
  AuditLog,
  SystemSetting,
  ReportingAnalytics,
  DemoAccount,
  ComplaintStatusHistory
} from '../types';

const API_BASE = '/api/v1';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('buk_oscms_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('buk_oscms_token', token);
    } else {
      localStorage.removeItem('buk_oscms_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }
    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Clear expired token
      this.setToken(null);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      return data.data !== undefined ? data.data : data;
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Request failed');
    }

    return response as unknown as T;
  }

  // --- Auth ---
  public async getDemoAccounts(): Promise<DemoAccount[]> {
    return this.request<DemoAccount[]>('/auth/demo-accounts');
  }

  public async login(email: string, password: string): Promise<{ token: string; user: User; profile?: StudentProfile; permissions: string[] }> {
    const res = await this.request<{ token: string; user: User; profile?: StudentProfile; permissions: string[] }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(res.token);
    return res;
  }

  public async register(payload: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
    registration_number: string;
    level: string;
    academic_session?: string;
  }): Promise<{ token: string; user: User; profile?: StudentProfile }> {
    const res = await this.request<{ token: string; user: User; profile?: StudentProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    this.setToken(res.token);
    return res;
  }

  public async getCurrentUser(): Promise<{ user: User; profile?: StudentProfile; permissions: string[] }> {
    return this.request<{ user: User; profile?: StudentProfile; permissions: string[] }>('/auth/me');
  }

  public async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {}
    this.setToken(null);
  }

  // --- Categories ---
  public async getCategories(): Promise<ComplaintCategory[]> {
    return this.request<ComplaintCategory[]>('/complaints/categories');
  }

  // --- Student Complaints ---
  public async submitComplaint(payload: {
    category_id: string;
    title: string;
    description: string;
    course_code?: string;
    level: string;
    semester: 'First Semester' | 'Second Semester';
    academic_session: string;
    requested_outcome?: string;
  }): Promise<Complaint> {
    return this.request<Complaint>('/complaints', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async getMyComplaints(): Promise<Complaint[]> {
    return this.request<Complaint[]>('/complaints/my');
  }

  public async getComplaintDetail(id: string): Promise<{
    complaint: Complaint;
    category?: ComplaintCategory;
    student?: { id: string; full_name: string; email: string; phone: string; profile?: StudentProfile };
    handler?: { id: string; full_name: string; role: string; email: string };
    timeline: ComplaintStatusHistory[];
    messages: ComplaintMessage[];
    attachments: ComplaintAttachment[];
    internalNotes: ComplaintInternalNote[];
  }> {
    return this.request(`/complaints/${id}`);
  }

  public async sendMessage(
    complaintId: string,
    message: string,
    isOfficial = false,
    isInternal = false
  ): Promise<ComplaintMessage> {
    return this.request<ComplaintMessage>(`/complaints/${complaintId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        is_official_response: isOfficial,
        is_internal_note: isInternal
      })
    });
  }

  public async uploadAttachment(
    complaintId: string,
    file_name: string,
    file_size: number,
    mime_type: string,
    file_data_url?: string,
    access_level?: 'student_and_staff' | 'staff_only'
  ): Promise<ComplaintAttachment> {
    return this.request<ComplaintAttachment>(`/complaints/${complaintId}/attachments`, {
      method: 'POST',
      body: JSON.stringify({
        file_name,
        file_size,
        mime_type,
        file_data_url,
        access_level
      })
    });
  }

  public async reopenComplaint(complaintId: string, reason: string): Promise<Complaint> {
    return this.request<Complaint>(`/complaints/${complaintId}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  // --- Staff Operations ---
  public async getStaffQueue(filters: {
    status?: string;
    category_id?: string;
    priority?: string;
    assigned_to_id?: string;
    is_escalated?: boolean;
    search?: string;
  } = {}): Promise<Complaint[]> {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.category_id) params.set('category_id', filters.category_id);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.assigned_to_id) params.set('assigned_to_id', filters.assigned_to_id);
    if (filters.is_escalated !== undefined) params.set('is_escalated', String(filters.is_escalated));
    if (filters.search) params.set('search', filters.search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<Complaint[]>(`/staff/complaints${qs}`);
  }

  public async assignComplaint(complaintId: string, assigned_to_id: string, reason?: string): Promise<Complaint> {
    return this.request<Complaint>(`/staff/complaints/${complaintId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assigned_to_id, reason })
    });
  }

  public async updateComplaintStatus(
    complaintId: string,
    status: ComplaintStatus,
    comment?: string,
    is_visible_to_student = true
  ): Promise<Complaint> {
    return this.request<Complaint>(`/staff/complaints/${complaintId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, comment, is_visible_to_student })
    });
  }

  public async escalateComplaint(complaintId: string, reason: string, escalated_to_id?: string): Promise<Complaint> {
    return this.request<Complaint>(`/staff/complaints/${complaintId}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ reason, escalated_to_id })
    });
  }

  public async resolveComplaint(
    complaintId: string,
    resolution_summary: string,
    resolution_action_taken?: string,
    as_proposed_only = false
  ): Promise<Complaint> {
    return this.request<Complaint>(`/staff/complaints/${complaintId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({
        resolution_summary,
        resolution_action_taken,
        as_proposed_only
      })
    });
  }

  public async closeComplaint(complaintId: string, comment?: string): Promise<Complaint> {
    return this.request<Complaint>(`/staff/complaints/${complaintId}/close`, {
      method: 'POST',
      body: JSON.stringify({ comment })
    });
  }

  public async addInternalNote(complaintId: string, note: string, action_required?: string): Promise<ComplaintInternalNote> {
    return this.request<ComplaintInternalNote>(`/staff/complaints/${complaintId}/internal-notes`, {
      method: 'POST',
      body: JSON.stringify({ note, action_required })
    });
  }

  public async getStaffHandlers(): Promise<{ id: string; name: string; email: string; role: string; phone: string }[]> {
    return this.request('/staff/handlers');
  }

  // --- Reports & Analytics ---
  public async getAnalytics(): Promise<ReportingAnalytics> {
    return this.request<ReportingAnalytics>('/reports/analytics');
  }

  public getCsvExportUrl(): string {
    return `${API_BASE}/reports/export-csv`;
  }

  // --- Admin ---
  public async getAdminUsers(): Promise<(User & { is_active: boolean; profile?: StudentProfile })[]> {
    return this.request('/admin/users');
  }

  public async createAdminUser(payload: any): Promise<any> {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async updateAdminUser(id: string, updates: any): Promise<any> {
    return this.request(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  public async getAllCategoriesAdmin(): Promise<ComplaintCategory[]> {
    return this.request<ComplaintCategory[]>('/admin/categories');
  }

  public async createCategoryAdmin(payload: any): Promise<ComplaintCategory> {
    return this.request<ComplaintCategory>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async updateCategoryAdmin(id: string, payload: any): Promise<ComplaintCategory> {
    return this.request<ComplaintCategory>(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  public async getSettingsAdmin(): Promise<SystemSetting[]> {
    return this.request<SystemSetting[]>('/admin/settings');
  }

  public async updateSettingAdmin(key: string, value: string): Promise<SystemSetting> {
    return this.request<SystemSetting>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ key, value })
    });
  }

  public async getAuditLogsAdmin(): Promise<AuditLog[]> {
    return this.request<AuditLog[]>('/admin/audit-logs');
  }

  public async resetDemoData(): Promise<void> {
    await this.request('/admin/reset-demo', { method: 'POST' });
  }

  // --- Notifications ---
  public async getNotifications(): Promise<Notification[]> {
    return this.request<Notification[]>('/notifications');
  }

  public async markNotificationRead(id: string): Promise<void> {
    await this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  public async markAllNotificationsRead(): Promise<void> {
    await this.request('/notifications/read-all', { method: 'POST' });
  }
}

export const api = new ApiService();
