/**
 * Automated Verification Suite for OSCMS (Department of Mechanical Engineering, BUK)
 */

import { db, PERMITTED_STATUS_TRANSITIONS } from '../server/db/database';
import { canAccessComplaint } from '../server/middleware/auth';
import { User, ComplaintStatus } from '../server/db/types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`);
  }
}

console.log('====================================================');
console.log('   OSCMS AUTOMATED TEST SUITE: BUK MECHANICAL ENG   ');
console.log('====================================================\n');

// 1. Reference Generation Tests
console.log('1. COMPLAINT REFERENCE GENERATION');
const ref1 = db.generateComplaintReference();
assert(
  /^MECH-\d{4}-\d{6}$/.test(ref1),
  'Generated reference matches pattern MECH-YYYY-00000X',
  `Received: ${ref1}`
);
assert(
  ref1.startsWith(`MECH-${new Date().getFullYear()}-`),
  'Reference contains current year prefix'
);

// 2. Status Transition Matrix Tests
console.log('\n2. WORKFLOW STATUS TRANSITIONS & RESTRICTIONS');
assert(
  PERMITTED_STATUS_TRANSITIONS['Draft'].includes('Submitted'),
  'Draft can transition to Submitted'
);
assert(
  !PERMITTED_STATUS_TRANSITIONS['Submitted'].includes('Closed'),
  'Submitted CANNOT directly jump to Closed'
);
assert(
  !PERMITTED_STATUS_TRANSITIONS['Under Initial Review'].includes('Resolved'),
  'Under Initial Review CANNOT bypass Investigation directly to Resolved'
);
assert(
  PERMITTED_STATUS_TRANSITIONS['Under Investigation'].includes('Resolution Proposed'),
  'Under Investigation can advance to Resolution Proposed'
);
assert(
  PERMITTED_STATUS_TRANSITIONS['Resolution Proposed'].includes('Resolved'),
  'Resolution Proposed can transition to Resolved'
);

// 3. Object-Level Authorization (IDOR / BOLA Prevention)
console.log('\n3. OBJECT-LEVEL AUTHORIZATION CHECKS');
const student1: User = {
  id: 'u-student-1',
  email: 'aminu.k@buk.edu.ng',
  password_hash: '...',
  role: 'student',
  full_name: 'Aminu Kabir',
  phone: '08142223344',
  is_active: true,
  created_at: '',
  updated_at: ''
};

const student2: User = {
  id: 'u-student-2',
  email: 'fatima.u@buk.edu.ng',
  password_hash: '...',
  role: 'student',
  full_name: 'Fatima Umar',
  phone: '08167778899',
  is_active: true,
  created_at: '',
  updated_at: ''
};

const officer: User = {
  id: 'u-officer-1',
  email: 'officer@buk.edu.ng',
  password_hash: '...',
  role: 'officer',
  full_name: 'Dr. Mustapha Bello',
  phone: '08035551212',
  is_active: true,
  created_at: '',
  updated_at: ''
};

const mockComplaint = db.getComplaintById('cmp-001')!;

assert(
  canAccessComplaint(student1, mockComplaint) === true,
  'Student owner CAN access their own complaint'
);
assert(
  canAccessComplaint(student2, mockComplaint) === false,
  'Student A CANNOT access Student B complaint (IDOR Protected)'
);
assert(
  canAccessComplaint(officer, mockComplaint) === true,
  'Departmental Complaint Officer CAN access department complaints'
);

// 4. Confidential Internal Notes Segregation
console.log('\n4. INTERNAL NOTES SERVER-SIDE SEGREGATION');
const studentMessages = db.getMessages('cmp-001', false);
const staffMessages = db.getMessages('cmp-001', true);
const internalNotesDirect = db.getInternalNotes('cmp-001');

assert(
  studentMessages.every((m) => !m.is_internal_note),
  'Messages returned to student contain ZERO internal notes'
);
assert(
  internalNotesDirect.length > 0,
  'Internal notes exist and are stored separately for staff investigation'
);

// 5. Audit Logging Verification
console.log('\n5. TAMPER-EVIDENT AUDIT LOGGING');
const initialLogCount = db.listAuditLogs().length;
db.createAuditLog({
  user_id: officer.id,
  user_email: officer.email,
  user_role: officer.role,
  action: 'AUTOMATED_TEST_VERIFICATION',
  entity_type: 'test',
  entity_id: 't-1',
  details: { test: true }
});
const updatedLogCount = db.listAuditLogs().length;
assert(
  updatedLogCount === initialLogCount + 1,
  'Audit log entry successfully created and persisted'
);

// 6. Analytics & SLA Calculations
console.log('\n6. REPORTING & METRICS ENGINE');
const analytics = db.getReportingAnalytics();
assert(
  analytics.totalComplaints >= 5,
  'Analytics calculates total complaints from live database records'
);
assert(
  analytics.byCategory.length > 0,
  'Category breakdown is correctly aggregated'
);
assert(
  typeof analytics.resolutionRate === 'number' && analytics.resolutionRate >= 0,
  'Resolution rate is computed as a valid percentage'
);

console.log('\n----------------------------------------------------');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log('----------------------------------------------------\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
