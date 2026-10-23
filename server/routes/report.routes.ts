import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Staff reports access (officer, hod, admin, reviewer)
router.use(authenticate, requireRole(['officer', 'hod', 'admin', 'reviewer']));

// 1. Departmental Analytics
router.get('/analytics', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const analytics = db.getReportingAnalytics();
    res.json({ success: true, data: analytics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to compute analytics.' });
  }
});

// 2. CSV Export
router.get('/export-csv', (_req: AuthenticatedRequest, res: Response) => {
  try {
    const complaints = db.listComplaints();
    const categories = db.listCategories(true);
    const catMap = new Map(categories.map((c) => [c.id, c.name]));

    const header = [
      'Reference No',
      'Student Name',
      'Registration Number',
      'Category',
      'Title',
      'Course Code',
      'Level',
      'Semester',
      'Academic Session',
      'Status',
      'Priority',
      'Assigned Handler',
      'Escalated',
      'Date Submitted',
      'Resolution Summary',
      'Date Resolved'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      // Prevent spreadsheet formula injection
      if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
        str = `'${str}`;
      }
      return `"${str}"`;
    };

    const rows = complaints.map((c) => {
      const student = db.findUserById(c.student_id);
      const profile = db.getStudentProfileByUserId(c.student_id);
      const handler = c.assigned_to_id ? db.findUserById(c.assigned_to_id) : undefined;
      const categoryName = catMap.get(c.category_id) || 'Unknown';

      return [
        escapeCsv(c.reference_no),
        escapeCsv(student ? student.full_name : 'N/A'),
        escapeCsv(profile ? profile.registration_number : 'N/A'),
        escapeCsv(categoryName),
        escapeCsv(c.title),
        escapeCsv(c.course_code || 'N/A'),
        escapeCsv(c.level),
        escapeCsv(c.semester),
        escapeCsv(c.academic_session),
        escapeCsv(c.status),
        escapeCsv(c.priority),
        escapeCsv(handler ? handler.full_name : 'Unassigned'),
        escapeCsv(c.is_escalated ? 'Yes' : 'No'),
        escapeCsv(new Date(c.created_at).toLocaleDateString()),
        escapeCsv(c.resolution_summary || 'N/A'),
        escapeCsv(c.resolved_at ? new Date(c.resolved_at).toLocaleDateString() : 'N/A')
      ].join(',');
    });

    const csvContent = [header.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="BUK_MechEng_OSCMS_Complaints_Report.csv"');
    res.status(200).send(csvContent);
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to generate CSV export.' });
  }
});

export default router;
