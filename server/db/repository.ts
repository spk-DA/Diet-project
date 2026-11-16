import bcrypt from 'bcryptjs';
import { getSupabaseClient } from './supabaseClient.ts';
import { getDB, populateSubscription, sanitizeUser, saveDB } from './store.ts';
import type {
  CustomSaladSpec,
  DietType,
  FavoriteRecord,
  IngredientCategory,
  IngredientRecord,
  OrderItemRecord,
  OrderRecord,
  OrderStatus,
  PlanRecord,
  PopulatedSubscription,
  Role,
  SaladRecord,
  SanitizedUser,
  SubscriptionRecord,
  UserRecord,
} from '../types.ts';

let supabaseReady = false;
let supabaseStatusReason = 'SUPABASE_SERVICE_ROLE_KEY not configured in environment';

/* -------------------------------------------------------------------------- */
/* Row Mappers (PostgreSQL snake_case <-> API camelCase with _id)             */
/* -------------------------------------------------------------------------- */

function mapPlan(row: Record<string, any>): PlanRecord {
  return {
    _id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    price: Number(row.price),
    durationDays: Number(row.duration_days),
    durationLabel: String(row.duration_label),
    saladsIncluded: Number(row.salads_included),
    cadenceLabel: String(row.cadence_label),
    benefits: Array.isArray(row.benefits) ? row.benefits : [],
    isActive: Boolean(row.is_active),
  };
}

function mapUser(row: Record<string, any>): UserRecord {
  return {
    _id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    role: row.role as Role,
    phone: String(row.phone || ''),
    address: String(row.address || ''),
    status: row.status === 'inactive' ? 'inactive' : 'active',
    membershipPlan: row.membership_plan_id ? String(row.membership_plan_id) : null,
    joinedDate: String(row.joined_date || row.created_at || new Date().toISOString()),
  };
}

function mapSalad(row: Record<string, any>): SaladRecord {
  return {
    _id: String(row.id),
    name: String(row.name),
    description: String(row.description),
    dietType: row.diet_type as DietType,
    image: String(row.image),
    calories: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
    price: Number(row.price),
    ingredientsList: Array.isArray(row.ingredients_list) ? row.ingredients_list : [],
    inStock: Boolean(row.in_stock),
    featured: Boolean(row.featured),
  };
}

function mapIngredient(row: Record<string, any>): IngredientRecord {
  return {
    _id: String(row.id),
    name: String(row.name),
    category: row.category as IngredientCategory,
    subCategory: String(row.sub_category || 'general'),
    price: Number(row.price),
    calories: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
    inStock: Boolean(row.in_stock),
    dietTags: Array.isArray(row.diet_tags) ? row.diet_tags : [],
  };
}

function mapFavorite(row: Record<string, any>): FavoriteRecord {
  return {
    _id: String(row.id),
    user: String(row.user_id),
    name: String(row.name),
    base: row.base,
    toppings: Array.isArray(row.toppings) ? row.toppings : [],
    protein: row.protein || null,
    dressing: row.dressing || null,
    totalPrice: Number(row.total_price),
    totalCalories: Number(row.total_calories),
    totalProtein: Number(row.total_protein),
    totalCarbs: Number(row.total_carbs),
    totalFat: Number(row.total_fat),
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function mapOrder(row: Record<string, any>): OrderRecord {
  const userObj = row.users
    ? {
        _id: String(row.users.id),
        name: String(row.users.name),
        email: String(row.users.email),
        phone: String(row.users.phone || ''),
      }
    : String(row.user_id);

  return {
    _id: String(row.id),
    orderNumber: String(row.order_number),
    user: userObj,
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    totalAmount: Number(row.total_amount),
    deliveryAddress: String(row.delivery_address),
    phone: String(row.phone),
    deliveryNote: String(row.delivery_note || ''),
    paymentMethod: 'Cash on Delivery',
    status: row.status as OrderStatus,
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function mapPopulatedSub(row: Record<string, any>, fallbackPlan?: PlanRecord): PopulatedSubscription {
  return {
    _id: String(row.id),
    user: String(row.user_id),
    plan: row.plans ? mapPlan(row.plans) : fallbackPlan!,
    frequency: row.frequency === '1_per_day' ? '1_per_day' : '5_per_week',
    deliveryDays: Array.isArray(row.delivery_days) ? row.delivery_days : [],
    timeSlot: String(row.time_slot),
    deliveryAddress: String(row.delivery_address),
    preferredSalad: row.salads ? mapSalad(row.salads) : null,
    customSalad: (row.custom_salad as CustomSaladSpec | null) || null,
    status: row.status as 'active' | 'paused' | 'cancelled',
    startDate: String(row.start_date),
    nextRenewalDate: String(row.next_renewal_date),
  };
}

/* -------------------------------------------------------------------------- */
/* Initialization & Diagnostics                                               */
/* -------------------------------------------------------------------------- */

export async function initRepository(): Promise<void> {
  const sb = getSupabaseClient();
  if (!sb) {
    supabaseReady = false;
    supabaseStatusReason = 'SUPABASE_SERVICE_ROLE_KEY not configured; using local JSON store fallback';
    await getDB();
    return;
  }

  try {
    const { error } = await sb.from('plans').select('id').limit(1);
    if (error) {
      supabaseReady = false;
      supabaseStatusReason = `Supabase schema not ready (${error.message}); using local JSON store fallback`;
      console.warn(supabaseStatusReason);
      await getDB();
      return;
    }
    supabaseReady = true;
    supabaseStatusReason = 'Connected to Supabase PostgreSQL';

    // Ensure demo member account exists in Supabase for quick demo login
    const { data: memberExists } = await sb
      .from('users')
      .select('id')
      .eq('email', 'member@freshbowl.com')
      .maybeSingle();

    if (!memberExists) {
      const { data: monthlyPlan } = await sb
        .from('plans')
        .select('id')
        .eq('slug', 'monthly-plan')
        .maybeSingle();

      const memberHash = await bcrypt.hash('Member123!', 10);
      await sb.from('users').insert({
        name: 'Maya Lin',
        email: 'member@freshbowl.com',
        password_hash: memberHash,
        role: 'member',
        phone: '+1 (415) 555-0148',
        address: '2140 Market St, Apt 4B, San Francisco, CA',
        status: 'active',
        membership_plan_id: monthlyPlan?.id || null,
      });
    }

    console.log('FreshBowl backend connected to Supabase PostgreSQL.');
  } catch (err) {
    supabaseReady = false;
    supabaseStatusReason = `Supabase connection error (${(err as Error).message}); using local JSON store fallback`;
    console.warn(supabaseStatusReason);
    await getDB();
  }
}

export function getStorageStatus() {
  return {
    mode: supabaseReady ? 'supabase' : 'local-fallback',
    supabaseConnected: supabaseReady,
    detail: supabaseStatusReason,
  };
}

/* -------------------------------------------------------------------------- */
/* Repository Operations                                                      */
/* -------------------------------------------------------------------------- */

export const repo = {
  // Users
  async findUserById(id: string): Promise<UserRecord | null> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { data, error } = await sb.from('users').select('*').eq('id', id).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapUser(data) : null;
    }
    const db = await getDB();
    return db.users.find((u) => u._id === id) || null;
  },

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.trim().toLowerCase();
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { data, error } = await sb.from('users').select('*').eq('email', normalized).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapUser(data) : null;
    }
    const db = await getDB();
    return db.users.find((u) => u.email.toLowerCase() === normalized) || null;
  },

  async sanitizeUserRecord(user: UserRecord): Promise<SanitizedUser> {
    const plans = await repo.listPlans(true);
    return sanitizeUser(user, plans);
  },

  async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
    phone?: string;
    address?: string;
    membershipPlan?: string | null;
    joinedDate?: string;
  }): Promise<UserRecord> {
    const email = input.email.trim().toLowerCase();
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { data, error } = await sb
        .from('users')
        .insert({
          name: input.name,
          email,
          password_hash: input.passwordHash,
          role: input.role,
          phone: input.phone || '',
          address: input.address || '',
          status: 'active',
          membership_plan_id: input.membershipPlan || null,
          joined_date: input.joinedDate || new Date().toISOString(),
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return mapUser(data);
    }

    const db = await getDB();
    const created: UserRecord = {
      _id: `user-${Date.now()}`,
      name: input.name,
      email,
      passwordHash: input.passwordHash,
      role: input.role,
      phone: input.phone || '',
      address: input.address || '',
      status: 'active',
      membershipPlan: input.membershipPlan || null,
      joinedDate: input.joinedDate || new Date().toISOString(),
    };
    db.users.unshift(created);
    await saveDB();
    return created;
  },

  async listMembers(): Promise<SanitizedUser[]> {
    const plans = await repo.listPlans(true);
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { data, error } = await sb
        .from('users')
        .select('*')
        .eq('role', 'member')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map((row) => sanitizeUser(mapUser(row), plans));
    }
    const db = await getDB();
    return db.users.filter((u) => u.role === 'member').map((u) => sanitizeUser(u, plans));
  },

  async updateMember(
    id: string,
    patch: Partial<{
      name: string;
      email: string;
      phone: string;
      address: string;
      membershipPlan: string | null;
      status: 'active' | 'inactive';
      joinedDate: string;
    }>
  ): Promise<SanitizedUser | null> {
    const plans = await repo.listPlans(true);
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const updateRow: Record<string, unknown> = {};
      if (patch.name !== undefined) updateRow.name = patch.name;
      if (patch.email !== undefined) updateRow.email = patch.email;
      if (patch.phone !== undefined) updateRow.phone = patch.phone;
      if (patch.address !== undefined) updateRow.address = patch.address;
      if (patch.membershipPlan !== undefined) updateRow.membership_plan_id = patch.membershipPlan || null;
      if (patch.status !== undefined) updateRow.status = patch.status;
      if (patch.joinedDate !== undefined) updateRow.joined_date = patch.joinedDate;

      const { data, error } = await sb
        .from('users')
        .update(updateRow)
        .eq('id', id)
        .eq('role', 'member')
        .select('*')
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? sanitizeUser(mapUser(data), plans) : null;
    }

    const db = await getDB();
    const idx = db.users.findIndex((u) => u._id === id && u.role === 'member');
    if (idx === -1) return null;
    db.users[idx] = { ...db.users[idx], ...patch };
    await saveDB();
    return sanitizeUser(db.users[idx], plans);
  },

  async toggleMemberStatus(id: string): Promise<SanitizedUser | null> {
    const existing = await repo.findUserById(id);
    if (!existing || existing.role !== 'member') return null;
    const nextStatus = existing.status === 'active' ? 'inactive' : 'active';
    return repo.updateMember(id, { status: nextStatus });
  },

  async deleteMember(id: string): Promise<boolean> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { error, count } = await sb
        .from('users')
        .delete({ count: 'exact' })
        .eq('id', id)
        .eq('role', 'member');
      if (error) throw new Error(error.message);
      return (count || 0) > 0;
    }

    const db = await getDB();
    const exists = db.users.some((u) => u._id === id && u.role === 'member');
    if (!exists) return false;
    db.users = db.users.filter((u) => u._id !== id);
    db.subscriptions = db.subscriptions.filter((s) => s.user !== id);
    db.favorites = db.favorites.filter((f) => f.user !== id);
    await saveDB();
    return true;
  },

  // Plans
  async listPlans(all: boolean): Promise<PlanRecord[]> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      let query = sb.from('plans').select('*').order('price', { ascending: true });
      if (!all) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []).map(mapPlan);
    }

    const db = await getDB();
    return (all ? db.plans : db.plans.filter((p) => p.isActive))
      .slice()
      .sort((a, b) => a.price - b.price);
  },

  async findPlanById(id: string): Promise<PlanRecord | null> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { data, error } = await sb.from('plans').select('*').eq('id', id).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapPlan(data) : null;
    }
    const db = await getDB();
    return db.plans.find((p) => p._id === id) || null;
  },

  async createPlan(input: Omit<PlanRecord, '_id'>): Promise<PlanRecord> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { data, error } = await sb
        .from('plans')
        .insert({
          name: input.name,
          slug: `${input.slug}-${Date.now()}`,
          price: input.price,
          duration_days: input.durationDays,
          duration_label: input.durationLabel,
          salads_included: input.saladsIncluded,
          cadence_label: input.cadenceLabel,
          benefits: input.benefits,
          is_active: input.isActive,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return mapPlan(data);
    }

    const db = await getDB();
    const created: PlanRecord = { _id: `plan-${Date.now()}`, ...input };
    db.plans.push(created);
    await saveDB();
    return created;
  },

  async updatePlan(id: string, patch: Partial<PlanRecord>): Promise<PlanRecord | null> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const updateRow: Record<string, unknown> = {};
      if (patch.name !== undefined) updateRow.name = patch.name;
      if (patch.price !== undefined) updateRow.price = patch.price;
      if (patch.durationDays !== undefined) updateRow.duration_days = patch.durationDays;
      if (patch.durationLabel !== undefined) updateRow.duration_label = patch.durationLabel;
      if (patch.saladsIncluded !== undefined) updateRow.salads_included = patch.saladsIncluded;
      if (patch.cadenceLabel !== undefined) updateRow.cadence_label = patch.cadenceLabel;
      if (patch.benefits !== undefined) updateRow.benefits = patch.benefits;
      if (patch.isActive !== undefined) updateRow.is_active = patch.isActive;

      const { data, error } = await sb.from('plans').update(updateRow).eq('id', id).select('*').maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapPlan(data) : null;
    }

    const db = await getDB();
    const idx = db.plans.findIndex((p) => p._id === id);
    if (idx === -1) return null;
    db.plans[idx] = { ...db.plans[idx], ...patch };
    await saveDB();
    return db.plans[idx];
  },

  async deletePlan(id: string): Promise<boolean> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { error, count } = await sb.from('plans').delete({ count: 'exact' }).eq('id', id);
      if (error) throw new Error(error.message);
      return (count || 0) > 0;
    }

    const db = await getDB();
    const exists = db.plans.some((p) => p._id === id);
    if (!exists) return false;
    db.plans = db.plans.filter((p) => p._id !== id);
    await saveDB();
    return true;
  },

  // Salads
  async listSalads(includeOutOfStock: boolean): Promise<SaladRecord[]> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      let query = sb.from('salads').select('*').order('created_at', { ascending: false });
      if (!includeOutOfStock) query = query.eq('in_stock', true);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []).map(mapSalad);
    }

    const db = await getDB();
    return includeOutOfStock ? db.salads : db.salads.filter((s) => s.inStock);
  },

  async findSaladById(id: string): Promise<SaladRecord | null> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { data, error } = await sb.from('salads').select('*').eq('id', id).maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapSalad(data) : null;
    }
    const db = await getDB();
    return db.salads.find((s) => s._id === id) || null;
  },

  async createSalad(input: Omit<SaladRecord, '_id'>): Promise<SaladRecord> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { data, error } = await sb
        .from('salads')
        .insert({
          name: input.name,
          description: input.description,
          diet_type: input.dietType,
          image: input.image,
          calories: input.calories,
          protein: input.protein,
          carbs: input.carbs,
          fat: input.fat,
          price: input.price,
          ingredients_list: input.ingredientsList,
          in_stock: input.inStock,
          featured: input.featured,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return mapSalad(data);
    }

    const db = await getDB();
    const created: SaladRecord = { _id: `salad-${Date.now()}`, ...input };
    db.salads.unshift(created);
    await saveDB();
    return created;
  },

  async updateSalad(id: string, patch: Partial<SaladRecord>): Promise<SaladRecord | null> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const updateRow: Record<string, unknown> = {};
      if (patch.name !== undefined) updateRow.name = patch.name;
      if (patch.description !== undefined) updateRow.description = patch.description;
      if (patch.dietType !== undefined) updateRow.diet_type = patch.dietType;
      if (patch.image !== undefined) updateRow.image = patch.image;
      if (patch.calories !== undefined) updateRow.calories = patch.calories;
      if (patch.protein !== undefined) updateRow.protein = patch.protein;
      if (patch.carbs !== undefined) updateRow.carbs = patch.carbs;
      if (patch.fat !== undefined) updateRow.fat = patch.fat;
      if (patch.price !== undefined) updateRow.price = patch.price;
      if (patch.ingredientsList !== undefined) updateRow.ingredients_list = patch.ingredientsList;
      if (patch.inStock !== undefined) updateRow.in_stock = patch.inStock;
      if (patch.featured !== undefined) updateRow.featured = patch.featured;

      const { data, error } = await sb.from('salads').update(updateRow).eq('id', id).select('*').maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapSalad(data) : null;
    }

    const db = await getDB();
    const idx = db.salads.findIndex((s) => s._id === id);
    if (idx === -1) return null;
    db.salads[idx] = { ...db.salads[idx], ...patch };
    await saveDB();
    return db.salads[idx];
  },

  async deleteSalad(id: string): Promise<boolean> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { error, count } = await sb.from('salads').delete({ count: 'exact' }).eq('id', id);
      if (error) throw new Error(error.message);
      return (count || 0) > 0;
    }

    const db = await getDB();
    const exists = db.salads.some((s) => s._id === id);
    if (!exists) return false;
    db.salads = db.salads.filter((s) => s._id !== id);
    await saveDB();
    return true;
  },

  // Ingredients
  async listIngredients(includeOutOfStock: boolean): Promise<IngredientRecord[]> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      let query = sb.from('ingredients').select('*').order('created_at', { ascending: true });
      if (!includeOutOfStock) query = query.eq('in_stock', true);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []).map(mapIngredient);
    }

    const db = await getDB();
    return includeOutOfStock ? db.ingredients : db.ingredients.filter((i) => i.inStock);
  },

  async createIngredient(input: Omit<IngredientRecord, '_id'>): Promise<IngredientRecord> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { data, error } = await sb
        .from('ingredients')
        .insert({
          name: input.name,
          category: input.category,
          sub_category: input.subCategory,
          price: input.price,
          calories: input.calories,
          protein: input.protein,
          carbs: input.carbs,
          fat: input.fat,
          in_stock: input.inStock,
          diet_tags: input.dietTags,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return mapIngredient(data);
    }

    const db = await getDB();
    const created: IngredientRecord = { _id: `ing-${Date.now()}`, ...input };
    db.ingredients.push(created);
    await saveDB();
    return created;
  },

  async updateIngredient(id: string, patch: Partial<IngredientRecord>): Promise<IngredientRecord | null> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const updateRow: Record<string, unknown> = {};
      if (patch.name !== undefined) updateRow.name = patch.name;
      if (patch.category !== undefined) updateRow.category = patch.category;
      if (patch.subCategory !== undefined) updateRow.sub_category = patch.subCategory;
      if (patch.price !== undefined) updateRow.price = patch.price;
      if (patch.calories !== undefined) updateRow.calories = patch.calories;
      if (patch.protein !== undefined) updateRow.protein = patch.protein;
      if (patch.carbs !== undefined) updateRow.carbs = patch.carbs;
      if (patch.fat !== undefined) updateRow.fat = patch.fat;
      if (patch.inStock !== undefined) updateRow.in_stock = patch.inStock;
      if (patch.dietTags !== undefined) updateRow.diet_tags = patch.dietTags;

      const { data, error } = await sb.from('ingredients').update(updateRow).eq('id', id).select('*').maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapIngredient(data) : null;
    }

    const db = await getDB();
    const idx = db.ingredients.findIndex((i) => i._id === id);
    if (idx === -1) return null;
    db.ingredients[idx] = { ...db.ingredients[idx], ...patch };
    await saveDB();
    return db.ingredients[idx];
  },

  async deleteIngredient(id: string): Promise<boolean> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { error, count } = await sb.from('ingredients').delete({ count: 'exact' }).eq('id', id);
      if (error) throw new Error(error.message);
      return (count || 0) > 0;
    }

    const db = await getDB();
    const exists = db.ingredients.some((i) => i._id === id);
    if (!exists) return false;
    db.ingredients = db.ingredients.filter((i) => i._id !== id);
    await saveDB();
    return true;
  },

  // Favorites
  async listFavoritesByUser(userId: string): Promise<FavoriteRecord[]> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { data, error } = await sb
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(mapFavorite);
    }

    const db = await getDB();
    return db.favorites.filter((f) => f.user === userId);
  },

  async createFavorite(input: Omit<FavoriteRecord, '_id' | 'createdAt'>): Promise<FavoriteRecord> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { data, error } = await sb
        .from('favorites')
        .insert({
          user_id: input.user,
          name: input.name,
          base: input.base,
          toppings: input.toppings,
          protein: input.protein || null,
          dressing: input.dressing || null,
          total_price: input.totalPrice,
          total_calories: input.totalCalories,
          total_protein: input.totalProtein,
          total_carbs: input.totalCarbs,
          total_fat: input.totalFat,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return mapFavorite(data);
    }

    const db = await getDB();
    const created: FavoriteRecord = {
      _id: `fav-${Date.now()}`,
      ...input,
      createdAt: new Date().toISOString(),
    };
    db.favorites.unshift(created);
    await saveDB();
    return created;
  },

  async deleteFavorite(id: string, userId: string): Promise<boolean> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { error, count } = await sb
        .from('favorites')
        .delete({ count: 'exact' })
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
      return (count || 0) > 0;
    }

    const db = await getDB();
    const exists = db.favorites.some((f) => f._id === id && f.user === userId);
    if (!exists) return false;
    db.favorites = db.favorites.filter((f) => !(f._id === id && f.user === userId));
    await saveDB();
    return true;
  },

  // Subscriptions
  async getLatestSubscriptionByUser(userId: string): Promise<PopulatedSubscription | null> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { data, error } = await sb
        .from('subscriptions')
        .select('*, plans(*), salads(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapPopulatedSub(data) : null;
    }

    const db = await getDB();
    const subs = db.subscriptions.filter((s) => s.user === userId);
    const latest = subs[subs.length - 1];
    return latest ? populateSubscription(latest, db) : null;
  },

  async createOrReplaceSubscription(input: {
    userId: string;
    plan: PlanRecord;
    frequency: '1_per_day' | '5_per_week';
    deliveryDays: string[];
    timeSlot: string;
    deliveryAddress: string;
    preferredSaladId: string | null;
    customSalad: CustomSaladSpec | null;
  }): Promise<PopulatedSubscription> {
    const startDate = new Date();
    const nextRenewalDate = new Date(startDate.getTime() + input.plan.durationDays * 86400000);

    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      await sb
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', input.userId)
        .in('status', ['active', 'paused']);

      const { data, error } = await sb
        .from('subscriptions')
        .insert({
          user_id: input.userId,
          plan_id: input.plan._id,
          frequency: input.frequency,
          delivery_days: input.deliveryDays,
          time_slot: input.timeSlot,
          delivery_address: input.deliveryAddress,
          preferred_salad_id: input.preferredSaladId ? input.preferredSaladId : null,
          custom_salad: input.customSalad || null,
          status: 'active',
          start_date: startDate.toISOString(),
          next_renewal_date: nextRenewalDate.toISOString(),
        })
        .select('*, plans(*), salads(*)')
        .single();
      if (error) throw new Error(error.message);

      await sb.from('users').update({ membership_plan_id: input.plan._id }).eq('id', input.userId);
      return mapPopulatedSub(data, input.plan);
    }

    const db = await getDB();
    db.subscriptions = db.subscriptions.map((s) =>
      s.user === input.userId && (s.status === 'active' || s.status === 'paused')
        ? { ...s, status: 'cancelled' }
        : s
    );

    const created: SubscriptionRecord = {
      _id: `sub-${Date.now()}`,
      user: input.userId,
      plan: input.plan._id,
      frequency: input.frequency,
      deliveryDays: input.deliveryDays,
      timeSlot: input.timeSlot,
      deliveryAddress: input.deliveryAddress,
      preferredSalad: input.preferredSaladId,
      customSalad: input.customSalad,
      status: 'active',
      startDate: startDate.toISOString(),
      nextRenewalDate: nextRenewalDate.toISOString(),
    };
    db.subscriptions.push(created);

    const userIdx = db.users.findIndex((u) => u._id === input.userId);
    if (userIdx !== -1) db.users[userIdx].membershipPlan = input.plan._id;

    await saveDB();
    return populateSubscription(created, db);
  },

  async patchLatestSubscriptionStatus(
    userId: string,
    status: 'active' | 'paused' | 'cancelled'
  ): Promise<PopulatedSubscription | null> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const latest = await repo.getLatestSubscriptionByUser(userId);
      if (!latest) return null;

      const { data, error } = await sb
        .from('subscriptions')
        .update({ status })
        .eq('id', latest._id)
        .select('*, plans(*), salads(*)')
        .single();
      if (error) throw new Error(error.message);
      return mapPopulatedSub(data);
    }

    const db = await getDB();
    const subs = db.subscriptions.filter((s) => s.user === userId);
    const latest = subs[subs.length - 1];
    if (!latest) return null;
    latest.status = status;
    await saveDB();
    return populateSubscription(latest, db);
  },

  async listActiveSubscriptions(): Promise<PopulatedSubscription[]> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { data, error } = await sb
        .from('subscriptions')
        .select('*, plans(*), salads(*)')
        .eq('status', 'active');
      if (error) throw new Error(error.message);
      return (data || []).map((row) => mapPopulatedSub(row));
    }

    const db = await getDB();
    return db.subscriptions.filter((s) => s.status === 'active').map((s) => populateSubscription(s, db));
  },

  // Orders
  async listOrdersByUser(userId: string): Promise<OrderRecord[]> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { data, error } = await sb
        .from('orders')
        .select('*, users(id, name, email, phone)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(mapOrder);
    }

    const db = await getDB();
    return db.orders
      .filter((o) => (typeof o.user === 'string' ? o.user === userId : o.user._id === userId))
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async listAllOrders(): Promise<OrderRecord[]> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { data, error } = await sb
        .from('orders')
        .select('*, users(id, name, email, phone)')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map(mapOrder);
    }

    const db = await getDB();
    return db.orders
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async findOrderById(id: string): Promise<OrderRecord | null> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { data, error } = await sb
        .from('orders')
        .select('*, users(id, name, email, phone)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapOrder(data) : null;
    }
    const db = await getDB();
    return db.orders.find((o) => o._id === id) || null;
  },

  async createOrder(input: {
    user: UserRecord;
    orderNumber: string;
    items: OrderItemRecord[];
    subtotal: number;
    deliveryFee: number;
    totalAmount: number;
    deliveryAddress: string;
    phone: string;
    deliveryNote: string;
  }): Promise<OrderRecord> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { data, error } = await sb
        .from('orders')
        .insert({
          order_number: input.orderNumber,
          user_id: input.user._id,
          items: input.items,
          subtotal: input.subtotal,
          delivery_fee: input.deliveryFee,
          total_amount: input.totalAmount,
          delivery_address: input.deliveryAddress,
          phone: input.phone,
          delivery_note: input.deliveryNote,
          payment_method: 'Cash on Delivery',
          status: 'Placed',
        })
        .select('*, users(id, name, email, phone)')
        .single();
      if (error) throw new Error(error.message);
      return mapOrder(data);
    }

    const db = await getDB();
    const order: OrderRecord = {
      _id: `order-${Date.now()}`,
      orderNumber: input.orderNumber,
      user: {
        _id: input.user._id,
        name: input.user.name,
        email: input.user.email,
        phone: input.user.phone,
      },
      items: input.items,
      subtotal: input.subtotal,
      deliveryFee: input.deliveryFee,
      totalAmount: input.totalAmount,
      deliveryAddress: input.deliveryAddress,
      phone: input.phone,
      deliveryNote: input.deliveryNote,
      paymentMethod: 'Cash on Delivery',
      status: 'Placed',
      createdAt: new Date().toISOString(),
    };
    db.orders.unshift(order);
    await saveDB();
    return order;
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<OrderRecord | null> {
    if (supabaseReady) {
      const sb = getSupabaseClient()!;
      const { data, error } = await sb
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select('*, users(id, name, email, phone)')
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapOrder(data) : null;
    }

    const db = await getDB();
    const idx = db.orders.findIndex((o) => o._id === id);
    if (idx === -1) return null;
    db.orders[idx].status = status;
    await saveDB();
    return db.orders[idx];
  },
};
