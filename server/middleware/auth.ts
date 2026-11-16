import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import { repo } from '../db/repository.ts';
import type { UserRecord } from '../types.ts';

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

interface JwtPayload {
  sub?: string;
  role?: string;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    if (!decoded?.sub) {
      res.status(401).json({ message: 'Invalid authentication token.' });
      return;
    }

    const user = await repo.findUserById(decoded.sub);
    if (!user) {
      res.status(401).json({ message: 'Account not found.' });
      return;
    }
    if (user.status === 'inactive') {
      res.status(403).json({ message: 'This account has been deactivated. Contact support or an administrator.' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Session expired or invalid token. Please sign in again.' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Admin permission required.' });
    return;
  }
  next();
}
