import type { Request, Response } from 'express';
import { repo } from '../db/repository.ts';
import type { DietType, IngredientCategory } from '../types.ts';

const VALID_DIETS: DietType[] = ['Vegan', 'Keto', 'Low-Carb', 'High-Protein', 'Weight Loss'];
const VALID_CATEGORIES: IngredientCategory[] = ['base', 'topping', 'protein', 'dressing'];

export async function listSalads(req: Request, res: Response): Promise<void> {
  try {
    const includeOut = req.query.includeOutOfStock === 'true';
    const salads = await repo.listSalads(includeOut);
    res.json({ salads });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function createSalad(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const description = String(body.description || '').trim();
    const dietType = body.dietType as DietType;

    if (!name || !description || !VALID_DIETS.includes(dietType)) {
      res.status(400).json({ message: 'Valid salad name, description, and diet type are required.' });
      return;
    }

    const salad = await repo.createSalad({
      name,
      description,
      dietType,
      image: String(body.image || '/src/assets/images/salad_mediterranean_quinoa_1794716158637.jpg'),
      calories: Math.max(0, Number(body.calories) || 0),
      protein: Math.max(0, Number(body.protein) || 0),
      carbs: Math.max(0, Number(body.carbs) || 0),
      fat: Math.max(0, Number(body.fat) || 0),
      price: Math.max(0, Number(body.price) || 0),
      ingredientsList: Array.isArray(body.ingredientsList) ? body.ingredientsList : [],
      inStock: body.inStock ?? true,
      featured: body.featured ?? false,
    });
    res.status(201).json({ salad });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function updateSalad(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body || {};
    const patch: Record<string, any> = {};
    if (body.name !== undefined) patch.name = String(body.name).trim();
    if (body.description !== undefined) patch.description = String(body.description).trim();
    if (body.dietType !== undefined && VALID_DIETS.includes(body.dietType)) patch.dietType = body.dietType;
    if (body.image !== undefined) patch.image = String(body.image);
    if (body.calories !== undefined) patch.calories = Math.max(0, Number(body.calories));
    if (body.protein !== undefined) patch.protein = Math.max(0, Number(body.protein));
    if (body.carbs !== undefined) patch.carbs = Math.max(0, Number(body.carbs));
    if (body.fat !== undefined) patch.fat = Math.max(0, Number(body.fat));
    if (body.price !== undefined) patch.price = Math.max(0, Number(body.price));
    if (body.ingredientsList !== undefined) patch.ingredientsList = body.ingredientsList;
    if (body.inStock !== undefined) patch.inStock = Boolean(body.inStock);
    if (body.featured !== undefined) patch.featured = Boolean(body.featured);

    const salad = await repo.updateSalad(req.params.id, patch);
    if (!salad) {
      res.status(404).json({ message: 'Salad not found.' });
      return;
    }
    res.json({ salad });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function deleteSalad(req: Request, res: Response): Promise<void> {
  try {
    const deleted = await repo.deleteSalad(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'Salad not found.' });
      return;
    }
    res.json({ message: 'Salad deleted.' });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function listIngredients(req: Request, res: Response): Promise<void> {
  try {
    const includeOut = req.query.includeOutOfStock === 'true';
    const ingredients = await repo.listIngredients(includeOut);
    res.json({ ingredients });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function createIngredient(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const category = body.category as IngredientCategory;

    if (!name || !VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ message: 'Valid ingredient name and category are required.' });
      return;
    }

    const ingredient = await repo.createIngredient({
      name,
      category,
      subCategory: String(body.subCategory || 'general').trim(),
      price: Math.max(0, Number(body.price) || 0),
      calories: Math.max(0, Number(body.calories) || 0),
      protein: Math.max(0, Number(body.protein) || 0),
      carbs: Math.max(0, Number(body.carbs) || 0),
      fat: Math.max(0, Number(body.fat) || 0),
      inStock: body.inStock ?? true,
      dietTags: Array.isArray(body.dietTags) ? body.dietTags : [],
    });
    res.status(201).json({ ingredient });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function updateIngredient(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body || {};
    const patch: Record<string, any> = {};
    if (body.name !== undefined) patch.name = String(body.name).trim();
    if (body.category !== undefined && VALID_CATEGORIES.includes(body.category)) patch.category = body.category;
    if (body.subCategory !== undefined) patch.subCategory = String(body.subCategory).trim();
    if (body.price !== undefined) patch.price = Math.max(0, Number(body.price));
    if (body.calories !== undefined) patch.calories = Math.max(0, Number(body.calories));
    if (body.protein !== undefined) patch.protein = Math.max(0, Number(body.protein));
    if (body.carbs !== undefined) patch.carbs = Math.max(0, Number(body.carbs));
    if (body.fat !== undefined) patch.fat = Math.max(0, Number(body.fat));
    if (body.inStock !== undefined) patch.inStock = Boolean(body.inStock);
    if (body.dietTags !== undefined) patch.dietTags = body.dietTags;

    const ingredient = await repo.updateIngredient(req.params.id, patch);
    if (!ingredient) {
      res.status(404).json({ message: 'Ingredient not found.' });
      return;
    }
    res.json({ ingredient });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function deleteIngredient(req: Request, res: Response): Promise<void> {
  try {
    const deleted = await repo.deleteIngredient(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'Ingredient not found.' });
      return;
    }
    res.json({ message: 'Ingredient deleted.' });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function listPlans(req: Request, res: Response): Promise<void> {
  try {
    const all = req.query.all === 'true';
    const plans = await repo.listPlans(all);
    res.json({ plans });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function createPlan(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const price = Number(body.price);
    const durationDays = Number(body.durationDays);
    const saladsIncluded = Number(body.saladsIncluded);

    if (!name || Number.isNaN(price) || price < 0 || Number.isNaN(durationDays) || durationDays <= 0) {
      res.status(400).json({ message: 'Valid plan name, price, and duration are required.' });
      return;
    }

    const plan = await repo.createPlan({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      price,
      durationDays,
      durationLabel: String(body.durationLabel || `${durationDays} Days`).trim(),
      saladsIncluded: Math.max(1, saladsIncluded || 1),
      cadenceLabel: String(body.cadenceLabel || `${saladsIncluded} salads`).trim(),
      benefits: Array.isArray(body.benefits) ? body.benefits : [],
      isActive: body.isActive ?? true,
    });
    res.status(201).json({ plan });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function updatePlan(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body || {};
    const patch: Record<string, any> = {};
    if (body.name !== undefined) patch.name = String(body.name).trim();
    if (body.price !== undefined) patch.price = Math.max(0, Number(body.price));
    if (body.durationDays !== undefined) patch.durationDays = Math.max(1, Number(body.durationDays));
    if (body.durationLabel !== undefined) patch.durationLabel = String(body.durationLabel).trim();
    if (body.saladsIncluded !== undefined) patch.saladsIncluded = Math.max(1, Number(body.saladsIncluded));
    if (body.cadenceLabel !== undefined) patch.cadenceLabel = String(body.cadenceLabel).trim();
    if (body.benefits !== undefined) patch.benefits = body.benefits;
    if (body.isActive !== undefined) patch.isActive = Boolean(body.isActive);

    const plan = await repo.updatePlan(req.params.id, patch);
    if (!plan) {
      res.status(404).json({ message: 'Plan not found.' });
      return;
    }
    res.json({ plan });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function deletePlan(req: Request, res: Response): Promise<void> {
  try {
    const deleted = await repo.deletePlan(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: 'Plan not found.' });
      return;
    }
    res.json({ message: 'Membership plan deleted.' });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}
