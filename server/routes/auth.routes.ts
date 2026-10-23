import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db/database';
import { authenticate, generateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Registration schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(3, 'Full name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  registration_number: z.string().min(5, 'Student registration number is required (e.g. UG20/ENG/MEC/1042)'),
  level: z.enum(['100L', '200L', '300L', '400L', '500L']),
  academic_session: z.string().default('2025/2026')
});

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// 1. Register Student
router.post('/register', async (req, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.format()
      });
      return;
    }

    const { email, password, full_name, phone, registration_number, level, academic_session } = parseResult.data;

    // Check existing email
    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
      return;
    }

    // Check existing registration number
    const existingReg = db.getStudentProfileByRegNo(registration_number);
    if (existingReg) {
      res.status(409).json({
        success: false,
        error: `Registration number "${registration_number}" is already associated with an account.`
      });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = db.createUser({
      email: email.toLowerCase().trim(),
      password_hash,
      role: 'student',
      full_name: full_name.trim(),
      phone: phone.trim(),
      is_active: true
    });

    const newProfile = db.createStudentProfile({
      user_id: newUser.id,
      registration_number: registration_number.trim().toUpperCase(),
      level,
      academic_session,
      department: 'Department of Mechanical Engineering',
      faculty: 'Faculty of Engineering',
      entry_year: `20${registration_number.substring(2, 4) || '22'}`
    });

    db.createAuditLog({
      user_id: newUser.id,
      user_email: newUser.email,
      user_role: newUser.role,
      action: 'USER_REGISTERED',
      entity_type: 'user',
      entity_id: newUser.id,
      details: { registration_number: newProfile.registration_number, level },
      ip_address: req.ip
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          full_name: newUser.full_name,
          phone: newUser.phone
        },
        profile: newProfile
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: err.message || 'Registration failed.' });
  }
});

// 2. Login
router.post('/login', async (req, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: 'Please enter a valid email and password.' });
      return;
    }

    const { email, password } = parseResult.data;
    const user = db.findUserByEmail(email);

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password credentials.' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ success: false, error: 'Your account has been deactivated. Contact the departmental administrator.' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      db.createAuditLog({
        user_id: user.id,
        user_email: user.email,
        user_role: user.role,
        action: 'FAILED_LOGIN_ATTEMPT',
        entity_type: 'auth',
        entity_id: user.id,
        ip_address: req.ip
      });
      res.status(401).json({ success: false, error: 'Invalid email or password credentials.' });
      return;
    }

    db.createAuditLog({
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      action: 'USER_LOGIN',
      entity_type: 'auth',
      entity_id: user.id,
      ip_address: req.ip
    });

    const token = generateToken(user);
    const profile = user.role === 'student' ? db.getStudentProfileByUserId(user.id) : undefined;
    const permissions = db.getPermissionsForRole(user.role);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name,
          phone: user.phone
        },
        profile,
        permissions
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Login process encountered an error.' });
  }
});

// 3. Current User Session
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const profile = user.role === 'student' ? db.getStudentProfileByUserId(user.id) : undefined;
  const permissions = db.getPermissionsForRole(user.role);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone
      },
      profile,
      permissions
    }
  });
});

// 4. Logout
router.post('/logout', authenticate, (req: AuthenticatedRequest, res: Response) => {
  db.createAuditLog({
    user_id: req.user!.id,
    user_email: req.user!.email,
    user_role: req.user!.role,
    action: 'USER_LOGOUT',
    entity_type: 'auth',
    entity_id: req.user!.id,
    ip_address: req.ip
  });

  res.json({ success: true, message: 'Logged out successfully.' });
});

// 5. Password Reset Request
router.post('/forgot-password', (req, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, error: 'Email address is required.' });
    return;
  }

  const user = db.findUserByEmail(email);
  if (user) {
    db.createAuditLog({
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      action: 'PASSWORD_RESET_REQUESTED',
      entity_type: 'user',
      entity_id: user.id,
      ip_address: req.ip
    });
  }

  // Consistent generic response preventing user enumeration
  res.json({
    success: true,
    message: 'If an account matches that email address, departmental password reset instructions have been dispatched.'
  });
});

// 6. Demo Accounts List (for one-click evaluator login)
router.get('/demo-accounts', (_req, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        role: 'student',
        roleTitle: 'Undergraduate Student',
        email: 'aminu.k@buk.edu.ng',
        name: 'Aminu Kabir (500L, Mech Eng)',
        regNo: 'UG20/ENG/MEC/1042',
        password: 'Password@123'
      },
      {
        role: 'officer',
        roleTitle: 'Department Complaint Officer',
        email: 'officer@buk.edu.ng',
        name: 'Dr. Mustapha Bello (Exam/Complaint Officer)',
        regNo: 'Staff ID: BUK/ENG/MECH/042',
        password: 'Password@123'
      },
      {
        role: 'hod',
        roleTitle: 'Head of Department (HOD)',
        email: 'hod.mech@buk.edu.ng',
        name: 'Prof. A. S. Garba (Head, Mechanical Engineering)',
        regNo: 'Staff ID: BUK/ENG/MECH/001',
        password: 'Password@123'
      },
      {
        role: 'admin',
        roleTitle: 'System Administrator',
        email: 'admin@buk.edu.ng',
        name: 'Engr. Ibrahim Danbatta (IT Admin)',
        regNo: 'Admin Staff',
        password: 'Password@123'
      },
      {
        role: 'reviewer',
        roleTitle: 'Auditor / Quality Assurance Reviewer',
        email: 'auditor@buk.edu.ng',
        name: 'Engr. K. Aliyu (Faculty QA Rep)',
        regNo: 'Faculty Quality Board',
        password: 'Password@123'
      }
    ]
  });
});

export default router;
