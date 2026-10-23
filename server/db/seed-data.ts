import bcrypt from 'bcryptjs';
import { DatabaseSchema, UserRole } from './types';

export function getInitialSeedData(): DatabaseSchema {
  // Pre-hashed passwords for deterministic fast startup
  // 'Password@123'
  const defaultHash = bcrypt.hashSync('Password@123', 10);

  const roles: DatabaseSchema['roles'] = [
    { id: 'role-student', name: 'student', display_name: 'Student', description: 'Undergraduate student of Mechanical Engineering submitting and tracking complaints', is_system: true },
    { id: 'role-officer', name: 'officer', display_name: 'Department Complaint Officer', description: 'Investigates, assigns, responds to, and manages complaints', is_system: true },
    { id: 'role-hod', name: 'hod', display_name: 'Head of Department (HOD)', description: 'Departmental executive oversight, escalations, approvals, and reporting', is_system: true },
    { id: 'role-admin', name: 'admin', display_name: 'System Administrator', description: 'System configuration, user management, audit logs, and categories', is_system: true },
    { id: 'role-reviewer', name: 'reviewer', display_name: 'Auditor / Reviewer', description: 'Read-only departmental audit and oversight access', is_system: true }
  ];

  const permissions: DatabaseSchema['permissions'] = [
    { id: 'p1', code: 'complaints:create', name: 'Submit Complaint', module: 'complaints', description: 'Submit a new complaint' },
    { id: 'p2', code: 'complaints:view_own', name: 'View Own Complaints', module: 'complaints', description: 'View own complaint records' },
    { id: 'p3', code: 'complaints:view_dept', name: 'View Department Complaints', module: 'complaints', description: 'View all department complaints' },
    { id: 'p4', code: 'complaints:assign', name: 'Assign Handlers', module: 'complaints', description: 'Assign or reassign complaints' },
    { id: 'p5', code: 'complaints:status_update', name: 'Update Workflow Status', module: 'complaints', description: 'Progress complaint through lifecycle' },
    { id: 'p6', code: 'complaints:internal_notes', name: 'Internal Notes', module: 'complaints', description: 'View and add confidential internal notes' },
    { id: 'p7', code: 'complaints:escalate', name: 'Escalate to HOD', module: 'complaints', description: 'Escalate cases requiring HOD attention' },
    { id: 'p8', code: 'complaints:resolve', name: 'Propose and Resolve', module: 'complaints', description: 'Propose resolution or mark resolved' },
    { id: 'p9', code: 'complaints:close', name: 'Close Complaint', module: 'complaints', description: 'Final closure of verified complaint' },
    { id: 'p10', code: 'reports:view', name: 'View Analytics Reports', module: 'reports', description: 'Access aggregate analytics and metrics' },
    { id: 'p11', code: 'reports:export', name: 'Export Reports', module: 'reports', description: 'Export CSV / PDF departmental reports' },
    { id: 'p12', code: 'admin:users', name: 'Manage Users', module: 'admin', description: 'Create and edit staff/student users' },
    { id: 'p13', code: 'admin:settings', name: 'System Settings', module: 'admin', description: 'Configure system rules and SLA limits' },
    { id: 'p14', code: 'audit:view', name: 'View Audit Trail', module: 'audit', description: 'View tamper-evident security audit logs' }
  ];

  const role_permissions: DatabaseSchema['role_permissions'] = [
    // Student
    { role_name: 'student', permission_code: 'complaints:create' },
    { role_name: 'student', permission_code: 'complaints:view_own' },
    // Officer
    { role_name: 'officer', permission_code: 'complaints:view_dept' },
    { role_name: 'officer', permission_code: 'complaints:assign' },
    { role_name: 'officer', permission_code: 'complaints:status_update' },
    { role_name: 'officer', permission_code: 'complaints:internal_notes' },
    { role_name: 'officer', permission_code: 'complaints:escalate' },
    { role_name: 'officer', permission_code: 'complaints:resolve' },
    { role_name: 'officer', permission_code: 'reports:view' },
    // HOD
    { role_name: 'hod', permission_code: 'complaints:view_dept' },
    { role_name: 'hod', permission_code: 'complaints:assign' },
    { role_name: 'hod', permission_code: 'complaints:status_update' },
    { role_name: 'hod', permission_code: 'complaints:internal_notes' },
    { role_name: 'hod', permission_code: 'complaints:resolve' },
    { role_name: 'hod', permission_code: 'complaints:close' },
    { role_name: 'hod', permission_code: 'reports:view' },
    { role_name: 'hod', permission_code: 'reports:export' },
    { role_name: 'hod', permission_code: 'audit:view' },
    // Admin
    { role_name: 'admin', permission_code: 'complaints:view_dept' },
    { role_name: 'admin', permission_code: 'reports:view' },
    { role_name: 'admin', permission_code: 'reports:export' },
    { role_name: 'admin', permission_code: 'admin:users' },
    { role_name: 'admin', permission_code: 'admin:settings' },
    { role_name: 'admin', permission_code: 'audit:view' },
    // Reviewer
    { role_name: 'reviewer', permission_code: 'complaints:view_dept' },
    { role_name: 'reviewer', permission_code: 'reports:view' },
    { role_name: 'reviewer', permission_code: 'audit:view' }
  ];

  const users: DatabaseSchema['users'] = [
    {
      id: 'u-admin-1',
      email: 'admin@buk.edu.ng',
      password_hash: defaultHash,
      role: 'admin',
      full_name: 'Engr. Ibrahim Danbatta',
      phone: '+234 803 123 4567',
      is_active: true,
      created_at: '2026-01-10T08:00:00Z',
      updated_at: '2026-01-10T08:00:00Z'
    },
    {
      id: 'u-hod-1',
      email: 'hod.mech@buk.edu.ng',
      password_hash: defaultHash,
      role: 'hod',
      full_name: 'Prof. A. S. Garba',
      phone: '+234 802 987 6543',
      is_active: true,
      created_at: '2026-01-10T08:00:00Z',
      updated_at: '2026-01-10T08:00:00Z'
    },
    {
      id: 'u-officer-1',
      email: 'officer@buk.edu.ng',
      password_hash: defaultHash,
      role: 'officer',
      full_name: 'Dr. Mustapha Bello',
      phone: '+234 803 555 1212',
      is_active: true,
      created_at: '2026-01-10T08:00:00Z',
      updated_at: '2026-01-10T08:00:00Z'
    },
    {
      id: 'u-student-1',
      email: 'aminu.k@buk.edu.ng',
      password_hash: defaultHash,
      role: 'student',
      full_name: 'Aminu Kabir',
      phone: '+234 814 222 3344',
      is_active: true,
      created_at: '2026-01-15T09:30:00Z',
      updated_at: '2026-01-15T09:30:00Z'
    },
    {
      id: 'u-student-2',
      email: 'fatima.u@buk.edu.ng',
      password_hash: defaultHash,
      role: 'student',
      full_name: 'Fatima Umar',
      phone: '+234 816 777 8899',
      is_active: true,
      created_at: '2026-01-20T10:15:00Z',
      updated_at: '2026-01-20T10:15:00Z'
    },
    {
      id: 'u-reviewer-1',
      email: 'auditor@buk.edu.ng',
      password_hash: defaultHash,
      role: 'reviewer',
      full_name: 'Engr. K. Aliyu (Faculty QA)',
      phone: '+234 809 333 4455',
      is_active: true,
      created_at: '2026-01-12T11:00:00Z',
      updated_at: '2026-01-12T11:00:00Z'
    }
  ];

  const student_profiles: DatabaseSchema['student_profiles'] = [
    {
      id: 'sp-1',
      user_id: 'u-student-1',
      registration_number: 'UG20/ENG/MEC/1042',
      level: '500L',
      academic_session: '2025/2026',
      department: 'Department of Mechanical Engineering',
      faculty: 'Faculty of Engineering',
      entry_year: '2020'
    },
    {
      id: 'sp-2',
      user_id: 'u-student-2',
      registration_number: 'UG21/ENG/MEC/1088',
      level: '400L',
      academic_session: '2025/2026',
      department: 'Department of Mechanical Engineering',
      faculty: 'Faculty of Engineering',
      entry_year: '2021'
    }
  ];

  const complaint_categories: DatabaseSchema['complaint_categories'] = [
    {
      id: 'cat-1',
      code: 'EXAM_RES',
      name: 'Examination and Results',
      description: 'Missing grades, score computation errors, script re-marking requests, and carryover verification.',
      default_priority: 'High',
      sla_hours: 48,
      is_active: true
    },
    {
      id: 'cat-2',
      code: 'CRS_REG',
      name: 'Course Registration',
      description: 'Prerequisite overrides, late add/drop, maximum credit load approval, and portal synchronization issues.',
      default_priority: 'Normal',
      sla_hours: 72,
      is_active: true
    },
    {
      id: 'cat-3',
      code: 'LEC_TT',
      name: 'Lectures and Timetable',
      description: 'Lecture venue clashes, lecturer absentee notifications, clashes with university general studies courses.',
      default_priority: 'Normal',
      sla_hours: 48,
      is_active: true
    },
    {
      id: 'cat-4',
      code: 'CA_TESTS',
      name: 'Continuous Assessment',
      description: 'Omission of test/assignment scores, midterm CA discrepancies, medical absence during test.',
      default_priority: 'Normal',
      sla_hours: 72,
      is_active: true
    },
    {
      id: 'cat-5',
      code: 'PRJ_SUP',
      name: 'Project and Supervision',
      description: 'Final year project topic allocation, supervisor communication breakdown, experimental fabrication delays.',
      default_priority: 'High',
      sla_hours: 96,
      is_active: true
    },
    {
      id: 'cat-6',
      code: 'LAB_FAC',
      name: 'Laboratory and Workshop Facilities',
      description: 'Defective mechanical testing equipment, CNC machines, lack of consumables, workshop safety issues.',
      default_priority: 'Normal',
      sla_hours: 72,
      is_active: true
    },
    {
      id: 'cat-7',
      code: 'DEPT_ADM',
      name: 'Departmental Administration',
      description: 'Letters of recommendation, industrial training verification, clearance delays, formal departmental notices.',
      default_priority: 'Normal',
      sla_hours: 120,
      is_active: true
    },
    {
      id: 'cat-8',
      code: 'ACAD_ADV',
      name: 'Academic Advising',
      description: 'Level coordinator consultations, probation counselling, graduation requirement checks.',
      default_priority: 'Low',
      sla_hours: 120,
      is_active: true
    },
    {
      id: 'cat-9',
      code: 'REC_DOC',
      name: 'Student Records and Documentation',
      description: 'Correction of name spelling, transcript verification, admission letter harmonization.',
      default_priority: 'Normal',
      sla_hours: 96,
      is_active: true
    },
    {
      id: 'cat-10',
      code: 'OTHERS',
      name: 'Other Departmental Matters',
      description: 'General welfare, departmental association (NIMechE BUK chapter) or miscellaneous academic issues.',
      default_priority: 'Low',
      sla_hours: 120,
      is_active: true
    }
  ];

  const complaints: DatabaseSchema['complaints'] = [
    {
      id: 'cmp-001',
      reference_no: 'MECH-2026-000001',
      student_id: 'u-student-1',
      category_id: 'cat-1',
      title: 'Omission of Continuous Assessment Score for MEC3301 (Thermodynamics II)',
      description: 'I participated in both the mid-semester test and laboratory practicals for MEC3301 during the First Semester 2025/2026. However, on the provisional result sheet posted on the departmental board, my CA column reflects 00/30, resulting in a false carryover grade. I have attached a signed copy of the test attendance sheet and lab report grade slip from Engr. Bello.',
      course_code: 'MEC3301',
      level: '500L',
      semester: 'First Semester',
      academic_session: '2025/2026',
      requested_outcome: 'Rectification of my continuous assessment score (24/30) and update of the departmental composite master sheet before Senate submission.',
      status: 'Assigned for Investigation',
      priority: 'High',
      assigned_to_id: 'u-officer-1',
      assigned_at: '2026-10-18T10:00:00Z',
      sla_due_at: '2026-10-25T10:00:00Z',
      is_escalated: false,
      created_at: '2026-10-17T14:20:00Z',
      updated_at: '2026-10-18T10:00:00Z'
    },
    {
      id: 'cmp-002',
      reference_no: 'MECH-2026-000002',
      student_id: 'u-student-2',
      category_id: 'cat-3',
      title: 'Level 400 Examination Timetable Clash: MEC4204 vs ELE4202',
      description: 'The tentative draft of the second semester examination timetable has scheduled both MEC4204 (Engineering Metallurgy) and ELE4202 (Electrical Power & Machines) on Tuesday 4th November 2026 from 9:00 AM to 12:00 PM at Old Campus Lecture Hall 2. As direct-entry mechanical students, six of us are registered for both courses.',
      course_code: 'MEC4204',
      level: '400L',
      semester: 'Second Semester',
      academic_session: '2025/2026',
      requested_outcome: 'Adjustment of the date or time slot for one of the examinations to prevent forfeiture of an essential engineering module.',
      status: 'Escalated',
      priority: 'Urgent',
      assigned_to_id: 'u-officer-1',
      assigned_at: '2026-10-20T08:30:00Z',
      sla_due_at: '2026-10-22T08:30:00Z',
      is_escalated: true,
      escalated_to_id: 'u-hod-1',
      escalated_at: '2026-10-21T11:00:00Z',
      escalation_reason: 'Timetable clash affects multiple level 400 students across departments; requires Faculty Examination Committee intervention chaired by HOD.',
      created_at: '2026-10-19T16:00:00Z',
      updated_at: '2026-10-21T11:00:00Z'
    },
    {
      id: 'cmp-003',
      reference_no: 'MECH-2026-000003',
      student_id: 'u-student-1',
      category_id: 'cat-6',
      title: 'Defective Universal Testing Machine in Departmental Materials Lab',
      description: 'The tensile test gripper jaws on the hydraulic universal testing machine (UTM) in Room 104 are severely stripped, leading to premature specimen slippage during our MEC5201 experimental runs. We are unable to complete the stress-strain validation for our composite specimens.',
      course_code: 'MEC5201',
      level: '500L',
      semester: 'First Semester',
      academic_session: '2025/2026',
      requested_outcome: 'Expedited replacement of the serrated wedge grips and calibration of the load cell so final-year groups can conclude laboratory tests.',
      status: 'Resolution Proposed',
      priority: 'Normal',
      assigned_to_id: 'u-officer-1',
      assigned_at: '2026-10-12T09:00:00Z',
      sla_due_at: '2026-10-19T09:00:00Z',
      is_escalated: false,
      resolution_summary: 'Departmental Chief Technologist has fitted spare wedge jaws from the central faculty engineering stores and successfully re-calibrated the UTM for 50kN load capacity.',
      resolution_action_taken: 'Procured spare serrated jaws; tested sample mild steel specimen with 0.2% offset yield validation; machine certified operational.',
      resolved_by_id: 'u-officer-1',
      resolved_at: '2026-10-22T14:00:00Z',
      created_at: '2026-10-11T11:30:00Z',
      updated_at: '2026-10-22T14:00:00Z'
    },
    {
      id: 'cmp-004',
      reference_no: 'MECH-2026-000004',
      student_id: 'u-student-2',
      category_id: 'cat-2',
      title: 'Portal Credit Limit Error for Elective MEC4310 (Renewable Energy Systems)',
      description: 'During online registration on the university portal, adding the 3-credit elective MEC4310 caused a prompt error: "Departmental Semester Maximum Credit (24 Units) Exceeded". My current load is 21 units. The level coordinator has verified eligibility.',
      course_code: 'MEC4310',
      level: '400L',
      semester: 'Second Semester',
      academic_session: '2025/2026',
      requested_outcome: 'Administrative override on the Directorate for Information and Communication Technology (DICT) portal for course approval.',
      status: 'Closed',
      priority: 'Normal',
      assigned_to_id: 'u-officer-1',
      assigned_at: '2026-09-25T10:00:00Z',
      is_escalated: false,
      resolution_summary: 'DICT portal unit cap was harmonized with the newly approved BUK Faculty of Engineering curriculum guidelines; student registration verified.',
      resolution_action_taken: 'Communicated with DICT desk officer; increased cap to 24 units; course MEC4310 formally registered on student portal.',
      resolved_by_id: 'u-officer-1',
      resolved_at: '2026-09-27T15:00:00Z',
      closed_by_id: 'u-hod-1',
      closed_at: '2026-09-28T09:30:00Z',
      created_at: '2026-09-24T12:00:00Z',
      updated_at: '2026-09-28T09:30:00Z'
    },
    {
      id: 'cmp-005',
      reference_no: 'MECH-2026-000005',
      student_id: 'u-student-1',
      category_id: 'cat-5',
      title: 'Supervisor Reassignment Request Due to Academic Sabbatical Leave',
      description: 'My assigned final year project supervisor, Dr. J. A. Mohammed, is proceeding on a one-year international research fellowship effective November 1st. My project topic is "Design and Fabrication of a Solar-Powered Cassava Peeling Machine". I require an in-department supervisor in the thermo-fluids and manufacturing design stream.',
      course_code: 'MEC5305',
      level: '500L',
      semester: 'First Semester',
      academic_session: '2025/2026',
      requested_outcome: 'Formal allocation of a new project supervisor by the Departmental Project Committee.',
      status: 'Under Initial Review',
      priority: 'Normal',
      assigned_to_id: 'u-officer-1',
      assigned_at: '2026-10-22T09:00:00Z',
      sla_due_at: '2026-10-26T09:00:00Z',
      is_escalated: false,
      created_at: '2026-10-22T08:15:00Z',
      updated_at: '2026-10-22T09:00:00Z'
    }
  ];

  const complaint_assignments: DatabaseSchema['complaint_assignments'] = [
    {
      id: 'asg-1',
      complaint_id: 'cmp-001',
      assigned_by_id: 'u-hod-1',
      assigned_to_id: 'u-officer-1',
      assigned_at: '2026-10-18T10:00:00Z'
    },
    {
      id: 'asg-2',
      complaint_id: 'cmp-002',
      assigned_by_id: 'u-officer-1',
      assigned_to_id: 'u-hod-1',
      previous_handler_id: 'u-officer-1',
      reassignment_reason: 'Escalated to HOD for examination committee coordination.',
      assigned_at: '2026-10-21T11:00:00Z'
    }
  ];

  const complaint_status_history: DatabaseSchema['complaint_status_history'] = [
    {
      id: 'sh-1',
      complaint_id: 'cmp-001',
      previous_status: 'Draft',
      new_status: 'Submitted',
      changed_by_id: 'u-student-1',
      comment: 'Initial complaint submission by student.',
      is_visible_to_student: true,
      created_at: '2026-10-17T14:20:00Z'
    },
    {
      id: 'sh-2',
      complaint_id: 'cmp-001',
      previous_status: 'Submitted',
      new_status: 'Under Initial Review',
      changed_by_id: 'u-officer-1',
      comment: 'Complaint acknowledged and queued for docket review.',
      is_visible_to_student: true,
      created_at: '2026-10-18T09:15:00Z'
    },
    {
      id: 'sh-3',
      complaint_id: 'cmp-001',
      previous_status: 'Under Initial Review',
      new_status: 'Assigned for Investigation',
      changed_by_id: 'u-officer-1',
      comment: 'Assigned to Dr. Mustapha Bello (Departmental Exam Officer) for script and attendance verification.',
      is_visible_to_student: true,
      created_at: '2026-10-18T10:00:00Z'
    },
    {
      id: 'sh-4',
      complaint_id: 'cmp-002',
      previous_status: 'Submitted',
      new_status: 'Under Initial Review',
      changed_by_id: 'u-officer-1',
      comment: 'Verified that 6 students are affected by timetable clash.',
      is_visible_to_student: true,
      created_at: '2026-10-20T08:30:00Z'
    },
    {
      id: 'sh-5',
      complaint_id: 'cmp-002',
      previous_status: 'Under Initial Review',
      new_status: 'Escalated',
      changed_by_id: 'u-officer-1',
      comment: 'Escalated to Head of Department for emergency resolution with Faculty Exam Board.',
      is_visible_to_student: true,
      created_at: '2026-10-21T11:00:00Z'
    }
  ];

  const complaint_messages: DatabaseSchema['complaint_messages'] = [
    {
      id: 'msg-1',
      complaint_id: 'cmp-001',
      sender_id: 'u-officer-1',
      sender_name: 'Dr. Mustapha Bello (Complaint Officer)',
      sender_role: 'officer',
      message: 'Dear Aminu, your complaint regarding MEC3301 Continuous Assessment has been received. Please present your original duplicate test sheet and physical logbook during departmental consultation hours (Thursday 10am - 12pm) or upload a clear scan here.',
      is_official_response: true,
      is_internal_note: false,
      created_at: '2026-10-18T11:30:00Z'
    },
    {
      id: 'msg-2',
      complaint_id: 'cmp-001',
      sender_id: 'u-student-1',
      sender_name: 'Aminu Kabir',
      sender_role: 'student',
      message: 'Thank you Sir. I have uploaded the signed practical continuous assessment sheet stamped by the workshop technologist. I will also be available on Thursday at 10am as requested.',
      is_official_response: false,
      is_internal_note: false,
      created_at: '2026-10-18T14:45:00Z'
    },
    {
      id: 'msg-3',
      complaint_id: 'cmp-002',
      sender_id: 'u-officer-1',
      sender_name: 'Dr. Mustapha Bello (Complaint Officer)',
      sender_role: 'officer',
      message: 'The complaint has been brought before the departmental academic board. An urgent liaison is ongoing with the Department of Electrical Engineering to shift ELE4202 to the afternoon slot.',
      is_official_response: true,
      is_internal_note: false,
      created_at: '2026-10-21T11:15:00Z'
    }
  ];

  const complaint_attachments: DatabaseSchema['complaint_attachments'] = [
    {
      id: 'att-1',
      complaint_id: 'cmp-001',
      uploader_id: 'u-student-1',
      uploader_name: 'Aminu Kabir',
      file_name: 'MEC3301_Test_Attendance_and_Grade_Slip.pdf',
      file_size: 245000,
      mime_type: 'application/pdf',
      access_level: 'student_and_staff',
      created_at: '2026-10-17T14:20:00Z'
    },
    {
      id: 'att-2',
      complaint_id: 'cmp-002',
      uploader_id: 'u-student-2',
      uploader_name: 'Fatima Umar',
      file_name: 'Level_400_Exam_Timetable_Draft.pdf',
      file_size: 412000,
      mime_type: 'application/pdf',
      access_level: 'student_and_staff',
      created_at: '2026-10-19T16:00:00Z'
    }
  ];

  const complaint_internal_notes: DatabaseSchema['complaint_internal_notes'] = [
    {
      id: 'in-1',
      complaint_id: 'cmp-001',
      author_id: 'u-officer-1',
      author_name: 'Dr. Mustapha Bello',
      note: 'Cross-checked with the course lecturer Engr. Dr. Sani. The error occurred during spreadsheet compilation of Section B lab test scores. The lecturer confirmed the student actually scored 24/30. Revision will be submitted at next Departmental Board meeting.',
      action_required: 'Present revised marksheet at Departmental Board next Tuesday.',
      created_at: '2026-10-19T09:00:00Z'
    },
    {
      id: 'in-2',
      complaint_id: 'cmp-002',
      author_id: 'u-hod-1',
      author_name: 'Prof. A. S. Garba',
      note: 'Spoke directly with the HOD Electrical Engineering (Prof. Dahiru). They have agreed to swap ELE4202 to Friday morning. Sub-Dean Exams has been notified to reprint the master faculty examination timetable.',
      action_required: 'Await revised timetable printout from Faculty Examination Officer.',
      created_at: '2026-10-21T14:00:00Z'
    }
  ];

  const notifications: DatabaseSchema['notifications'] = [
    {
      id: 'notif-1',
      user_id: 'u-student-1',
      complaint_id: 'cmp-001',
      title: 'Official Response Received',
      message: 'Dr. Mustapha Bello posted an official update on your complaint MECH-2026-000001.',
      type: 'status_change',
      is_read: false,
      created_at: '2026-10-18T11:30:00Z'
    },
    {
      id: 'notif-2',
      user_id: 'u-student-2',
      complaint_id: 'cmp-002',
      title: 'Complaint Escalated',
      message: 'Your complaint MECH-2026-000002 has been escalated to the Head of Department for priority resolution.',
      type: 'escalated',
      is_read: false,
      created_at: '2026-10-21T11:00:00Z'
    },
    {
      id: 'notif-3',
      user_id: 'u-officer-1',
      complaint_id: 'cmp-005',
      title: 'New Complaint Received',
      message: 'A new complaint MECH-2026-000005 has been submitted in category: Project and Supervision.',
      type: 'info',
      is_read: false,
      created_at: '2026-10-22T08:15:00Z'
    }
  ];

  const audit_logs: DatabaseSchema['audit_logs'] = [
    {
      id: 'aud-1',
      user_id: 'u-student-1',
      user_email: 'aminu.k@buk.edu.ng',
      user_role: 'student',
      action: 'COMPLAINT_SUBMITTED',
      entity_type: 'complaint',
      entity_id: 'cmp-001',
      details: { reference_no: 'MECH-2026-000001', category: 'EXAM_RES', title: 'Omission of Continuous Assessment Score for MEC3301' },
      ip_address: '102.89.44.12',
      created_at: '2026-10-17T14:20:00Z'
    },
    {
      id: 'aud-2',
      user_id: 'u-officer-1',
      user_email: 'officer@buk.edu.ng',
      user_role: 'officer',
      action: 'COMPLAINT_ASSIGNED',
      entity_type: 'complaint',
      entity_id: 'cmp-001',
      details: { assigned_to: 'Dr. Mustapha Bello', previous_status: 'Under Initial Review', new_status: 'Assigned for Investigation' },
      ip_address: '105.112.98.4',
      created_at: '2026-10-18T10:00:00Z'
    },
    {
      id: 'aud-3',
      user_id: 'u-officer-1',
      user_email: 'officer@buk.edu.ng',
      user_role: 'officer',
      action: 'INTERNAL_NOTE_ADDED',
      entity_type: 'complaint',
      entity_id: 'cmp-001',
      details: { note_id: 'in-1', confidentiality: 'staff_only' },
      ip_address: '105.112.98.4',
      created_at: '2026-10-19T09:00:00Z'
    },
    {
      id: 'aud-4',
      user_id: 'u-officer-1',
      user_email: 'officer@buk.edu.ng',
      user_role: 'officer',
      action: 'COMPLAINT_ESCALATED',
      entity_type: 'complaint',
      entity_id: 'cmp-002',
      details: { reference_no: 'MECH-2026-000002', escalated_to: 'u-hod-1', reason: 'Timetable clash across departments' },
      ip_address: '105.112.98.4',
      created_at: '2026-10-21T11:00:00Z'
    }
  ];

  const system_settings: DatabaseSchema['system_settings'] = [
    {
      id: 'set-1',
      key: 'INSTITUTION_NAME',
      value: 'Bayero University Kano',
      description: 'Official university name displayed on reports and communication',
      category: 'general',
      updated_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'set-2',
      key: 'FACULTY_NAME',
      value: 'Faculty of Engineering',
      description: 'Faculty governance unit',
      category: 'general',
      updated_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'set-3',
      key: 'DEPARTMENT_NAME',
      value: 'Department of Mechanical Engineering',
      description: 'Case study academic department',
      category: 'general',
      updated_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'set-4',
      key: 'ACADEMIC_SESSION',
      value: '2025/2026',
      description: 'Active departmental academic session',
      category: 'workflow',
      updated_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'set-5',
      key: 'ENABLE_STUDENT_SELF_REGISTRATION',
      value: 'true',
      description: 'Allow new BUK mechanical engineering students to create accounts',
      category: 'security',
      updated_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'set-6',
      key: 'SLA_URGENT_HOURS',
      value: '24',
      description: 'Resolution target for Urgent complaints (e.g. exam clashes)',
      category: 'workflow',
      updated_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'set-7',
      key: 'SLA_HIGH_HOURS',
      value: '48',
      description: 'Resolution target for High priority complaints (e.g. result omission)',
      category: 'workflow',
      updated_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'set-8',
      key: 'SLA_NORMAL_HOURS',
      value: '120',
      description: 'Resolution target for Normal priority complaints (5 working days)',
      category: 'workflow',
      updated_at: '2026-01-01T00:00:00Z'
    },
    {
      id: 'set-9',
      key: 'ALLOW_STUDENT_REOPEN_DAYS',
      value: '7',
      description: 'Number of calendar days a student can request reopening after resolution',
      category: 'workflow',
      updated_at: '2026-01-01T00:00:00Z'
    }
  ];

  return {
    users,
    student_profiles,
    roles,
    permissions,
    role_permissions,
    complaint_categories,
    complaints,
    complaint_assignments,
    complaint_status_history,
    complaint_messages,
    complaint_attachments,
    complaint_internal_notes,
    notifications,
    audit_logs,
    system_settings
  };
}
