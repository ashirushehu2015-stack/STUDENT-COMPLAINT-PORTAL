import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { ComplaintStatus, ComplaintPriority } from '../db/types';

const router = Router();

// Staff gatekeeper: Only officer, hod, admin, reviewer allowed
router.use(authenticate, requireRole(['officer', 'hod', 'admin', 'reviewer']));

// 1. List Department Queue
router.get('/complaints', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, category_id, priority, assigned_to_id, is_escalated, search, academic_session } = req.query;

    const complaints = db.listComplaints({
      status: status as ComplaintStatus | undefined,
      category_id: category_id as string | undefined,
      priority: priority as ComplaintPriority | undefined,
      assigned_to_id: assigned_to_id as string | undefined,
      is_escalated: is_escalated !== undefined ? is_escalated === 'true' : undefined,
      search: search as string | undefined,
      academic_session: academic_session as string | undefined
    });

    const enriched = complaints.map((c) => {
      const student = db.findUserById(c.student_id);
      const profile = db.getStudentProfileByUserId(c.student_id);
      const handler = c.assigned_to_id ? db.findUserById(c.assigned_to_id) : undefined;
      const category = db.getCategoryById(c.category_id);
      const isOverdue = c.sla_due_at && c.status !== 'Resolved' && c.status !== 'Closed' && new Date(c.sla_due_at) < new Date();

      return {
        ...c,
        category,
        studentName: student ? student.full_name : 'Unknown Student',
        studentRegNo: profile ? profile.registration_number : 'N/A',
        studentLevel: profile ? profile.level : c.level,
        handlerName: handler ? handler.full_name : 'Unassigned',
        isOverdue
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve department complaints.' });
  }
});

// 2. Assign Complaint
router.post('/complaints/:id/assign', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'reviewer') {
      res.status(403).json({ success: false, error: 'Reviewer role has read-only permissions.' });
      return;
    }

    const { assigned_to_id, reason } = req.body;
    if (!assigned_to_id) {
      res.status(400).json({ success: false, error: 'Target handler ID is required.' });
      return;
    }

    const complaint = db.assignComplaint(req.params.id, assigned_to_id, user.id, reason);

    db.createAuditLog({
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      action: 'COMPLAINT_ASSIGNED',
      entity_type: 'complaint',
      entity_id: complaint.id,
      details: { assigned_to_id, reason },
      ip_address: req.ip
    });

    res.json({ success: true, message: 'Complaint assigned successfully.', data: complaint });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3. Update Status
router.post('/complaints/:id/status', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'reviewer') {
      res.status(403).json({ success: false, error: 'Reviewer role has read-only permissions.' });
      return;
    }

    const { status, comment, is_visible_to_student } = req.body;
    if (!status) {
      res.status(400).json({ success: false, error: 'New status is required.' });
      return;
    }

    const complaint = db.updateComplaintStatus(
      req.params.id,
      status as ComplaintStatus,
      user.id,
      comment,
      is_visible_to_student !== undefined ? is_visible_to_student : true
    );

    db.createAuditLog({
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      action: 'STATUS_UPDATED',
      entity_type: 'complaint',
      entity_id: complaint.id,
      details: { new_status: status, comment },
      ip_address: req.ip
    });

    res.json({ success: true, message: `Status updated to ${status}.`, data: complaint });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. Escalate Complaint
router.post('/complaints/:id/escalate', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'reviewer') {
      res.status(403).json({ success: false, error: 'Reviewer role has read-only permissions.' });
      return;
    }

    const { escalated_to_id, reason } = req.body;
    if (!reason || reason.trim().length < 5) {
      res.status(400).json({ success: false, error: 'A clear justification for escalation is required.' });
      return;
    }

    // Default target to HOD if not specified
    let targetId = escalated_to_id;
    if (!targetId) {
      const hod = db.listUsers('hod')[0];
      targetId = hod ? hod.id : user.id;
    }

    const complaint = db.escalateComplaint(req.params.id, targetId, reason.trim(), user.id);

    db.createAuditLog({
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      action: 'COMPLAINT_ESCALATED',
      entity_type: 'complaint',
      entity_id: complaint.id,
      details: { escalated_to_id: targetId, reason },
      ip_address: req.ip
    });

    res.json({ success: true, message: 'Complaint successfully escalated to Head of Department.', data: complaint });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Propose or Complete Resolution
router.post('/complaints/:id/resolve', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'reviewer') {
      res.status(403).json({ success: false, error: 'Reviewer role has read-only permissions.' });
      return;
    }

    const { resolution_summary, resolution_action_taken, as_proposed_only } = req.body;

    if (!resolution_summary || resolution_summary.trim().length < 10) {
      res.status(400).json({ success: false, error: 'A resolution summary of at least 10 characters is required.' });
      return;
    }

    const complaint = db.resolveComplaint(req.params.id, {
      resolution_summary: resolution_summary.trim(),
      resolution_action_taken: resolution_action_taken?.trim(),
      resolved_by_id: user.id,
      asProposedOnly: as_proposed_only === true
    });

    db.createAuditLog({
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      action: as_proposed_only ? 'RESOLUTION_PROPOSED' : 'COMPLAINT_RESOLVED',
      entity_type: 'complaint',
      entity_id: complaint.id,
      details: { resolution_summary },
      ip_address: req.ip
    });

    res.json({
      success: true,
      message: as_proposed_only ? 'Resolution proposed for review.' : 'Complaint resolved successfully.',
      data: complaint
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Close Complaint (HOD / Admin / Officer)
router.post('/complaints/:id/close', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'reviewer') {
      res.status(403).json({ success: false, error: 'Reviewer role has read-only permissions.' });
      return;
    }

    const { comment } = req.body;
    const complaint = db.closeComplaint(req.params.id, user.id, comment);

    db.createAuditLog({
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      action: 'COMPLAINT_CLOSED',
      entity_type: 'complaint',
      entity_id: complaint.id,
      details: { comment },
      ip_address: req.ip
    });

    res.json({ success: true, message: 'Complaint formally closed.', data: complaint });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 7. Add Internal Note (Confidential Staff-Only Investigation Note)
router.post('/complaints/:id/internal-notes', (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role === 'reviewer') {
      res.status(403).json({ success: false, error: 'Reviewer role has read-only permissions.' });
      return;
    }

    const { note, action_required } = req.body;
    if (!note || note.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Internal note text cannot be blank.' });
      return;
    }

    const complaint = db.getComplaintById(req.params.id);
    if (!complaint) {
      res.status(404).json({ success: false, error: 'Complaint not found.' });
      return;
    }

    const internalNote = db.addInternalNote({
      complaint_id: complaint.id,
      author_id: user.id,
      note,
      action_required
    });

    db.createAuditLog({
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      action: 'INTERNAL_NOTE_RECORDED',
      entity_type: 'complaint',
      entity_id: complaint.id,
      details: { note_id: internalNote.id },
      ip_address: req.ip
    });

    res.status(201).json({ success: true, data: internalNote });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. List Staff Handlers
router.get('/handlers', (_req: AuthenticatedRequest, res: Response) => {
  const officers = db.listUsers('officer');
  const hods = db.listUsers('hod');
  const allHandlers = [...officers, ...hods].map((u) => ({
    id: u.id,
    name: u.full_name,
    email: u.email,
    role: u.role,
    phone: u.phone
  }));

  res.json({ success: true, data: allHandlers });
});

export default router;
