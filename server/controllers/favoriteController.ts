import type { Response } from 'express';
import { repo } from '../db/repository.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';

export async function listFavorites(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const favorites = await repo.listFavoritesByUser(req.user!._id);
    res.json({ favorites });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function createFavorite(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    if (!name || !body.base) {
      res.status(400).json({ message: 'Custom salad name and base ingredient are required.' });
      return;
    }

    const favorite = await repo.createFavorite({
      user: req.user!._id,
      name,
      base: body.base,
      toppings: Array.isArray(body.toppings) ? body.toppings : [],
      protein: body.protein || null,
      dressing: body.dressing || null,
      totalPrice: Number(body.totalPrice) || 0,
      totalCalories: Number(body.totalCalories) || 0,
      totalProtein: Number(body.totalProtein) || 0,
      totalCarbs: Number(body.totalCarbs) || 0,
      totalFat: Number(body.totalFat) || 0,
    });
    res.status(201).json({ favorite });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function deleteFavorite(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const deleted = await repo.deleteFavorite(req.params.id, req.user!._id);
    if (!deleted) {
      res.status(404).json({ message: 'Favorite bowl not found.' });
      return;
    }
    res.json({ message: 'Removed from favorites.' });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}
