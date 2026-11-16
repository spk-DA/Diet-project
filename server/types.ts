export type Role = 'admin' | 'member';
export type DietType = 'Vegan' | 'Keto' | 'Low-Carb' | 'High-Protein' | 'Weight Loss';
export type IngredientCategory = 'base' | 'topping' | 'protein' | 'dressing';
export type OrderStatus = 'Placed' | 'Preparing' | 'Out for Delivery' | 'Delivered';

export interface PlanRecord {
  _id: string;
  name: string;
  slug: string;
  price: number;
  durationDays: number;
  durationLabel: string;
  saladsIncluded: number;
  cadenceLabel: string;
  benefits: string[];
  isActive: boolean;
}

export interface UserRecord {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  membershipPlan: string | null;
  joinedDate: string;
}

export interface SanitizedUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  membershipPlan: PlanRecord | null;
  joinedDate: string;
}

export interface SaladRecord {
  _id: string;
  name: string;
  description: string;
  dietType: DietType;
  image: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  price: number;
  ingredientsList: string[];
  inStock: boolean;
  featured: boolean;
}

export interface IngredientRecord {
  _id: string;
  name: string;
  category: IngredientCategory;
  subCategory: string;
  price: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  inStock: boolean;
  dietTags: string[];
}

export interface IngredientSnapshot {
  ingredientId: string;
  name: string;
  price: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FavoriteRecord {
  _id: string;
  user: string;
  name: string;
  base: IngredientSnapshot;
  toppings: IngredientSnapshot[];
  protein?: IngredientSnapshot | null;
  dressing?: IngredientSnapshot | null;
  totalPrice: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  createdAt: string;
}

export interface CustomSaladSpec {
  name: string;
  base: string;
  toppings: string[];
  protein: string;
  dressing: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  price: number;
}

export interface SubscriptionRecord {
  _id: string;
  user: string;
  plan: string;
  frequency: '1_per_day' | '5_per_week';
  deliveryDays: string[];
  timeSlot: string;
  deliveryAddress: string;
  preferredSalad: string | null;
  customSalad: CustomSaladSpec | null;
  status: 'active' | 'paused' | 'cancelled';
  startDate: string;
  nextRenewalDate: string;
}

export interface PopulatedSubscription extends Omit<SubscriptionRecord, 'plan' | 'preferredSalad'> {
  plan: PlanRecord;
  preferredSalad: SaladRecord | null;
}

export interface OrderItemRecord {
  itemType: 'ready' | 'custom';
  salad?: string | null;
  name: string;
  image?: string;
  quantity: number;
  unitPrice: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  customDetails?: {
    base: string;
    toppings: string[];
    protein: string;
    dressing: string;
  };
}

export interface OrderRecord {
  _id: string;
  orderNumber: string;
  user: string | { _id: string; name: string; email: string; phone?: string };
  items: OrderItemRecord[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryAddress: string;
  phone: string;
  deliveryNote: string;
  paymentMethod: 'Cash on Delivery';
  status: OrderStatus;
  createdAt: string;
}

export interface DatabaseState {
  users: UserRecord[];
  plans: PlanRecord[];
  salads: SaladRecord[];
  ingredients: IngredientRecord[];
  subscriptions: SubscriptionRecord[];
  orders: OrderRecord[];
  favorites: FavoriteRecord[];
}
