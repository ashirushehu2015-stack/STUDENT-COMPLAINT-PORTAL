import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Only admin allowed for admin management routes
router.use(authenticate, requireRole(['admin']));

// 1. List Users
router.get('/users', (_req: AuthenticatedRequest, res: Response) => {
  const users = db.listUsers();
  const safeUsers = users.map((u) => {
    const profile = u.role === 'student' ? db.getStudentProfileByUserId(u.id) : undefined;
    return {
      id: u.id,
      email: u.email,
      role: u.role,
      full_name: u.full_name,
      phone: u.phone,
      is_active: u.is_active,
      created_at: u.created_at,
      profile
    };
  });
  res.json({ success: true, data: safeUsers });
});

// 2. Create User (Staff or Student)
router.post('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, role, full_name, phone, registration_number, level } = req.body;

    if (!email || !password || !role || !full_name) {
      res.status(400).json({ success: false, error: 'Email, password, role, and full name are required.' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = db.createUser({
      email: email.toLowerCase().trim(),
      password_hash,
      role,
      full_name: full_name.trim(),
      phone: phone?.trim() || '',
      is_active: true
    });

    let profile;
    if (role === 'student' && registration_number) {
      profile = db.createStudentProfile({
        user_id: user.id,
        registration_number: registration_number.trim().toUpperCase(),
        level: level || '500L',
        academic_session: '2025/2026',
        department: 'Department of Mechanical Engineering',
        faculty: 'Faculty of Engineering',
        entry_year: '2022'
      });
    }

    db.createAuditLog({
      user_id: req.user!.id,
      user_email: req.user!.email,
      user_role: req.user!.role,
      action: 'ADMIN_CREATED_USER',
      entity_type: 'user',
      entity_id: user.id,
      details: { role, email: user.email },
      ip_address: req.ip
    });

    res.status(201).json({ success: true, data: { user, profile } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3. Update User Status / Role
router.patch('/users/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, is_active, full_name, phone } = req.body;
    const updated = db.updateUser(req.params.id, { role, is_active, full_name, phone });

    db.createAuditLog({
      user_id: req.user!.id,
      user_email: req.user!.email,
      user_role: req.user!.role,
      action: 'ADMIN_UPDATED_USER',
      entity_type: 'user',
      entity_id: updated.id,
      details: { role, is_active },
      ip_address: req.ip
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. List Categories (All, including inactive)
router.get('/categories', (_req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: db.listCategories(true) });
});

// 5. Create Category
router.post('/categories', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, code, description, default_priority, sla_hours } = req.body;
    if (!name || !code) {
      res.status(400).json({ success: false, error: 'Category name and unique code are required.' });
      return;
    }

    const cat = db.createCategory({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description || '',
      default_priority: default_priority || 'Normal',
      sla_hours: Number(sla_hours) || 72,
      is_active: true
    });

    db.createAuditLog({
      user_id: req.user!.id,
      user_email: req.user!.email,
      user_role: req.user!.role,
      action: 'CATEGORY_CREATED',
      entity_type: 'category',
      entity_id: cat.id,
      details: { name: cat.name, code: cat.code },
      ip_address: req.ip
    });

    res.status(201).json({ success: true, data: cat });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Update Category
router.patch('/categories/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = db.updateCategory(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 7. System Settings
router.get('/settings', (_req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: db.getSettings() });
});

router.patch('/settings', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      res.status(400).json({ success: false, error: 'Key and value are required.' });
      return;
    }

    const setting = db.updateSetting(key, String(value));

    db.createAuditLog({
      user_id: req.user!.id,
      user_email: req.user!.email,
      user_role: req.user!.role,
      action: 'SETTING_UPDATED',
      entity_type: 'setting',
      entity_id: setting.id,
      details: { key, value },
      ip_address: req.ip
    });

    res.json({ success: true, data: setting });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 8. Audit Logs
router.get('/audit-logs', (_req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: db.listAuditLogs(150) });
});

// 9. Reset to Initial Seed Data
router.post('/reset-demo', (req: AuthenticatedRequest, res: Response) => {
  db.resetToSeed();
  db.createAuditLog({
    user_id: req.user!.id,
    user_email: req.user!.email,
    user_role: req.user!.role,
    action: 'DEMO_DATA_RESET',
    entity_type: 'system',
    entity_id: 'db',
    ip_address: req.ip
  });
  res.json({ success: true, message: 'Database reset to initial sample demonstration state.' });
});

export default router;
