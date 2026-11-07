import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  actorUid?: string;
  actorEmail?: string;
  actorName?: string;
  actorClass?: string;
  actorSchool?: string;
  isGuest?: boolean;
}

function readIdentityHeader(req: Request, name: string, maxLen = 80): string {
  const raw = req.get(name) || '';
  let value = raw;
  if (req.get('X-Student-Identity-Encoding') === 'uri') {
    try {
      value = decodeURIComponent(raw);
    } catch {
      return '';
    }
  }
  return value.trim().slice(0, maxLen);
}

export function isQuestionBankAdmin(req: AuthRequest): boolean {
  const email = req.user?.email?.toLowerCase();
  const adminEmails = (process.env.ADMIN_EMAILS || 'samridhsuresh@gmail.com')
    .split(',')
    .map((value) => value.trim().toLowerCase());
  return Boolean(req.user?.email_verified && email && adminEmails.includes(email));
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    req.actorUid = decodedToken.uid;
    req.actorEmail = decodedToken.email || '';
    req.actorName = decodedToken.name || decodedToken.email?.split('@')[0] || 'Arena Player';
    req.actorClass = readIdentityHeader(req, 'x-student-class', 60);
    req.actorSchool = readIdentityHeader(req, 'x-school-college', 100);
    req.isGuest = false;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const resolveActor = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const studentClass = readIdentityHeader(req, 'x-student-class', 60);
  const schoolCollege = readIdentityHeader(req, 'x-school-college', 100);
  req.actorClass = studentClass;
  req.actorSchool = schoolCollege;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = decodedToken;
      req.actorUid = decodedToken.uid;
      req.actorEmail = decodedToken.email || '';
      req.actorName =
        readIdentityHeader(req, 'x-guest-name', 50) ||
        decodedToken.name ||
        decodedToken.email?.split('@')[0] ||
        'Student Challenger';
      req.isGuest = false;
      return next();
    } catch {
      // Fallback to student session if token expired/invalid on optional endpoints
    }
  }

  const guestUidHeader = req.headers['x-guest-uid'];
  const rawGuestUid =
    typeof guestUidHeader === 'string' && guestUidHeader.trim().length >= 6
      ? guestUidHeader.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
      : 'guest_default_player';
  const rawGuestName = readIdentityHeader(req, 'X-Guest-Name', 50) || 'Student Challenger';

  req.actorUid = rawGuestUid.startsWith('guest_') ? rawGuestUid : `guest_${rawGuestUid}`;
  req.actorEmail = '';
  req.actorName = rawGuestName;
  req.isGuest = true;
  next();
};
