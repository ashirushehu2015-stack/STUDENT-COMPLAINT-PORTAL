import fs from 'fs';
import path from 'path';
import {
  DatabaseSchema,
  User,
  StudentProfile,
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintStatusHistory,
  ComplaintMessage,
  ComplaintInternalNote,
  ComplaintAttachment,
  Notification,
  AuditLog,
  SystemSetting,
  UserRole
} from './types';
import { getInitialSeedData } from './seed-data';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Valid status transitions map
export const PERMITTED_STATUS_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  Draft: ['Submitted'],
  Submitted: ['Under Initial Review', 'Rejected'],
  'Under Initial Review': ['Assigned for Investigation', 'Awaiting Student Information', 'Rejected', 'Escalated'],
  'Awaiting Student Information': ['Under Initial Review', 'Under Investigation'],
  'Assigned for Investigation': ['Under Investigation', 'Escalated'],
  'Under Investigation': ['Awaiting Student Information', 'Escalated', 'Resolution Proposed'],
  Escalated: ['Assigned for Investigation', 'Under Investigation', 'Resolution Proposed', 'Rejected'],
  'Resolution Proposed': ['Resolved', 'Under Investigation', 'Rejected'],
  Resolved: ['Closed', 'Reopened'],
  Closed: ['Reopened'],
  Reopened: ['Under Initial Review'],
  Rejected: []
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectoryExists();
    this.data = this.loadDatabase();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialSeedData();
      this.persist(initial);
      return initial;
    }

    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      // Ensure all arrays exist
      return {
        users: parsed.users || [],
        student_profiles: parsed.student_profiles || [],
        roles: parsed.roles || [],
        permissions: parsed.permissions || [],
        role_permissions: parsed.role_permissions || [],
        complaint_categories: parsed.complaint_categories || [],
        complaints: parsed.complaints || [],
        complaint_assignments: parsed.complaint_assignments || [],
        complaint_status_history: parsed.complaint_status_history || [],
        complaint_messages: parsed.complaint_messages || [],
        complaint_attachments: parsed.complaint_attachments || [],
        complaint_internal_notes: parsed.complaint_internal_notes || [],
        notifications: parsed.notifications || [],
        audit_logs: parsed.audit_logs || [],
        system_settings: parsed.system_settings || []
      };
    } catch (err) {
      console.error('Error loading database, resetting to seed data:', err);
      const initial = getInitialSeedData();
      this.persist(initial);
      return initial;
    }
  }

  private persist(dataToSave?: DatabaseSchema): void {
    const target = dataToSave || this.data;
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    try {
      fs.writeFileSync(tempFile, JSON.stringify(target, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file atomically:', err);
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch {}
      }
      throw err;
    }
  }

  // --- Reset to seed data ---
  public resetToSeed(): void {
    this.data = getInitialSeedData();
    this.persist();
  }

  // --- Users ---
  public findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public listUsers(roleFilter?: UserRole): User[] {
    if (roleFilter) {
      return this.data.users.filter((u) => u.role === roleFilter);
    }
    return this.data.users;
  }

  public createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
    const existing = this.findUserByEmail(user.email);
    if (existing) {
      throw new Error(`A user with email ${user.email} already exists.`);
    }

    const newUser: User = {
      ...user,
      id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('User not found');

    const updated: User = {
      ...this.data.users[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.data.users[index] = updated;
    this.persist();
    return updated;
  }

  // --- Student Profiles ---
  public getStudentProfileByUserId(userId: string): StudentProfile | undefined {
    return this.data.student_profiles.find((p) => p.user_id === userId);
  }

  public getStudentProfileByRegNo(regNo: string): StudentProfile | undefined {
    return this.data.student_profiles.find(
      (p) => p.registration_number.trim().toUpperCase() === regNo.trim().toUpperCase()
    );
  }

  public createStudentProfile(profile: Omit<StudentProfile, 'id'>): StudentProfile {
    const existing = this.getStudentProfileByRegNo(profile.registration_number);
    if (existing) {
      throw new Error(`Student registration number ${profile.registration_number} is already registered.`);
    }

    const newProfile: StudentProfile = {
      ...profile,
      id: `sp-${Date.now()}`
    };

    this.data.student_profiles.push(newProfile);
    this.persist();
    return newProfile;
  }

  public updateStudentProfile(userId: string, updates: Partial<StudentProfile>): StudentProfile {
    const index = this.data.student_profiles.findIndex((p) => p.user_id === userId);
    if (index === -1) throw new Error('Student profile not found');

    this.data.student_profiles[index] = {
      ...this.data.student_profiles[index],
      ...updates
    };
    this.persist();
    return this.data.student_profiles[index];
  }

  // --- Roles & Permissions ---
  public getPermissionsForRole(role: UserRole): string[] {
    return this.data.role_permissions
      .filter((rp) => rp.role_name === role)
      .map((rp) => rp.permission_code);
  }

  // --- Categories ---
  public listCategories(includeInactive = false): ComplaintCategory[] {
    if (includeInactive) return this.data.complaint_categories;
    return this.data.complaint_categories.filter((c) => c.is_active);
  }

  public getCategoryById(id: string): ComplaintCategory | undefined {
    return this.data.complaint_categories.find((c) => c.id === id);
  }

  public createCategory(cat: Omit<ComplaintCategory, 'id'>): ComplaintCategory {
    const newCat: ComplaintCategory = {
      ...cat,
      id: `cat-${Date.now()}`
    };
    this.data.complaint_categories.push(newCat);
    this.persist();
    return newCat;
  }

  public updateCategory(id: string, updates: Partial<ComplaintCategory>): ComplaintCategory {
    const index = this.data.complaint_categories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Category not found');
    this.data.complaint_categories[index] = { ...this.data.complaint_categories[index], ...updates };
    this.persist();
    return this.data.complaint_categories[index];
  }

  // --- Complaints ---
  public generateComplaintReference(): string {
    const currentYear = new Date().getFullYear();
    const prefix = `MECH-${currentYear}-`;

    const yearMatches = this.data.complaints
      .map((c) => c.reference_no)
      .filter((ref) => ref.startsWith(prefix));

    let maxSeq = 0;
    for (const ref of yearMatches) {
      const parts = ref.split('-');
      if (parts.length === 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }

    const nextSeq = (maxSeq + 1).toString().padStart(6, '0');
    return `${prefix}${nextSeq}`;
  }

  public calculateSlaDueDate(priority: ComplaintPriority): string {
    const now = new Date();
    let hoursToAdd = 72; // default 3 days
    if (priority === 'Urgent') hoursToAdd = 24;
    else if (priority === 'High') hoursToAdd = 48;
    else if (priority === 'Normal') hoursToAdd = 120; // 5 days
    else if (priority === 'Low') hoursToAdd = 240; // 10 days

    now.setHours(now.getHours() + hoursToAdd);
    return now.toISOString();
  }

  public createComplaint(data: {
    student_id: string;
    category_id: string;
    title: string;
    description: string;
    course_code?: string;
    level: string;
    semester: 'First Semester' | 'Second Semester';
    academic_session: string;
    requested_outcome?: string;
    priority?: ComplaintPriority;
  }): Complaint {
    const category = this.getCategoryById(data.category_id);
    if (!category) {
      throw new Error('Invalid complaint category specified.');
    }

    const priority = data.priority || category.default_priority || 'Normal';
    const reference_no = this.generateComplaintReference();
    const now = new Date().toISOString();
    const sla_due_at = this.calculateSlaDueDate(priority);

    const newComplaint: Complaint = {
      id: `cmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reference_no,
      student_id: data.student_id,
      category_id: data.category_id,
      title: data.title.trim(),
      description: data.description.trim(),
      course_code: data.course_code ? data.course_code.trim().toUpperCase() : undefined,
      level: data.level,
      semester: data.semester,
      academic_session: data.academic_session,
      requested_outcome: data.requested_outcome?.trim(),
      status: 'Submitted',
      priority,
      sla_due_at,
      is_escalated: false,
      created_at: now,
      updated_at: now
    };

    this.data.complaints.unshift(newComplaint);

    // Initial status history
    this.data.complaint_status_history.push({
      id: `sh-${Date.now()}`,
      complaint_id: newComplaint.id,
      previous_status: 'Draft',
      new_status: 'Submitted',
      changed_by_id: data.student_id,
      comment: 'Complaint officially submitted by student on OSCMS portal.',
      is_visible_to_student: true,
      created_at: now
    });

    // Notify student
    this.createNotification({
      user_id: data.student_id,
      complaint_id: newComplaint.id,
      title: 'Complaint Submitted Successfully',
      message: `Your complaint "${newComplaint.title}" has been registered with reference ID ${newComplaint.reference_no}.`,
      type: 'info'
    });

    // Notify departmental officers
    const officers = this.listUsers('officer');
    for (const officer of officers) {
      this.createNotification({
        user_id: officer.id,
        complaint_id: newComplaint.id,
        title: 'New Complaint Docket',
        message: `New complaint ${newComplaint.reference_no} submitted in ${category.name} (${newComplaint.priority} priority).`,
        type: 'info'
      });
    }

    this.persist();
    return newComplaint;
  }

  public getComplaintById(id: string): Complaint | undefined {
    return this.data.complaints.find((c) => c.id === id || c.reference_no === id);
  }

  public listComplaints(filters: {
    student_id?: string;
    status?: ComplaintStatus;
    category_id?: string;
    priority?: ComplaintPriority;
    assigned_to_id?: string;
    is_escalated?: boolean;
    search?: string;
    academic_session?: string;
  } = {}): Complaint[] {
    return this.data.complaints.filter((c) => {
      if (filters.student_id && c.student_id !== filters.student_id) return false;
      if (filters.status && c.status !== filters.status) return false;
      if (filters.category_id && c.category_id !== filters.category_id) return false;
      if (filters.priority && c.priority !== filters.priority) return false;
      if (filters.assigned_to_id && c.assigned_to_id !== filters.assigned_to_id) return false;
      if (filters.is_escalated !== undefined && c.is_escalated !== filters.is_escalated) return false;
      if (filters.academic_session && c.academic_session !== filters.academic_session) return false;

      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesRef = c.reference_no.toLowerCase().includes(q);
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesDesc = c.description.toLowerCase().includes(q);
        const matchesCourse = c.course_code?.toLowerCase().includes(q);
        if (!matchesRef && !matchesTitle && !matchesDesc && !matchesCourse) return false;
      }

      return true;
    });
  }

  public updateComplaintStatus(
    complaintId: string,
    newStatus: ComplaintStatus,
    changedById: string,
    comment?: string,
    isVisibleToStudent = true
  ): Complaint {
    const complaint = this.getComplaintById(complaintId);
    if (!complaint) throw new Error('Complaint not found');

    const currentStatus = complaint.status;
    const allowed = PERMITTED_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from "${currentStatus}" to "${newStatus}". Permitted next statuses: ${allowed.join(', ') || 'None'}`
      );
    }

    // Additional validations
    if ((newStatus === 'Resolved' || newStatus === 'Closed') && !complaint.resolution_summary) {
      throw new Error('A complaint cannot be resolved or closed without recorded resolution details.');
    }

    const now = new Date().toISOString();
    complaint.status = newStatus;
    complaint.updated_at = now;

    if (newStatus === 'Closed') {
      complaint.closed_at = now;
      complaint.closed_by_id = changedById;
    }

    this.data.complaint_status_history.push({
      id: `sh-${Date.now()}`,
      complaint_id: complaint.id,
      previous_status: currentStatus,
      new_status: newStatus,
      changed_by_id: changedById,
      comment: comment || `Status updated from ${currentStatus} to ${newStatus}.`,
      is_visible_to_student: isVisibleToStudent,
      created_at: now
    });

    if (isVisibleToStudent) {
      this.createNotification({
        user_id: complaint.student_id,
        complaint_id: complaint.id,
        title: `Complaint Status Updated: ${newStatus}`,
        message: `Your complaint ${complaint.reference_no} is now marked as "${newStatus}".`,
        type: newStatus === 'Resolved' ? 'resolved' : 'status_change'
      });
    }

    this.persist();
    return complaint;
  }

  public assignComplaint(
    complaintId: string,
    assignedToId: string,
    assignedById: string,
    reassignmentReason?: string
  ): Complaint {
    const complaint = this.getComplaintById(complaintId);
    if (!complaint) throw new Error('Complaint not found');

    const handler = this.findUserById(assignedToId);
    if (!handler || (handler.role !== 'officer' && handler.role !== 'hod')) {
      throw new Error('Complaint can only be assigned to a departmental complaint officer or HOD.');
    }

    const previousHandlerId = complaint.assigned_to_id;
    const now = new Date().toISOString();

    complaint.assigned_to_id = assignedToId;
    complaint.assigned_at = now;
    complaint.updated_at = now;

    // Transition status to Assigned for Investigation if still in initial states
    if (complaint.status === 'Submitted' || complaint.status === 'Under Initial Review') {
      complaint.status = 'Assigned for Investigation';
      this.data.complaint_status_history.push({
        id: `sh-${Date.now()}`,
        complaint_id: complaint.id,
        previous_status: 'Under Initial Review',
        new_status: 'Assigned for Investigation',
        changed_by_id: assignedById,
        comment: `Assigned to ${handler.full_name}${reassignmentReason ? ` (${reassignmentReason})` : ''}`,
        is_visible_to_student: true,
        created_at: now
      });
    }

    this.data.complaint_assignments.push({
      id: `asg-${Date.now()}`,
      complaint_id: complaint.id,
      assigned_by_id: assignedById,
      assigned_to_id: assignedToId,
      previous_handler_id: previousHandlerId,
      reassignment_reason: reassignmentReason,
      assigned_at: now
    });

    this.createNotification({
      user_id: assignedToId,
      complaint_id: complaint.id,
      title: 'Complaint Assigned',
      message: `You have been assigned as handler for complaint ${complaint.reference_no}.`,
      type: 'action_required'
    });

    this.persist();
    return complaint;
  }

  public escalateComplaint(
    complaintId: string,
    escalatedToId: string,
    reason: string,
    escalatedById: string
  ): Complaint {
    const complaint = this.getComplaintById(complaintId);
    if (!complaint) throw new Error('Complaint not found');

    const now = new Date().toISOString();
    const previousStatus = complaint.status;

    complaint.is_escalated = true;
    complaint.escalated_to_id = escalatedToId;
    complaint.escalated_at = now;
    complaint.escalation_reason = reason;
    complaint.status = 'Escalated';
    complaint.priority = 'Urgent'; // Escalations automatically elevated to urgent
    complaint.updated_at = now;

    this.data.complaint_status_history.push({
      id: `sh-${Date.now()}`,
      complaint_id: complaint.id,
      previous_status: previousStatus,
      new_status: 'Escalated',
      changed_by_id: escalatedById,
      comment: `Escalated to Head of Department: ${reason}`,
      is_visible_to_student: true,
      created_at: now
    });

    this.createNotification({
      user_id: escalatedToId,
      complaint_id: complaint.id,
      title: 'Urgent Complaint Escalation',
      message: `Complaint ${complaint.reference_no} has been escalated to you: "${reason}".`,
      type: 'escalated'
    });

    this.persist();
    return complaint;
  }

  public resolveComplaint(
    complaintId: string,
    data: {
      resolution_summary: string;
      resolution_action_taken?: string;
      resolved_by_id: string;
      asProposedOnly?: boolean;
    }
  ): Complaint {
    const complaint = this.getComplaintById(complaintId);
    if (!complaint) throw new Error('Complaint not found');

    const now = new Date().toISOString();
    complaint.resolution_summary = data.resolution_summary;
    complaint.resolution_action_taken = data.resolution_action_taken;
    complaint.resolved_by_id = data.resolved_by_id;
    complaint.resolved_at = now;
    complaint.updated_at = now;

    const previousStatus = complaint.status;
    const targetStatus: ComplaintStatus = data.asProposedOnly ? 'Resolution Proposed' : 'Resolved';
    complaint.status = targetStatus;

    this.data.complaint_status_history.push({
      id: `sh-${Date.now()}`,
      complaint_id: complaint.id,
      previous_status: previousStatus,
      new_status: targetStatus,
      changed_by_id: data.resolved_by_id,
      comment: `Resolution ${data.asProposedOnly ? 'proposed' : 'completed'}: ${data.resolution_summary}`,
      is_visible_to_student: true,
      created_at: now
    });

    this.createNotification({
      user_id: complaint.student_id,
      complaint_id: complaint.id,
      title: data.asProposedOnly ? 'Resolution Proposed' : 'Complaint Resolved',
      message: `Your complaint ${complaint.reference_no} has an official resolution available for review.`,
      type: 'resolved'
    });

    this.persist();
    return complaint;
  }

  public closeComplaint(complaintId: string, closedById: string, closingComment?: string): Complaint {
    const complaint = this.getComplaintById(complaintId);
    if (!complaint) throw new Error('Complaint not found');

    if (complaint.status !== 'Resolved') {
      throw new Error('Only complaints in "Resolved" status can be formally closed.');
    }

    const now = new Date().toISOString();
    complaint.status = 'Closed';
    complaint.closed_at = now;
    complaint.closed_by_id = closedById;
    complaint.updated_at = now;

    this.data.complaint_status_history.push({
      id: `sh-${Date.now()}`,
      complaint_id: complaint.id,
      previous_status: 'Resolved',
      new_status: 'Closed',
      changed_by_id: closedById,
      comment: closingComment || 'Complaint formally closed following student review and departmental sign-off.',
      is_visible_to_student: true,
      created_at: now
    });

    this.createNotification({
      user_id: complaint.student_id,
      complaint_id: complaint.id,
      title: 'Complaint Closed',
      message: `Complaint ${complaint.reference_no} has been formally closed. Thank you.`,
      type: 'status_change'
    });

    this.persist();
    return complaint;
  }

  public reopenComplaint(complaintId: string, studentId: string, reason: string): Complaint {
    const complaint = this.getComplaintById(complaintId);
    if (!complaint) throw new Error('Complaint not found');

    if (complaint.student_id !== studentId) {
      throw new Error('Only the student who submitted the complaint may request reopening.');
    }

    if (complaint.status !== 'Resolved' && complaint.status !== 'Closed') {
      throw new Error('Only resolved or closed complaints may be reopened.');
    }

    const now = new Date().toISOString();
    const previousStatus = complaint.status;
    complaint.status = 'Reopened';
    complaint.reopened_at = now;
    complaint.reopened_reason = reason;
    complaint.updated_at = now;

    this.data.complaint_status_history.push({
      id: `sh-${Date.now()}`,
      complaint_id: complaint.id,
      previous_status: previousStatus,
      new_status: 'Reopened',
      changed_by_id: studentId,
      comment: `Reopened by student: ${reason}`,
      is_visible_to_student: true,
      created_at: now
    });

    // Notify assigned handler
    if (complaint.assigned_to_id) {
      this.createNotification({
        user_id: complaint.assigned_to_id,
        complaint_id: complaint.id,
        title: 'Complaint Reopened by Student',
        message: `Complaint ${complaint.reference_no} was reopened with remark: "${reason}".`,
        type: 'action_required'
      });
    }

    this.persist();
    return complaint;
  }

  // --- Messages ---
  public getMessages(complaintId: string, isStaff: boolean): ComplaintMessage[] {
    return this.data.complaint_messages
      .filter((m) => m.complaint_id === complaintId)
      .filter((m) => isStaff || !m.is_internal_note); // Strict server-side filter!
  }

  public addMessage(params: {
    complaint_id: string;
    sender_id: string;
    message: string;
    is_official_response?: boolean;
    is_internal_note?: boolean;
  }): ComplaintMessage {
    const complaint = this.getComplaintById(params.complaint_id);
    if (!complaint) throw new Error('Complaint not found');

    const sender = this.findUserById(params.sender_id);
    if (!sender) throw new Error('Sender user not found');

    const isStudent = sender.role === 'student';
    // Students can NEVER mark messages as internal note or official response
    const isInternal = isStudent ? false : !!params.is_internal_note;
    const isOfficial = isStudent ? false : !!params.is_official_response;

    const newMsg: ComplaintMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      complaint_id: params.complaint_id,
      sender_id: sender.id,
      sender_name: sender.full_name,
      sender_role: sender.role,
      message: params.message.trim(),
      is_official_response: isOfficial,
      is_internal_note: isInternal,
      created_at: new Date().toISOString()
    };

    this.data.complaint_messages.push(newMsg);

    // Send notification
    if (isStudent && complaint.assigned_to_id) {
      this.createNotification({
        user_id: complaint.assigned_to_id,
        complaint_id: complaint.id,
        title: 'New Student Follow-up Message',
        message: `${sender.full_name} sent a follow-up message on ${complaint.reference_no}.`,
        type: 'info'
      });
    } else if (!isStudent && !isInternal) {
      this.createNotification({
        user_id: complaint.student_id,
        complaint_id: complaint.id,
        title: isOfficial ? 'Official Departmental Response' : 'New Staff Message',
        message: `${sender.full_name} replied to your complaint ${complaint.reference_no}.`,
        type: 'info'
      });
    }

    this.persist();
    return newMsg;
  }

  // --- Internal Notes (Strict Staff-Only Storage & Query) ---
  public getInternalNotes(complaintId: string): ComplaintInternalNote[] {
    return this.data.complaint_internal_notes.filter((n) => n.complaint_id === complaintId);
  }

  public addInternalNote(params: {
    complaint_id: string;
    author_id: string;
    note: string;
    action_required?: string;
  }): ComplaintInternalNote {
    const author = this.findUserById(params.author_id);
    if (!author) throw new Error('Author not found');
    if (author.role === 'student') {
      throw new Error('Students are not authorized to create internal departmental notes.');
    }

    const newNote: ComplaintInternalNote = {
      id: `in-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      complaint_id: params.complaint_id,
      author_id: author.id,
      author_name: author.full_name,
      note: params.note.trim(),
      action_required: params.action_required?.trim(),
      created_at: new Date().toISOString()
    };

    this.data.complaint_internal_notes.push(newNote);
    this.persist();
    return newNote;
  }

  // --- Attachments ---
  public getAttachments(complaintId: string, isStaff: boolean): ComplaintAttachment[] {
    return this.data.complaint_attachments
      .filter((a) => a.complaint_id === complaintId)
      .filter((a) => isStaff || a.access_level === 'student_and_staff');
  }

  public addAttachment(params: {
    complaint_id: string;
    uploader_id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    file_data_url?: string;
    access_level?: 'student_and_staff' | 'staff_only';
  }): ComplaintAttachment {
    const uploader = this.findUserById(params.uploader_id);
    if (!uploader) throw new Error('Uploader not found');

    const newAttachment: ComplaintAttachment = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      complaint_id: params.complaint_id,
      uploader_id: uploader.id,
      uploader_name: uploader.full_name,
      file_name: params.file_name,
      file_size: params.file_size,
      mime_type: params.mime_type,
      file_data_url: params.file_data_url,
      access_level: uploader.role === 'student' ? 'student_and_staff' : (params.access_level || 'student_and_staff'),
      created_at: new Date().toISOString()
    };

    this.data.complaint_attachments.push(newAttachment);
    this.persist();
    return newAttachment;
  }

  // --- Status History ---
  public getStatusHistory(complaintId: string, isStaff: boolean): ComplaintStatusHistory[] {
    return this.data.complaint_status_history
      .filter((sh) => sh.complaint_id === complaintId)
      .filter((sh) => isStaff || sh.is_visible_to_student);
  }

  // --- Notifications ---
  public createNotification(data: Omit<Notification, 'id' | 'is_read' | 'created_at'>): Notification {
    const newNotif: Notification = {
      ...data,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      is_read: false,
      created_at: new Date().toISOString()
    };
    this.data.notifications.unshift(newNotif);
    this.persist();
    return newNotif;
  }

  public getUserNotifications(userId: string): Notification[] {
    return this.data.notifications.filter((n) => n.user_id === userId);
  }

  public markNotificationAsRead(id: string, userId: string): void {
    const notif = this.data.notifications.find((n) => n.id === id && n.user_id === userId);
    if (notif) {
      notif.is_read = true;
      this.persist();
    }
  }

  public markAllNotificationsAsRead(userId: string): void {
    for (const notif of this.data.notifications) {
      if (notif.user_id === userId) {
        notif.is_read = true;
      }
    }
    this.persist();
  }

  // --- Audit Logging ---
  public createAuditLog(params: {
    user_id: string;
    user_email: string;
    user_role: string;
    action: string;
    entity_type: string;
    entity_id: string;
    details?: Record<string, any>;
    ip_address?: string;
  }): AuditLog {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: params.user_id,
      user_email: params.user_email,
      user_role: params.user_role,
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      details: params.details,
      ip_address: params.ip_address || '127.0.0.1',
      created_at: new Date().toISOString()
    };

    this.data.audit_logs.unshift(newLog);
    // Keep max 500 audit logs in file
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 500);
    }
    this.persist();
    return newLog;
  }

  public listAuditLogs(limit = 100): AuditLog[] {
    return this.data.audit_logs.slice(0, limit);
  }

  // --- Settings ---
  public getSettings(): SystemSetting[] {
    return this.data.system_settings;
  }

  public getSetting(key: string): string | undefined {
    return this.data.system_settings.find((s) => s.key === key)?.value;
  }

  public updateSetting(key: string, value: string): SystemSetting {
    const setting = this.data.system_settings.find((s) => s.key === key);
    if (!setting) throw new Error(`Setting with key ${key} not found`);
    setting.value = value;
    setting.updated_at = new Date().toISOString();
    this.persist();
    return setting;
  }

  // --- Aggregate Reporting & Metrics ---
  public getReportingAnalytics() {
    const totalComplaints = this.data.complaints.length;
    const resolvedCount = this.data.complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
    const escalatedCount = this.data.complaints.filter((c) => c.is_escalated || c.status === 'Escalated').length;

    const now = new Date();
    const overdueCount = this.data.complaints.filter((c) => {
      if (c.status === 'Resolved' || c.status === 'Closed') return false;
      if (!c.sla_due_at) return false;
      return new Date(c.sla_due_at) < now;
    }).length;

    // Counts by Status
    const byStatus: Record<string, number> = {};
    for (const c of this.data.complaints) {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    }

    // Counts by Category
    const byCategory: Record<string, { name: string; count: number }> = {};
    for (const c of this.data.complaints) {
      const cat = this.getCategoryById(c.category_id);
      const catName = cat ? cat.name : 'Unknown';
      if (!byCategory[c.category_id]) {
        byCategory[c.category_id] = { name: catName, count: 0 };
      }
      byCategory[c.category_id].count++;
    }

    // Workload by Handler
    const byHandler: Record<string, { name: string; activeCount: number; resolvedCount: number }> = {};
    const staffMembers = this.data.users.filter((u) => u.role === 'officer' || u.role === 'hod');
    for (const staff of staffMembers) {
      byHandler[staff.id] = { name: staff.full_name, activeCount: 0, resolvedCount: 0 };
    }
    for (const c of this.data.complaints) {
      if (c.assigned_to_id && byHandler[c.assigned_to_id]) {
        if (c.status === 'Resolved' || c.status === 'Closed') {
          byHandler[c.assigned_to_id].resolvedCount++;
        } else {
          byHandler[c.assigned_to_id].activeCount++;
        }
      }
    }

    // Resolution Rate & SLA Compliance
    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : 0;

    return {
      totalComplaints,
      resolvedCount,
      escalatedCount,
      overdueCount,
      resolutionRate,
      byStatus,
      byCategory: Object.values(byCategory),
      byHandler: Object.values(byHandler)
    };
  }
}

export const db = new Database();
