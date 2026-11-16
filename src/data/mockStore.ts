import { FavoriteSalad, Ingredient, Order, Plan, Salad, Subscription, User } from '../types';

export interface StoredUser extends User {
  password: string;
}

export interface StoredSubscription extends Omit<Subscription, 'plan' | 'preferredSalad' | 'user'> {
  user: string;
  plan: string;
  preferredSalad?: string | null;
}

export interface StoredFavorite extends FavoriteSalad {
  user: string;
}

export interface FreshBowlDB {
  users: StoredUser[];
  plans: Plan[];
  salads: Salad[];
  ingredients: Ingredient[];
  subscriptions: StoredSubscription[];
  orders: Order[];
  favorites: StoredFavorite[];
}

const DB_KEY = 'freshbowl_frontend_db_v1';

const IMAGES = {
  hero: '/src/assets/images/hero_fresh_salad_1794716157514.jpg',
  quinoa: '/src/assets/images/salad_mediterranean_quinoa_1794716158637.jpg',
  keto: '/src/assets/images/salad_keto_avocado_cobb_1794716158856.jpg',
  detox: '/src/assets/images/salad_vegan_greens_detox_1794716160028.jpg',
  tofu: '/src/assets/images/salad_protein_tofu_crunch_1794716160536.jpg',
};

function createInitialDB(): FreshBowlDB {
  const now = Date.now();

  const plans: Plan[] = [
    {
      _id: 'plan-weekly',
      name: 'Weekly Plan',
      slug: 'weekly-plan',
      price: 54,
      durationDays: 7,
      durationLabel: '7 Days',
      saladsIncluded: 5,
      cadenceLabel: '5 salads / week',
      benefits: [
        '5 chef-crafted or custom bowls delivered Monday–Friday',
        'Flexible morning or midday delivery window',
        'Full macro breakdown per bowl',
        'Pay via Cash on Delivery — pause or skip weeks anytime',
      ],
      isActive: true,
    },
    {
      _id: 'plan-monthly',
      name: 'Monthly Plan',
      slug: 'monthly-plan',
      price: 189,
      durationDays: 30,
      durationLabel: '30 Days',
      saladsIncluded: 20,
      cadenceLabel: '5 salads / week',
      benefits: [
        '20 fresh bowls per month (weekday schedule)',
        'Free priority chilled courier delivery',
        'Save 15% compared to single-bowl orders',
        'Swap between ready-made and custom saved bowls',
      ],
      isActive: true,
    },
    {
      _id: 'plan-premium',
      name: 'Premium Plan',
      slug: 'premium-plan',
      price: 269,
      durationDays: 30,
      durationLabel: '30 Days',
      saladsIncluded: 30,
      cadenceLabel: '1 salad / day',
      benefits: [
        '30 daily bowls including weekends (1 salad per day)',
        'Complimentary extra protein & superfood toppings',
        'Priority early-morning or lunch time slots',
        'Instant 1-click pause, resume, or custom recipe swaps',
      ],
      isActive: true,
    },
  ];

  const salads: Salad[] = [
    {
      _id: 'salad-1',
      name: 'Mediterranean Quinoa & Chickpea',
      description: 'Tri-color quinoa, roasted spiced chickpeas, English cucumber, heirloom cherry tomatoes, parsley, and cold-pressed lemon olive oil.',
      dietType: 'Vegan',
      image: IMAGES.quinoa,
      calories: 440,
      protein: 18,
      carbs: 52,
      fat: 16,
      price: 13.5,
      ingredientsList: ['Tri-Color Quinoa', 'Roasted Chickpeas', 'Cherry Tomatoes', 'English Cucumber', 'Lemon Vinaigrette'],
      inStock: true,
      featured: true,
    },
    {
      _id: 'salad-2',
      name: 'Keto Avocado Herb Cobb',
      description: 'Crisp romaine hearts, grilled rosemary chicken breast, half Hass avocado, soft-boiled pasture egg, and extra virgin olive oil.',
      dietType: 'Keto',
      image: IMAGES.keto,
      calories: 520,
      protein: 42,
      carbs: 9,
      fat: 35,
      price: 15.5,
      ingredientsList: ['Romaine Lettuce', 'Herb Grilled Chicken', 'Hass Avocado', 'Soft-Boiled Egg', 'Extra Virgin Olive Oil'],
      inStock: true,
      featured: true,
    },
    {
      _id: 'salad-3',
      name: 'Emerald Detox Greens',
      description: 'Massaged baby kale and spinach tossed with crisp green apple slices, shelled edamame, toasted sunflower seeds, and lemon-yogurt herb dressing.',
      dietType: 'Weight Loss',
      image: IMAGES.detox,
      calories: 320,
      protein: 16,
      carbs: 28,
      fat: 14,
      price: 12.75,
      ingredientsList: ['Baby Spinach', 'Massaged Kale', 'Green Apple Slices', 'Edamame', 'Greek Yogurt Herb'],
      inStock: true,
      featured: true,
    },
    {
      _id: 'salad-4',
      name: 'Sesame Tofu Superfood Crunch',
      description: 'Seared organic sesame tofu over quinoa, shaved purple cabbage, julienned carrots, edamame, radish, and toasted almonds.',
      dietType: 'High-Protein',
      image: IMAGES.tofu,
      calories: 495,
      protein: 32,
      carbs: 38,
      fat: 22,
      price: 14.5,
      ingredientsList: ['Sesame Tofu', 'Tri-Color Quinoa', 'Purple Cabbage', 'Roasted Almonds', 'Aged Balsamic Glaze'],
      inStock: true,
      featured: true,
    },
    {
      _id: 'salad-5',
      name: 'Harvest Chicken & Kale Power',
      description: 'Char-grilled lemon herb chicken, massaged curly kale, quinoa, cherry tomatoes, sliced avocado, and roasted pepitas.',
      dietType: 'High-Protein',
      image: IMAGES.hero,
      calories: 540,
      protein: 46,
      carbs: 30,
      fat: 24,
      price: 15.25,
      ingredientsList: ['Herb Grilled Chicken', 'Massaged Kale', 'Hass Avocado', 'Pumpkin Seeds', 'Lemon Vinaigrette'],
      inStock: true,
      featured: false,
    },
    {
      _id: 'salad-6',
      name: 'Low-Carb Paneer & Greens',
      description: 'Charred spiced paneer cubes on baby spinach and romaine, cucumber ribbons, cherry tomatoes, pumpkin seeds, and yogurt herb drizzle.',
      dietType: 'Low-Carb',
      image: IMAGES.keto,
      calories: 410,
      protein: 28,
      carbs: 11,
      fat: 28,
      price: 14.25,
      ingredientsList: ['Marinated Paneer', 'Baby Spinach', 'English Cucumber', 'Pumpkin Seeds', 'Greek Yogurt Herb'],
      inStock: true,
      featured: false,
    },
    {
      _id: 'salad-7',
      name: 'Garden Lean Apple & Almond',
      description: 'Light crisp romaine and baby kale paired with tart green apple, cherry tomatoes, roasted almonds, and aged balsamic glaze.',
      dietType: 'Weight Loss',
      image: IMAGES.detox,
      calories: 295,
      protein: 11,
      carbs: 26,
      fat: 15,
      price: 11.95,
      ingredientsList: ['Romaine Lettuce', 'Massaged Kale', 'Green Apple Slices', 'Roasted Almonds', 'Aged Balsamic Glaze'],
      inStock: true,
      featured: false,
    },
    {
      _id: 'salad-8',
      name: 'Plant-Powered Chickpea Crunch',
      description: 'Warm roasted chickpeas, baby spinach, Kalamata olives, cucumber, cherry tomatoes, and cold-pressed lemon dressing.',
      dietType: 'Vegan',
      image: IMAGES.quinoa,
      calories: 380,
      protein: 16,
      carbs: 42,
      fat: 15,
      price: 12.95,
      ingredientsList: ['Baby Spinach', 'Roasted Chickpeas', 'Kalamata Olives', 'Cherry Tomatoes', 'Lemon Vinaigrette'],
      inStock: true,
      featured: false,
    },
    {
      _id: 'salad-9',
      name: 'Zero-Grain Keto Egg & Olive',
      description: 'Romaine and spinach base topped with double soft-boiled eggs, Hass avocado, Kalamata olives, and extra virgin olive oil.',
      dietType: 'Keto',
      image: IMAGES.hero,
      calories: 465,
      protein: 24,
      carbs: 7,
      fat: 38,
      price: 13.95,
      ingredientsList: ['Romaine Lettuce', 'Soft-Boiled Egg', 'Hass Avocado', 'Kalamata Olives', 'Extra Virgin Olive Oil'],
      inStock: true,
      featured: false,
    },
    {
      _id: 'salad-10',
      name: 'Clean Protein Tofu & Greens',
      description: 'Low-carbohydrate seared sesame tofu over baby kale, cucumber, cherry tomatoes, pumpkin seeds, and zesty lemon vinaigrette.',
      dietType: 'Low-Carb',
      image: IMAGES.tofu,
      calories: 365,
      protein: 27,
      carbs: 12,
      fat: 21,
      price: 13.75,
      ingredientsList: ['Sesame Tofu', 'Massaged Kale', 'English Cucumber', 'Pumpkin Seeds', 'Lemon Vinaigrette'],
      inStock: true,
      featured: false,
    },
  ];

  const ingredients: Ingredient[] = [
    // Bases (4)
    { _id: 'ing-1', name: 'Romaine Lettuce', category: 'base', subCategory: 'greens', price: 3.5, calories: 35, protein: 2, carbs: 6, fat: 0, inStock: true, dietTags: ['Vegan', 'Keto', 'Low-Carb', 'Weight Loss'] },
    { _id: 'ing-2', name: 'Baby Spinach', category: 'base', subCategory: 'greens', price: 3.75, calories: 40, protein: 4, carbs: 5, fat: 0, inStock: true, dietTags: ['Vegan', 'Keto', 'Low-Carb', 'Weight Loss'] },
    { _id: 'ing-3', name: 'Massaged Kale', category: 'base', subCategory: 'greens', price: 4.0, calories: 55, protein: 4, carbs: 9, fat: 1, inStock: true, dietTags: ['Vegan', 'Keto', 'Low-Carb', 'Weight Loss'] },
    { _id: 'ing-4', name: 'Tri-Color Quinoa', category: 'base', subCategory: 'grains', price: 4.5, calories: 180, protein: 7, carbs: 32, fat: 3, inStock: true, dietTags: ['Vegan', 'High-Protein'] },

    // Toppings (7)
    { _id: 'ing-5', name: 'Cherry Tomatoes', category: 'topping', subCategory: 'vegetables', price: 1.25, calories: 25, protein: 1, carbs: 5, fat: 0, inStock: true, dietTags: ['Vegan', 'Keto', 'Low-Carb', 'Weight Loss'] },
    { _id: 'ing-6', name: 'English Cucumber', category: 'topping', subCategory: 'vegetables', price: 1.0, calories: 15, protein: 1, carbs: 3, fat: 0, inStock: true, dietTags: ['Vegan', 'Keto', 'Low-Carb', 'Weight Loss'] },
    { _id: 'ing-7', name: 'Hass Avocado', category: 'topping', subCategory: 'fruits', price: 2.5, calories: 160, protein: 2, carbs: 8, fat: 15, inStock: true, dietTags: ['Vegan', 'Keto', 'Low-Carb'] },
    { _id: 'ing-8', name: 'Green Apple Slices', category: 'topping', subCategory: 'fruits', price: 1.5, calories: 55, protein: 0, carbs: 14, fat: 0, inStock: true, dietTags: ['Vegan', 'Weight Loss'] },
    { _id: 'ing-9', name: 'Roasted Almonds', category: 'topping', subCategory: 'nuts', price: 1.75, calories: 110, protein: 4, carbs: 4, fat: 9, inStock: true, dietTags: ['Vegan', 'Keto', 'Low-Carb', 'High-Protein'] },
    { _id: 'ing-10', name: 'Pumpkin Seeds', category: 'topping', subCategory: 'seeds', price: 1.5, calories: 95, protein: 5, carbs: 3, fat: 8, inStock: true, dietTags: ['Vegan', 'Keto', 'Low-Carb', 'High-Protein'] },
    { _id: 'ing-11', name: 'Kalamata Olives', category: 'topping', subCategory: 'vegetables', price: 1.5, calories: 70, protein: 0, carbs: 2, fat: 7, inStock: true, dietTags: ['Vegan', 'Keto', 'Low-Carb'] },

    // Proteins (5)
    { _id: 'ing-12', name: 'Herb Grilled Chicken', category: 'protein', subCategory: 'poultry', price: 4.5, calories: 190, protein: 34, carbs: 1, fat: 5, inStock: true, dietTags: ['Keto', 'Low-Carb', 'High-Protein'] },
    { _id: 'ing-13', name: 'Marinated Paneer', category: 'protein', subCategory: 'dairy', price: 4.25, calories: 210, protein: 16, carbs: 3, fat: 15, inStock: true, dietTags: ['Keto', 'Low-Carb', 'High-Protein'] },
    { _id: 'ing-14', name: 'Sesame Tofu', category: 'protein', subCategory: 'plant', price: 3.75, calories: 165, protein: 18, carbs: 5, fat: 9, inStock: true, dietTags: ['Vegan', 'Keto', 'Low-Carb', 'High-Protein'] },
    { _id: 'ing-15', name: 'Soft-Boiled Egg', category: 'protein', subCategory: 'egg', price: 2.5, calories: 140, protein: 12, carbs: 1, fat: 10, inStock: true, dietTags: ['Keto', 'Low-Carb', 'High-Protein'] },
    { _id: 'ing-16', name: 'Roasted Chickpeas', category: 'protein', subCategory: 'plant', price: 3.25, calories: 175, protein: 10, carbs: 24, fat: 4, inStock: true, dietTags: ['Vegan', 'Weight Loss'] },

    // Dressings (4)
    { _id: 'ing-17', name: 'Extra Virgin Olive Oil', category: 'dressing', subCategory: 'oil', price: 1.25, calories: 120, protein: 0, carbs: 0, fat: 14, inStock: true, dietTags: ['Vegan', 'Keto', 'Low-Carb'] },
    { _id: 'ing-18', name: 'Zesty Lemon Vinaigrette', category: 'dressing', subCategory: 'vinaigrette', price: 1.25, calories: 75, protein: 0, carbs: 3, fat: 7, inStock: true, dietTags: ['Vegan', 'Low-Carb', 'Weight Loss'] },
    { _id: 'ing-19', name: 'Greek Yogurt Herb', category: 'dressing', subCategory: 'creamy', price: 1.5, calories: 80, protein: 4, carbs: 4, fat: 5, inStock: true, dietTags: ['Low-Carb', 'High-Protein', 'Weight Loss'] },
    { _id: 'ing-20', name: 'Aged Balsamic Glaze', category: 'dressing', subCategory: 'vinaigrette', price: 1.25, calories: 65, protein: 0, carbs: 9, fat: 3, inStock: true, dietTags: ['Vegan', 'Weight Loss'] },
  ];

  const users: StoredUser[] = [
    {
      _id: 'user-admin',
      name: 'Elena Vance',
      email: 'admin@freshbowl.com',
      password: 'Admin123!',
      role: 'admin',
      phone: '+1 (415) 555-0100',
      address: '740 Valencia St, San Francisco, CA',
      status: 'active',
      membershipPlan: null,
      joinedDate: new Date(now - 90 * 86400000).toISOString(),
    },
    {
      _id: 'user-member-1',
      name: 'Maya Lin',
      email: 'member@freshbowl.com',
      password: 'Member123!',
      role: 'member',
      phone: '+1 (415) 555-0148',
      address: '2140 Market St, Apt 4B, San Francisco, CA',
      status: 'active',
      membershipPlan: 'plan-monthly',
      joinedDate: new Date(now - 28 * 86400000).toISOString(),
    },
    {
      _id: 'user-member-2',
      name: 'Daniel Brooks',
      email: 'daniel.brooks@example.com',
      password: 'Member123!',
      role: 'member',
      phone: '+1 (415) 555-0182',
      address: '890 Folsom St, Suite 210, San Francisco, CA',
      status: 'active',
      membershipPlan: 'plan-premium',
      joinedDate: new Date(now - 14 * 86400000).toISOString(),
    },
    {
      _id: 'user-member-3',
      name: 'Priya Nair',
      email: 'priya.nair@example.com',
      password: 'Member123!',
      role: 'member',
      phone: '+1 (415) 555-0194',
      address: '455 Mission St, Floor 3, San Francisco, CA',
      status: 'inactive',
      membershipPlan: 'plan-weekly',
      joinedDate: new Date(now - 45 * 86400000).toISOString(),
    },
  ];

  const subscriptions: StoredSubscription[] = [
    {
      _id: 'sub-1',
      user: 'user-member-1',
      plan: 'plan-monthly',
      frequency: '5_per_week',
      deliveryDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      timeSlot: '12:00 PM - 1:00 PM',
      deliveryAddress: '2140 Market St, Apt 4B, San Francisco, CA',
      preferredSalad: 'salad-1',
      customSalad: null,
      status: 'active',
      startDate: new Date(now - 12 * 86400000).toISOString(),
      nextRenewalDate: new Date(now + 18 * 86400000).toISOString(),
    },
    {
      _id: 'sub-2',
      user: 'user-member-2',
      plan: 'plan-premium',
      frequency: '1_per_day',
      deliveryDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      timeSlot: '8:00 AM - 9:00 AM',
      deliveryAddress: '890 Folsom St, Suite 210, San Francisco, CA',
      preferredSalad: 'salad-2',
      customSalad: null,
      status: 'active',
      startDate: new Date(now - 5 * 86400000).toISOString(),
      nextRenewalDate: new Date(now + 25 * 86400000).toISOString(),
    },
  ];

  const favorites: StoredFavorite[] = [
    {
      _id: 'fav-1',
      user: 'user-member-1',
      name: 'Maya Midday Protein Bowl',
      base: {
        ingredientId: 'ing-3',
        name: 'Massaged Kale',
        price: 4.0,
        calories: 55,
        protein: 4,
        carbs: 9,
        fat: 1,
      },
      toppings: [
        {
          ingredientId: 'ing-5',
          name: 'Cherry Tomatoes',
          price: 1.25,
          calories: 25,
          protein: 1,
          carbs: 5,
          fat: 0,
        },
        {
          ingredientId: 'ing-7',
          name: 'Hass Avocado',
          price: 2.5,
          calories: 160,
          protein: 2,
          carbs: 8,
          fat: 15,
        },
      ],
      protein: {
        ingredientId: 'ing-14',
        name: 'Sesame Tofu',
        price: 3.75,
        calories: 165,
        protein: 18,
        carbs: 5,
        fat: 9,
      },
      dressing: {
        ingredientId: 'ing-18',
        name: 'Zesty Lemon Vinaigrette',
        price: 1.25,
        calories: 75,
        protein: 0,
        carbs: 3,
        fat: 7,
      },
      totalPrice: 12.75,
      totalCalories: 480,
      totalProtein: 25,
      totalCarbs: 30,
      totalFat: 32,
      createdAt: new Date(now - 7 * 86400000).toISOString(),
    },
  ];

  const orders: Order[] = [
    {
      _id: 'order-1',
      orderNumber: 'FB-1041',
      user: {
        _id: 'user-member-1',
        name: 'Maya Lin',
        email: 'member@freshbowl.com',
        phone: '+1 (415) 555-0148',
      },
      items: [
        {
          itemType: 'ready',
          salad: 'salad-1',
          name: 'Mediterranean Quinoa & Chickpea',
          image: IMAGES.quinoa,
          quantity: 1,
          unitPrice: 13.5,
          calories: 440,
          protein: 18,
          carbs: 52,
          fat: 16,
        },
        {
          itemType: 'ready',
          salad: 'salad-3',
          name: 'Emerald Detox Greens',
          image: IMAGES.detox,
          quantity: 1,
          unitPrice: 12.75,
          calories: 320,
          protein: 16,
          carbs: 28,
          fat: 14,
        },
      ],
      subtotal: 26.25,
      deliveryFee: 0,
      totalAmount: 26.25,
      deliveryAddress: '2140 Market St, Apt 4B, San Francisco, CA',
      phone: '+1 (415) 555-0148',
      deliveryNote: 'Leave with lobby concierge.',
      paymentMethod: 'Cash on Delivery',
      status: 'Delivered',
      createdAt: new Date(now - 3 * 86400000).toISOString(),
    },
    {
      _id: 'order-2',
      orderNumber: 'FB-1042',
      user: {
        _id: 'user-member-1',
        name: 'Maya Lin',
        email: 'member@freshbowl.com',
        phone: '+1 (415) 555-0148',
      },
      items: [
        {
          itemType: 'ready',
          salad: 'salad-4',
          name: 'Sesame Tofu Superfood Crunch',
          image: IMAGES.tofu,
          quantity: 2,
          unitPrice: 14.5,
          calories: 495,
          protein: 32,
          carbs: 38,
          fat: 22,
        },
      ],
      subtotal: 29.0,
      deliveryFee: 0,
      totalAmount: 29.0,
      deliveryAddress: '2140 Market St, Apt 4B, San Francisco, CA',
      phone: '+1 (415) 555-0148',
      deliveryNote: 'Ring Apt 4B.',
      paymentMethod: 'Cash on Delivery',
      status: 'Preparing',
      createdAt: new Date(now).toISOString(),
    },
    {
      _id: 'order-3',
      orderNumber: 'FB-1043',
      user: {
        _id: 'user-member-2',
        name: 'Daniel Brooks',
        email: 'daniel.brooks@example.com',
        phone: '+1 (415) 555-0182',
      },
      items: [
        {
          itemType: 'ready',
          salad: 'salad-2',
          name: 'Keto Avocado Herb Cobb',
          image: IMAGES.keto,
          quantity: 1,
          unitPrice: 15.5,
          calories: 520,
          protein: 42,
          carbs: 9,
          fat: 35,
        },
      ],
      subtotal: 15.5,
      deliveryFee: 2.5,
      totalAmount: 18.0,
      deliveryAddress: '890 Folsom St, Suite 210, San Francisco, CA',
      phone: '+1 (415) 555-0182',
      deliveryNote: '',
      paymentMethod: 'Cash on Delivery',
      status: 'Out for Delivery',
      createdAt: new Date(now).toISOString(),
    },
  ];

  return { users, plans, salads, ingredients, subscriptions, orders, favorites };
}

export function loadDB(): FreshBowlDB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      return JSON.parse(raw) as FreshBowlDB;
    }
  } catch {
    // Re-seed if corrupted
  }
  const initial = createInitialDB();
  saveDB(initial);
  return initial;
}

export function saveDB(db: FreshBowlDB): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}
