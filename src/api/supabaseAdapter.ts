import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type {
  CustomSaladSpec,
  DietType,
  FavoriteSalad,
  Ingredient,
  IngredientCategory,
  Order,
  OrderItem,
  OrderStatus,
  Plan,
  Role,
  Salad,
  Subscription,
  User,
} from '../types';

const SUPABASE_URL = (
  import.meta.env.VITE_SUPABASE_URL || 'https://uxkaxigpmgtnmmuuqstz.supabase.co'
).trim();
const SUPABASE_ANON_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_v9baCnPGgfxwJrpqEH_Reg_6-qHiGC7'
).trim();

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function makeResponse<T>(config: InternalAxiosRequestConfig, data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status === 201 ? 'Created' : 'OK',
    headers: {},
    config,
  };
}

function rejectWith(message: string, status = 400): Promise<never> {
  return Promise.reject({
    response: { status, data: { message } },
    message,
  });
}

function encodeBrowserToken(userId: string, role: Role): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const payload = btoa(JSON.stringify({ sub: userId, role, iat: Math.floor(Date.now() / 1000) })).replace(/=/g, '');
  return `${header}.${payload}.supabase-session`;
}

function extractUserIdFromAuthHeader(config: InternalAxiosRequestConfig): string | null {
  const authHeader =
    (config.headers?.Authorization as string | undefined) ||
    (config.headers?.authorization as string | undefined);
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const parts = token.split('.');
  if (parts.length >= 2) {
    try {
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = JSON.parse(atob(b64));
      if (json?.sub) return String(json.sub);
    } catch {
      return null;
    }
  }
  return null;
}

function mapPlan(row: Record<string, any>): Plan {
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

function mapSalad(row: Record<string, any>): Salad {
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

function mapIngredient(row: Record<string, any>): Ingredient {
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

function mapUser(row: Record<string, any>, plans: Plan[]): User {
  const planObj = row.membership_plan_id
    ? plans.find((p) => p._id === String(row.membership_plan_id)) || null
    : null;
  return {
    _id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: row.role as Role,
    phone: String(row.phone || ''),
    address: String(row.address || ''),
    status: row.status === 'inactive' ? 'inactive' : 'active',
    membershipPlan: planObj,
    joinedDate: String(row.joined_date || row.created_at || new Date().toISOString()),
  };
}

function mapFavorite(row: Record<string, any>): FavoriteSalad {
  return {
    _id: String(row.id),
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

function mapOrder(row: Record<string, any>): Order {
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
    items: Array.isArray(row.items) ? (row.items as OrderItem[]) : [],
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

function mapSubscription(row: Record<string, any>): Subscription {
  return {
    _id: String(row.id),
    user: String(row.user_id),
    plan: mapPlan(row.plans),
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

async function getAllPlans(): Promise<Plan[]> {
  const { data, error } = await sb.from('plans').select('*').order('price', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map(mapPlan);
}

async function getAuthenticatedRow(config: InternalAxiosRequestConfig): Promise<Record<string, any> | null> {
  const userId = extractUserIdFromAuthHeader(config);
  if (!userId) return null;
  const { data } = await sb.from('users').select('*').eq('id', userId).maybeSingle();
  return data || null;
}

export const supabaseAdapter: AxiosAdapter = async (config) => {
  const method = (config.method || 'get').toUpperCase();
  const rawUrl = (config.url || '').replace(/^\/api/, '');
  const [pathname, queryString] = rawUrl.split('?');
  const params = new URLSearchParams(queryString || '');
  const body =
    typeof config.data === 'string' && config.data.trim()
      ? JSON.parse(config.data)
      : config.data || {};

  // 1. Auth
  if (pathname === '/auth/register' && method === 'POST') {
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!name || !email || password.length < 6) {
      return rejectWith('Valid name, email, and 6+ character password are required.', 400);
    }
    const { data: existing } = await sb.from('users').select('id').eq('email', email).maybeSingle();
    if (existing) {
      return rejectWith('An account with this email already exists.', 409);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const { data, error } = await sb
      .from('users')
      .insert({
        name,
        email,
        password_hash: passwordHash,
        role: 'member',
        phone: String(body.phone || '').trim(),
        address: String(body.address || '').trim(),
        status: 'active',
      })
      .select('*')
      .single();
    if (error) return rejectWith(error.message, 500);
    const plans = await getAllPlans();
    return makeResponse(config, {
      token: encodeBrowserToken(data.id, 'member'),
      user: mapUser(data, plans),
    }, 201);
  }

  if (pathname === '/auth/login' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) return rejectWith('Email and password are required.', 400);
    const { data: found, error } = await sb.from('users').select('*').eq('email', email).maybeSingle();
    if (error) return rejectWith(error.message, 500);
    if (!found) return rejectWith('Invalid email or password.', 401);
    const valid = await bcrypt.compare(password, found.password_hash);
    if (!valid) return rejectWith('Invalid email or password.', 401);
    if (found.status === 'inactive') {
      return rejectWith('This account has been deactivated. Contact support or an administrator.', 403);
    }
    const plans = await getAllPlans();
    return makeResponse(config, {
      token: encodeBrowserToken(found.id, found.role),
      user: mapUser(found, plans),
    });
  }

  if (pathname === '/auth/me' && method === 'GET') {
    const userRow = await getAuthenticatedRow(config);
    if (!userRow || userRow.status === 'inactive') return rejectWith('Authentication required.', 401);
    const plans = await getAllPlans();
    return makeResponse(config, { user: mapUser(userRow, plans) });
  }

  // 2. Salads
  if (pathname === '/salads' && method === 'GET') {
    const includeOut = params.get('includeOutOfStock') === 'true';
    let q = sb.from('salads').select('*').order('created_at', { ascending: false });
    if (!includeOut) q = q.eq('in_stock', true);
    const { data, error } = await q;
    if (error) return rejectWith(error.message, 500);
    return makeResponse(config, { salads: (data || []).map(mapSalad) });
  }

  if (pathname === '/salads' && method === 'POST') {
    const authUser = await getAuthenticatedRow(config);
    if (authUser?.role !== 'admin') return rejectWith('Admin permission required.', 403);
    const { data, error } = await sb
      .from('salads')
      .insert({
        name: body.name,
        description: body.description,
        diet_type: body.dietType,
        image: body.image,
        calories: Number(body.calories) || 0,
        protein: Number(body.protein) || 0,
        carbs: Number(body.carbs) || 0,
        fat: Number(body.fat) || 0,
        price: Number(body.price) || 0,
        ingredients_list: body.ingredientsList || [],
        in_stock: body.inStock ?? true,
        featured: body.featured ?? false,
      })
      .select('*')
      .single();
    if (error) return rejectWith(error.message, 500);
    return makeResponse(config, { salad: mapSalad(data) }, 201);
  }

  if (pathname.startsWith('/salads/') && method === 'PUT') {
    const authUser = await getAuthenticatedRow(config);
    if (authUser?.role !== 'admin') return rejectWith('Admin permission required.', 403);
    const id = pathname.split('/')[2];
    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.description !== undefined) patch.description = body.description;
    if (body.dietType !== undefined) patch.diet_type = body.dietType;
    if (body.image !== undefined) patch.image = body.image;
    if (body.calories !== undefined) patch.calories = Number(body.calories);
    if (body.protein !== undefined) patch.protein = Number(body.protein);
    if (body.carbs !== undefined) patch.carbs = Number(body.carbs);
    if (body.fat !== undefined) patch.fat = Number(body.fat);
    if (body.price !== undefined) patch.price = Number(body.price);
    if (body.inStock !== undefined) patch.in_stock = Boolean(body.inStock);
    if (body.featured !== undefined) patch.featured = Boolean(body.featured);
    const { data, error } = await sb.from('salads').update(patch).eq('id', id).select('*').maybeSingle();
    if (error) return rejectWith(error.message, 500);
    if (!data) return rejectWith('Salad not found.', 404);
    return makeResponse(config, { salad: mapSalad(data) });
  }

  if (pathname.startsWith('/salads/') && method === 'DELETE') {
    const authUser = await getAuthenticatedRow(config);
    if (authUser?.role !== 'admin') return rejectWith('Admin permission required.', 403);
    const id = pathname.split('/')[2];
    const { error } = await sb.from('salads').delete().eq('id', id);
    if (error) return rejectWith(error.message, 500);
    return makeResponse(config, { message: 'Salad deleted.' });
  }

  // 3. Ingredients
  if (pathname === '/ingredients' && method === 'GET') {
    const includeOut = params.get('includeOutOfStock') === 'true';
    let q = sb.from('ingredients').select('*').order('created_at', { ascending: true });
    if (!includeOut) q = q.eq('in_stock', true);
    const { data, error } = await q;
    if (error) return rejectWith(error.message, 500);
    return makeResponse(config, { ingredients: (data || []).map(mapIngredient) });
  }

  if (pathname === '/ingredients' && method === 'POST') {
    const authUser = await getAuthenticatedRow(config);
    if (authUser?.role !== 'admin') return rejectWith('Admin permission required.', 403);
    const { data, error } = await sb
      .from('ingredients')
      .insert({
        name: body.name,
        category: body.category,
        sub_category: body.subCategory || 'general',
        price: Number(body.price) || 0,
        calories: Number(body.calories) || 0,
        protein: Number(body.protein) || 0,
        carbs: Number(body.carbs) || 0,
        fat: Number(body.fat) || 0,
        in_stock: body.inStock ?? true,
        diet_tags: body.dietTags || [],
      })
      .select('*')
      .single();
    if (error) return rejectWith(error.message, 500);
    return makeResponse(config, { ingredient: mapIngredient(data) }, 201);
  }

  if (pathname.startsWith('/ingredients/') && method === 'PUT') {
    const authUser = await getAuthenticatedRow(config);
    if (authUser?.role !== 'admin') return rejectWith('Admin permission required.', 403);
    const id = pathname.split('/')[2];
    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.category !== undefined) patch.category = body.category;
    if (body.subCategory !== undefined) patch.sub_category = body.subCategory;
    if (body.price !== undefined) patch.price = Number(body.price);
    if (body.calories !== undefined) patch.calories = Number(body.calories);
    if (body.protein !== undefined) patch.protein = Number(body.protein);
    if (body.carbs !== undefined) patch.carbs = Number(body.carbs);
    if (body.fat !== undefined) patch.fat = Number(body.fat);
    if (body.inStock !== undefined) patch.in_stock = Boolean(body.inStock);
    const { data, error } = await sb.from('ingredients').update(patch).eq('id', id).select('*').maybeSingle();
    if (error) return rejectWith(error.message, 500);
    if (!data) return rejectWith('Ingredient not found.', 404);
    return makeResponse(config, { ingredient: mapIngredient(data) });
  }

  if (pathname.startsWith('/ingredients/') && method === 'DELETE') {
    const authUser = await getAuthenticatedRow(config);
    if (authUser?.role !== 'admin') return rejectWith('Admin permission required.', 403);
    const id = pathname.split('/')[2];
    const { error } = await sb.from('ingredients').delete().eq('id', id);
    if (error) return rejectWith(error.message, 500);
    return makeResponse(config, { message: 'Ingredient deleted.' });
  }

  // 4. Plans
  if (pathname === '/plans' && method === 'GET') {
    const all = params.get('all') === 'true';
    const plans = await getAllPlans();
    return makeResponse(config, { plans: all ? plans : plans.filter((p) => p.isActive) });
  }

  if (pathname === '/plans' && method === 'POST') {
    const authUser = await getAuthenticatedRow(config);
    if (authUser?.role !== 'admin') return rejectWith('Admin permission required.', 403);
    const slug = `${String(body.name || 'plan').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    const { data, error } = await sb
      .from('plans')
      .insert({
        name: body.name,
        slug,
        price: Number(body.price),
        duration_days: Number(body.durationDays),
        duration_label: body.durationLabel || `${body.durationDays} Days`,
        salads_included: Number(body.saladsIncluded),
        cadence_label: body.cadenceLabel || `${body.saladsIncluded} salads`,
        benefits: body.benefits || [],
        is_active: body.isActive ?? true,
      })
      .select('*')
      .single();
    if (error) return rejectWith(error.message, 500);
    return makeResponse(config, { plan: mapPlan(data) }, 201);
  }

  if (pathname.startsWith('/plans/') && method === 'PUT') {
    const authUser = await getAuthenticatedRow(config);
    if (authUser?.role !== 'admin') return rejectWith('Admin permission required.', 403);
    const id = pathname.split('/')[2];
    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.price !== undefined) patch.price = Number(body.price);
    if (body.durationDays !== undefined) patch.duration_days = Number(body.durationDays);
    if (body.durationLabel !== undefined) patch.duration_label = body.durationLabel;
    if (body.saladsIncluded !== undefined) patch.salads_included = Number(body.saladsIncluded);
    if (body.cadenceLabel !== undefined) patch.cadence_label = body.cadenceLabel;
    if (body.benefits !== undefined) patch.benefits = body.benefits;
    if (body.isActive !== undefined) patch.is_active = Boolean(body.isActive);
    const { data, error } = await sb.from('plans').update(patch).eq('id', id).select('*').maybeSingle();
    if (error) return rejectWith(error.message, 500);
    if (!data) return rejectWith('Plan not found.', 404);
    return makeResponse(config, { plan: mapPlan(data) });
  }

  if (pathname.startsWith('/plans/') && method === 'DELETE') {
    const authUser = await getAuthenticatedRow(config);
    if (authUser?.role !== 'admin') return rejectWith('Admin permission required.', 403);
    const id = pathname.split('/')[2];
    const { error } = await sb.from('plans').delete().eq('id', id);
    if (error) return rejectWith(error.message, 500);
    return makeResponse(config, { message: 'Membership plan deleted.' });
  }

  // 5. Favorites
  if (pathname === '/favorites' && method === 'GET') {
    const authUser = await getAuthenticatedRow(config);
    if (!authUser) return rejectWith('Authentication required.', 401);
    const { data, error } = await sb
      .from('favorites')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false });
    if (error) return rejectWith(error.message, 500);
    return makeResponse(config, { favorites: (data || []).map(mapFavorite) });
  }

  if (pathname === '/favorites' && method === 'POST') {
    const authUser = await getAuthenticatedRow(config);
    if (!authUser) return rejectWith('Authentication required.', 401);
    const { data, error } = await sb
      .from('favorites')
      .insert({
        user_id: authUser.id,
        name: body.name,
        base: body.base,
        toppings: body.toppings || [],
        protein: body.protein || null,
        dressing: body.dressing || null,
        total_price: body.totalPrice,
        total_calories: body.totalCalories,
        total_protein: body.totalProtein,
        total_carbs: body.totalCarbs,
        total_fat: body.totalFat,
      })
      .select('*')
      .single();
    if (error) return rejectWith(error.message, 500);
    return makeResponse(config, { favorite: mapFavorite(data) }, 201);
  }

  if (pathname.startsWith('/favorites/') && method === 'DELETE') {
    const authUser = await getAuthenticatedRow(config);
    if (!authUser) return rejectWith('Authentication required.', 401);
    const id = pathname.split('/')[2];
    const { error } = await sb.from('favorites').delete().eq('id', id).eq('user_id', authUser.id);
    if (error) return rejectWith(error.message, 500);
    return makeResponse(config, { message: 'Removed from favorites.' });
  }

  // 6. Subscriptions
  if (pathname === '/subscriptions/me' && method === 'GET') {
    const authUser = await getAuthenticatedRow(config);
    if (!authUser) return rejectWith('Authentication required.', 401);
    const { data, error } = await sb
      .from('subscriptions')
      .select('*, plans(*), salads(*)')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return rejectWith(error.message, 500);
    return makeResponse(config, { subscription: data ? mapSubscription(data) : null });
  }

  if (pathname === '/subscriptions' && method === 'POST') {
    const authUser = await getAuthenticatedRow(config);
    if (!authUser) return rejectWith('Authentication required.', 401);
    const { data: planRow } = await sb.from('plans').select('*').eq('id', body.planId).maybeSingle();
    if (!planRow) return rejectWith('Selected membership plan not found.', 404);

    await sb
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', authUser.id)
      .in('status', ['active', 'paused']);

    const startDate = new Date();
    const nextRenewalDate = new Date(startDate.getTime() + Number(planRow.duration_days) * 86400000);
    const { data, error } = await sb
      .from('subscriptions')
      .insert({
        user_id: authUser.id,
        plan_id: planRow.id,
        frequency: body.frequency || '5_per_week',
        delivery_days: body.deliveryDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        time_slot: body.timeSlot || '12:00 PM - 1:00 PM',
        delivery_address: body.deliveryAddress,
        preferred_salad_id: body.preferredSaladId ? body.preferredSaladId : null,
        custom_salad: body.customSalad || null,
        status: 'active',
        start_date: startDate.toISOString(),
        next_renewal_date: nextRenewalDate.toISOString(),
      })
      .select('*, plans(*), salads(*)')
      .single();
    if (error) return rejectWith(error.message, 500);
    await sb.from('users').update({ membership_plan_id: planRow.id }).eq('id', authUser.id);
    return makeResponse(config, { subscription: mapSubscription(data) }, 201);
  }

  if (pathname.startsWith('/subscriptions/') && method === 'PATCH') {
    const authUser = await getAuthenticatedRow(config);
    if (!authUser) return rejectWith('Authentication required.', 401);
    const action = pathname.split('/')[2];
    const nextStatus = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : action === 'cancel' ? 'cancelled' : null;
    if (!nextStatus) return rejectWith('Invalid subscription action.', 400);

    const { data: latest } = await sb
      .from('subscriptions')
      .select('id')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!latest) return rejectWith('No subscription found.', 404);

    const { data, error } = await sb
      .from('subscriptions')
      .update({ status: nextStatus })
      .eq('id', latest.id)
      .select('*, plans(*), salads(*)')
      .single();
    if (error) return rejectWith(error.message, 500);
    return makeResponse(config, { subscription: mapSubscription(data) });
  }

  // 7. Orders (Cash on Delivery Only)
  if (pathname === '/orders/my-orders' && method === 'GET') {
    const authUser = await getAuthenticatedRow(config);
    if (!authUser) return rejectWith('Authentication required.', 401);
    const { data, error } = await sb
      .from('orders')
      .select('*, users(id, name, email, phone)')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false });
    if (error) return rejectWith(error.message, 500);
    return makeResponse(config, { orders: (data || []).map(mapOrder) });
  }

  if (pathname === '/orders' && method === 'POST') {
    const authUser = await getAuthenticatedRow(config);
    if (!authUser) return rejectWith('Authentication required.', 401);
    if (body.paymentMethod && body.paymentMethod !== 'Cash on Delivery') {
      return rejectWith('Only Cash on Delivery is accepted. Online payments are disabled.', 400);
    }
    if (!body.items || body.items.length === 0) return rejectWith('Your cart is empty.', 400);

    const subtotal = Number(
      body.items
        .reduce((sum: number, item: { unitPrice: number; quantity: number }) => sum + item.unitPrice * item.quantity, 0)
        .toFixed(2)
    );
    const deliveryFee = subtotal >= 25 ? 0 : 2.5;
    const totalAmount = Number((subtotal + deliveryFee).toFixed(2));

    const { data, error } = await sb
      .from('orders')
      .insert({
        order_number: `FB-${Math.floor(1000 + Math.random() * 9000)}`,
        user_id: authUser.id,
        items: body.items,
        subtotal,
        delivery_fee: deliveryFee,
        total_amount: totalAmount,
        delivery_address: body.deliveryAddress,
        phone: body.phone,
        delivery_note: body.deliveryNote || '',
        payment_method: 'Cash on Delivery',
        status: 'Placed',
      })
      .select('*, users(id, name, email, phone)')
      .single();
    if (error) return rejectWith(error.message, 500);
    return makeResponse(config, { order: mapOrder(data) }, 201);
  }

  if (pathname.match(/^\/orders\/[^/]+\/reorder$/) && method === 'POST') {
    const authUser = await getAuthenticatedRow(config);
    if (!authUser) return rejectWith('Authentication required.', 401);
    const id = pathname.split('/')[2];
    const { data: prev } = await sb.from('orders').select('*').eq('id', id).maybeSingle();
    if (!prev) return rejectWith('Previous order not found.', 404);
    const { data, error } = await sb
      .from('orders')
      .insert({
        order_number: `FB-${Math.floor(1000 + Math.random() * 9000)}`,
        user_id: authUser.id,
        items: prev.items,
        subtotal: prev.subtotal,
        delivery_fee: prev.delivery_fee,
        total_amount: prev.total_amount,
        delivery_address: prev.delivery_address,
        phone: prev.phone,
        delivery_note: prev.delivery_note,
        payment_method: 'Cash on Delivery',
        status: 'Placed',
      })
      .select('*, users(id, name, email, phone)')
      .single();
    if (error) return rejectWith(error.message, 500);
    return makeResponse(config, { order: mapOrder(data) }, 201);
  }

  if (pathname === '/orders' && method === 'GET') {
    const authUser = await getAuthenticatedRow(config);
    if (authUser?.role !== 'admin') return rejectWith('Admin permission required.', 403);
    const { data, error } = await sb
      .from('orders')
      .select('*, users(id, name, email, phone)')
      .order('created_at', { ascending: false });
    if (error) return rejectWith(error.message, 500);
    return makeResponse(config, { orders: (data || []).map(mapOrder) });
  }

  if (pathname.match(/^\/orders\/[^/]+\/status$/) && method === 'PATCH') {
    const authUser = await getAuthenticatedRow(config);
    if (authUser?.role !== 'admin') return rejectWith('Admin permission required.', 403);
    const id = pathname.split('/')[2];
    const { data, error } = await sb
      .from('orders')
      .update({ status: body.status })
      .eq('id', id)
      .select('*, users(id, name, email, phone)')
      .maybeSingle();
    if (error) return rejectWith(error.message, 500);
    if (!data) return rejectWith('Order not found.', 404);
    return makeResponse(config, { order: mapOrder(data) });
  }

  // 8. Members & Admin Stats
  if (pathname === '/members' && method === 'GET') {
    const authUser = await getAuthenticatedRow(config);
    if (authUser?.role !== 'admin') return rejectWith('Admin permission required.', 403);
    const [plans, { data, error }] = await Promise.all([
      getAllPlans(),
      sb.from('users').select('*').eq('role', 'member').order('created_at', { ascending: false }),
    ]);
    if (error) return rejectWith(error.message, 500);
    return makeResponse(config, { members: (data || []).map((u) => mapUser(u, plans)) });
  }

  if (pathname === '/members' && method === 'POST') {
    const authUser = await getAuthenticatedRow(config);
    if (authUser?.role !== 'admin') return rejectWith('Admin permission required.', 403);
    const email = String(body.email || '').trim().toLowerCase();
    const { data: existing } = await sb.from('users').select('id').eq('email', email).maybeSingle();
    if (existing) return rejectWith('A member with this email already exists.', 409);
    const passwordHash = await bcrypt.hash(body.password || 'Member123!', 10);
    const { data, error } = await sb
      .from('users')
      .insert({
        name: body.name,
        email,
        password_hash: passwordHash,
        role: 'member',
        phone: body.phone || '',
        address: body.address || '',
        status: 'active',
        membership_plan_id: body.membershipPlan ? body.membershipPlan : null,
        joined_date: body.startDate ? new Date(body.startDate).toISOString() : new Date().toISOString(),
      })
      .select('*')
      .single();
    if (error) return rejectWith(error.message, 500);
    const plans = await getAllPlans();
    return makeResponse(config, { member: mapUser(data, plans) }, 201);
  }

  if (pathname.startsWith('/members/') && method === 'PUT') {
    const authUser = await getAuthenticatedRow(config);
    if (authUser?.role !== 'admin') return rejectWith('Admin permission required.', 403);
    const id = pathname.split('/')[2];
    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.email !== undefined) patch.email = body.email;
    if (body.phone !== undefined) patch.phone = body.phone;
    if (body.address !== undefined) patch.address = body.address;
    if (body.membershipPlan !== undefined) patch.membership_plan_id = body.membershipPlan ? body.membershipPlan : null;
    if (body.status !== undefined) patch.status = body.status;
    if (body.joinedDate !== undefined) patch.joined_date = new Date(body.joinedDate).toISOString();
    const { data, error } = await sb.from('users').update(patch).eq('id', id).eq('role', 'member').select('*').maybeSingle();
    if (error) return rejectWith(error.message, 500);
    if (!data) return rejectWith('Member not found.', 404);
    const plans = await getAllPlans();
    return makeResponse(config, { member: mapUser(data, plans) });
  }

  if (pathname.startsWith('/members/') && method === 'DELETE') {
    const authUser = await getAuthenticatedRow(config);
    if (authUser?.role !== 'admin') return rejectWith('Admin permission required.', 403);
    const id = pathname.split('/')[2];
    const mode = params.get('mode') || 'delete';
    if (mode === 'deactivate') {
      const { data: current } = await sb.from('users').select('*').eq('id', id).eq('role', 'member').maybeSingle();
      if (!current) return rejectWith('Member not found.', 404);
      const nextStatus = current.status === 'active' ? 'inactive' : 'active';
      const { data, error } = await sb.from('users').update({ status: nextStatus }).eq('id', id).select('*').single();
      if (error) return rejectWith(error.message, 500);
      const plans = await getAllPlans();
      return makeResponse(config, {
        message: `Member status updated to ${nextStatus}.`,
        member: mapUser(data, plans),
      });
    }
    const { error } = await sb.from('users').delete().eq('id', id).eq('role', 'member');
    if (error) return rejectWith(error.message, 500);
    return makeResponse(config, { message: 'Member permanently removed.' });
  }

  if (pathname === '/admin/stats' && method === 'GET') {
    const authUser = await getAuthenticatedRow(config);
    if (authUser?.role !== 'admin') return rejectWith('Admin permission required.', 403);
    const [membersRes, subsRes, ordersRes, saladsRes, ingRes] = await Promise.all([
      sb.from('users').select('status').eq('role', 'member'),
      sb.from('subscriptions').select('status, plans(price)').eq('status', 'active'),
      sb.from('orders').select('*, users(id, name, email, phone)').order('created_at', { ascending: false }),
      sb.from('salads').select('id', { count: 'exact', head: true }),
      sb.from('ingredients').select('id', { count: 'exact', head: true }),
    ]);

    const members = membersRes.data || [];
    const activeSubs = subsRes.data || [];
    const orders = (ordersRes.data || []).map(mapOrder);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todaysOrders = orders.filter((o) => new Date(o.createdAt) >= startOfToday).length;
    const orderRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const subscriptionRevenue = activeSubs.reduce((sum: number, s: any) => sum + Number(s.plans?.price || 0), 0);

    const statusCounts: Record<OrderStatus, number> = {
      Placed: 0,
      Preparing: 0,
      'Out for Delivery': 0,
      Delivered: 0,
    };
    orders.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    return makeResponse(config, {
      stats: {
        totalMembers: members.length,
        activeMembers: members.filter((m) => m.status === 'active').length,
        activeSubscriptions: activeSubs.length,
        todaysOrders,
        totalOrders: orders.length,
        totalRevenue: Number((orderRevenue + subscriptionRevenue).toFixed(2)),
        orderRevenue: Number(orderRevenue.toFixed(2)),
        subscriptionRevenue: Number(subscriptionRevenue.toFixed(2)),
        totalSalads: saladsRes.count || 0,
        totalIngredients: ingRes.count || 0,
        statusCounts,
      },
      recentOrders: orders.slice(0, 6),
    });
  }

  return rejectWith(`Endpoint not implemented: ${method} ${pathname}`, 404);
};
