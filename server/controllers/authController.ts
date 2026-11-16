import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import { repo } from '../db/repository.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import type { UserRecord } from '../types.ts';

function signToken(user: UserRecord): string {
  return jwt.sign({ sub: user._id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const phone = String(req.body?.phone || '').trim();
    const address = String(req.body?.address || '').trim();

    if (!name || !email || !email.includes('@') || password.length < 6) {
      res.status(400).json({ message: 'Valid name, email, and 6+ character password are required.' });
      return;
    }

    const existing = await repo.findUserByEmail(email);
    if (existing) {
      res.status(409).json({ message: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await repo.createUser({
      name,
      email,
      passwordHash,
      role: 'member',
      phone,
      address,
    });

    res.status(201).json({
      token: signToken(newUser),
      user: await repo.sanitizeUserRecord(newUser),
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message || 'Registration failed.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const found = await repo.findUserByEmail(email);
    if (!found) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const valid = await bcrypt.compare(password, found.passwordHash);
    if (!valid) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    if (found.status === 'inactive') {
      res.status(403).json({ message: 'This account has been deactivated. Contact support or an administrator.' });
      return;
    }

    res.json({
      token: signToken(found),
      user: await repo.sanitizeUserRecord(found),
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message || 'Sign in failed.' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }
    res.json({ user: await repo.sanitizeUserRecord(req.user) });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message || 'Failed to load profile.' });
  }
}
