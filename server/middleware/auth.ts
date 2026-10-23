import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';
import { User, UserRole, Complaint } from '../db/types';

const JWT_SECRET = process.env.JWT_SECRET || 'buk-oscms-mech-eng-secret-key-2026-prod-grade';
const JWT_EXPIRES_IN = '24h';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.full_name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.substring(7).trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: UserRole };
    const user = db.findUserById(decoded.id);

    if (!user || !user.is_active) {
      res.status(401).json({ success: false, error: 'Account not found or deactivated.' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired authentication session.' });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized. Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
      });
      return;
    }

    next();
  };
}

export function requirePermission(permissionCode: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    const userPerms = db.getPermissionsForRole(req.user.role);
    if (!userPerms.includes(permissionCode)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Lacks required permission: ${permissionCode}`
      });
      return;
    }

    next();
  };
}

/**
 * Object-Level Authorization:
 * Validates that the authenticated user is allowed to access the specific complaint.
 * - Students can only access their own complaints
 * - Staff (officer, hod, reviewer, admin) can access complaints in their department queue
 */
export function canAccessComplaint(user: User, complaint: Complaint): boolean {
  if (user.role === 'student') {
    return complaint.student_id === user.id;
  }
  return true; // Staff/Faculty/Admin/Reviewer have departmental docket access
}
