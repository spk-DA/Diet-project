import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import { repo } from '../db/repository.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import type { OrderStatus } from '../types.ts';

export async function listMembers(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const members = await repo.listMembers();
    res.json({ members });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function createMember(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || 'Member123!');

    if (!name || !email || password.length < 6) {
      res.status(400).json({ message: 'Name, valid email, and 6+ character password are required.' });
      return;
    }

    const existing = await repo.findUserByEmail(email);
    if (existing) {
      res.status(409).json({ message: 'A member with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await repo.createUser({
      name,
      email,
      passwordHash,
      role: 'member',
      phone: String(body.phone || '').trim(),
      address: String(body.address || '').trim(),
      membershipPlan: body.membershipPlan || null,
      joinedDate: body.startDate ? new Date(body.startDate).toISOString() : new Date().toISOString(),
    });

    res.status(201).json({ member: await repo.sanitizeUserRecord(created) });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function updateMember(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const body = req.body || {};
    const patch: Record<string, any> = {};
    if (body.name !== undefined) patch.name = String(body.name).trim();
    if (body.email !== undefined) patch.email = String(body.email).trim().toLowerCase();
    if (body.phone !== undefined) patch.phone = String(body.phone).trim();
    if (body.address !== undefined) patch.address = String(body.address).trim();
    if (body.membershipPlan !== undefined) patch.membershipPlan = body.membershipPlan || null;
    if (body.status === 'active' || body.status === 'inactive') patch.status = body.status;
    if (body.joinedDate !== undefined) patch.joinedDate = new Date(body.joinedDate).toISOString();

    const member = await repo.updateMember(req.params.id, patch);
    if (!member) {
      res.status(404).json({ message: 'Member not found.' });
      return;
    }
    res.json({ member });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function deleteOrDeactivateMember(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const mode = String(req.query.mode || 'delete');
    if (mode === 'deactivate') {
      const member = await repo.toggleMemberStatus(req.params.id);
      if (!member) {
        res.status(404).json({ message: 'Member not found.' });
        return;
      }
      res.json({
        message: `Member status updated to ${member.status}.`,
        member,
      });
      return;
    }

    const deleted = await repo.deleteMember(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'Member not found.' });
      return;
    }
    res.json({ message: 'Member permanently removed.' });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function getAdminStats(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [members, activeSubs, orders, salads, ingredients] = await Promise.all([
      repo.listMembers(),
      repo.listActiveSubscriptions(),
      repo.listAllOrders(),
      repo.listSalads(true),
      repo.listIngredients(true),
    ]);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todaysOrders = orders.filter((o) => new Date(o.createdAt) >= startOfToday).length;

    const orderRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const subscriptionRevenue = activeSubs.reduce((sum, sub) => sum + (sub.plan?.price || 0), 0);

    const statusCounts: Record<OrderStatus, number> = {
      Placed: 0,
      Preparing: 0,
      'Out for Delivery': 0,
      Delivered: 0,
    };
    orders.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    res.json({
      stats: {
        totalMembers: members.length,
        activeMembers: members.filter((m) => m.status === 'active').length,
        activeSubscriptions: activeSubs.length,
        todaysOrders,
        totalOrders: orders.length,
        totalRevenue: Number((orderRevenue + subscriptionRevenue).toFixed(2)),
        orderRevenue: Number(orderRevenue.toFixed(2)),
        subscriptionRevenue: Number(subscriptionRevenue.toFixed(2)),
        totalSalads: salads.length,
        totalIngredients: ingredients.length,
        statusCounts,
      },
      recentOrders: orders.slice(0, 6),
    });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}
