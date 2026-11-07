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

function readHeaderString(val: string | string[] | undefined, maxLen = 80): string {
  if (typeof val === 'string' && val.trim().length > 0) {
    return val.trim().slice(0, maxLen);
  }
  return '';
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
    req.actorClass = readHeaderString(req.headers['x-student-class'], 60);
    req.actorSchool = readHeaderString(req.headers['x-school-college'], 100);
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
  const studentClass = readHeaderString(req.headers['x-student-class'], 60);
  const schoolCollege = readHeaderString(req.headers['x-school-college'], 100);
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
        readHeaderString(req.headers['x-guest-name'], 50) ||
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
  const guestNameHeader = req.headers['x-guest-name'];
  const rawGuestUid =
    typeof guestUidHeader === 'string' && guestUidHeader.trim().length >= 6
      ? guestUidHeader.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
      : 'guest_default_player';
  const rawGuestName =
    typeof guestNameHeader === 'string' && guestNameHeader.trim().length >= 2
      ? guestNameHeader.trim().slice(0, 50)
      : 'Student Challenger';

  req.actorUid = rawGuestUid.startsWith('guest_') ? rawGuestUid : `guest_${rawGuestUid}`;
  req.actorEmail = '';
  req.actorName = rawGuestName;
  req.isGuest = true;
  next();
};
