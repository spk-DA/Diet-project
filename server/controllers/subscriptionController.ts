import type { Response } from 'express';
import { repo } from '../db/repository.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';

export async function getMySubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const subscription = await repo.getLatestSubscriptionByUser(req.user!._id);
    res.json({ subscription });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function createOrUpdateSubscription(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const body = req.body || {};
    const planId = String(body.planId || '');
    const deliveryAddress = String(body.deliveryAddress || '').trim();
    const deliveryDays = Array.isArray(body.deliveryDays) ? body.deliveryDays : [];

    if (!planId || !deliveryAddress || deliveryDays.length === 0) {
      res.status(400).json({ message: 'Plan, delivery days, and delivery address are required.' });
      return;
    }

    const plan = await repo.findPlanById(planId);
    if (!plan) {
      res.status(404).json({ message: 'Selected membership plan not found.' });
      return;
    }

    const subscription = await repo.createOrReplaceSubscription({
      userId: req.user!._id,
      plan,
      frequency: body.frequency === '1_per_day' ? '1_per_day' : '5_per_week',
      deliveryDays,
      timeSlot: String(body.timeSlot || '12:00 PM - 1:00 PM'),
      deliveryAddress,
      preferredSaladId: body.preferredSaladId || null,
      customSalad: body.customSalad || null,
    });

    res.status(201).json({ subscription });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function patchSubscriptionStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const action = req.params.action;
    if (action !== 'pause' && action !== 'resume' && action !== 'cancel') {
      res.status(400).json({ message: 'Invalid subscription action.' });
      return;
    }

    const nextStatus = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'cancelled';
    const subscription = await repo.patchLatestSubscriptionStatus(req.user!._id, nextStatus);
    if (!subscription) {
      res.status(404).json({ message: 'No subscription found.' });
      return;
    }
    res.json({ subscription });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}
