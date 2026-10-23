import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/database';
import { authenticate, AuthenticatedRequest, canAccessComplaint } from '../middleware/auth';

const router = Router();

// Create complaint schema
const createComplaintSchema = z.object({
  category_id: z.string().min(1, 'Please select a complaint category'),
  title: z.string().min(5, 'Complaint title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Please provide a clear description of at least 20 characters'),
  course_code: z.string().optional(),
  level: z.string().default('500L'),
  semester: z.enum(['First Semester', 'Second Semester']),
  academic_session: z.string().default('2025/2026'),
  requested_outcome: z.string().optional()
});

// 1. Get Categories (Public/Authenticated)
router.get('/categories', (_req, res: Response) => {
  const categories = db.listCategories(false);
  res.json({ success: true, data: categories });
});

// 2. Submit New Complaint (Student)
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'student') {
      res.status(403).json({ success: false, error: 'Complaints can only be submitted by registered students.' });
      return;
    }

    const parseResult = createComplaintSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: 'Validation failed', details: parseResult.error.format() });
      return;
    }

    const profile = db.getStudentProfileByUserId(user.id);
    const complaint = db.createComplaint({
      ...parseResult.data,
      student_id: user.id,
      level: profile ? profile.level : parseResult.data.level,
      academic_session: profile ? profile.academic_session : parseResult.data.academic_session
    });

    db.createAuditLog({
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      action: 'COMPLAINT_SUBMITTED',
      entity_type: 'complaint',
      entity_id: complaint.id,
      details: { reference_no: complaint.reference_no, category_id: complaint.category_id, title: complaint.title },
      ip_address: req.ip
    });

    res.status(201).json({
      success: true,
      message: `Complaint submitted successfully with reference number ${complaint.reference_no}.`,
      data: complaint
    });
  } catch (err: any) {
    console.error('Submit complaint error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to submit complaint.' });
  }
});

// 3. Get Student's Own Complaints
router.get('/my', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const complaints = db.listComplaints({ student_id: user.id });

    // Enrich with category name
    const enriched = complaints.map((c) => ({
      ...c,
      category: db.getCategoryById(c.category_id)
    }));

    res.json({ success: true, data: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve complaints.' });
  }
});

// 4. Get Complaint Detail by ID or Reference
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const complaint = db.getComplaintById(req.params.id);

    if (!complaint) {
      res.status(404).json({ success: false, error: 'Complaint not found.' });
      return;
    }

    // Object-level authorization check
    if (!canAccessComplaint(user, complaint)) {
      res.status(403).json({ success: false, error: 'You are not authorized to access this complaint.' });
      return;
    }

    const isStaff = user.role !== 'student';
    const category = db.getCategoryById(complaint.category_id);
    const student = db.findUserById(complaint.student_id);
    const studentProfile = db.getStudentProfileByUserId(complaint.student_id);
    const handler = complaint.assigned_to_id ? db.findUserById(complaint.assigned_to_id) : undefined;
    const timeline = db.getStatusHistory(complaint.id, isStaff);
    const messages = db.getMessages(complaint.id, isStaff);
    const attachments = db.getAttachments(complaint.id, isStaff);
    // Strict internal notes segregation: Only provided if isStaff is true!
    const internalNotes = isStaff ? db.getInternalNotes(complaint.id) : [];

    res.json({
      success: true,
      data: {
        complaint,
        category,
        student: student
          ? {
              id: student.id,
              full_name: student.full_name,
              email: student.email,
              phone: student.phone,
              profile: studentProfile
            }
          : undefined,
        handler: handler
          ? {
              id: handler.id,
              full_name: handler.full_name,
              role: handler.role,
              email: handler.email
            }
          : undefined,
        timeline,
        messages,
        attachments,
        internalNotes
      }
    });
  } catch (err: any) {
    console.error('Get complaint detail error:', err);
    res.status(500).json({ success: false, error: 'Failed to load complaint details.' });
  }
});

// 5. Send Message / Follow-up
router.post('/:id/messages', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const complaint = db.getComplaintById(req.params.id);

    if (!complaint) {
      res.status(404).json({ success: false, error: 'Complaint not found.' });
      return;
    }

    if (!canAccessComplaint(user, complaint)) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    const { message, is_official_response, is_internal_note } = req.body;
    if (!message || message.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Message text cannot be empty.' });
      return;
    }

    const newMsg = db.addMessage({
      complaint_id: complaint.id,
      sender_id: user.id,
      message,
      is_official_response,
      is_internal_note
    });

    db.createAuditLog({
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      action: is_internal_note ? 'INTERNAL_NOTE_ADDED' : 'MESSAGE_SENT',
      entity_type: 'complaint',
      entity_id: complaint.id,
      details: { reference_no: complaint.reference_no, is_official: is_official_response },
      ip_address: req.ip
    });

    res.status(201).json({ success: true, data: newMsg });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to post message.' });
  }
});

// 6. Upload Attachment
router.post('/:id/attachments', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const complaint = db.getComplaintById(req.params.id);

    if (!complaint) {
      res.status(404).json({ success: false, error: 'Complaint not found.' });
      return;
    }

    if (!canAccessComplaint(user, complaint)) {
      res.status(403).json({ success: false, error: 'Access denied.' });
      return;
    }

    const { file_name, file_size, mime_type, file_data_url, access_level } = req.body;

    if (!file_name || !file_size) {
      res.status(400).json({ success: false, error: 'Attachment details missing.' });
      return;
    }

    // Size limit: 5MB max
    if (file_size > 5 * 1024 * 1024) {
      res.status(400).json({ success: false, error: 'Attachment file size exceeds 5MB limit.' });
      return;
    }

    // Allowed types: PDF, PNG, JPG, JPEG, DOCX
    const allowedMime = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (mime_type && !allowedMime.includes(mime_type.toLowerCase())) {
      res.status(400).json({ success: false, error: 'File type not allowed. Supported formats: PDF, PNG, JPG, DOCX.' });
      return;
    }

    const attachment = db.addAttachment({
      complaint_id: complaint.id,
      uploader_id: user.id,
      file_name,
      file_size,
      mime_type: mime_type || 'application/octet-stream',
      file_data_url,
      access_level: user.role === 'student' ? 'student_and_staff' : access_level
    });

    db.createAuditLog({
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      action: 'ATTACHMENT_UPLOADED',
      entity_type: 'complaint',
      entity_id: complaint.id,
      details: { file_name, file_size },
      ip_address: req.ip
    });

    res.status(201).json({ success: true, data: attachment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to upload attachment.' });
  }
});

// 7. Student Reopen Complaint
router.post('/:id/reopen', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      res.status(400).json({ success: false, error: 'A specific explanation of at least 10 characters is required to request reopening.' });
      return;
    }

    const reopened = db.reopenComplaint(req.params.id, user.id, reason.trim());

    db.createAuditLog({
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      action: 'COMPLAINT_REOPENED',
      entity_type: 'complaint',
      entity_id: reopened.id,
      details: { reason },
      ip_address: req.ip
    });

    res.json({ success: true, message: 'Complaint has been reopened for review.', data: reopened });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
