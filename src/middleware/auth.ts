import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    name?: string;
    picture?: string;
    role?: string;
  };
}

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ success: false, message: 'Admin authentication is not configured' });
  }

  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, secret) as { email: string; role: string };
    if (payload.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    req.user = { uid: 'admin_anwar', email: payload.email, role: 'admin' };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};
