import { Router } from 'express';
import { getMe, login, register } from '../controllers/authController.ts';
import {
  createIngredient,
  createPlan,
  createSalad,
  deleteIngredient,
  deletePlan,
  deleteSalad,
  listIngredients,
  listPlans,
  listSalads,
  updateIngredient,
  updatePlan,
  updateSalad,
} from '../controllers/menuController.ts';
import { createFavorite, deleteFavorite, listFavorites } from '../controllers/favoriteController.ts';
import {
  createOrUpdateSubscription,
  getMySubscription,
  patchSubscriptionStatus,
} from '../controllers/subscriptionController.ts';
import {
  createOrder,
  getMyOrders,
  listAllOrders,
  reorderOrder,
  updateOrderStatus,
} from '../controllers/orderController.ts';
import {
  createMember,
  deleteOrDeactivateMember,
  getAdminStats,
  listMembers,
  updateMember,
} from '../controllers/adminController.ts';
import { getStorageStatus } from '../db/repository.ts';
import { requireAdmin, requireAuth } from '../middleware/auth.ts';

const router = Router();

// Health Check
router.get('/health', (_req, res) => {
  const storage = getStorageStatus();
  res.json({
    ok: true,
    service: 'freshbowl-api',
    mode: storage.mode,
    supabaseConnected: storage.supabaseConnected,
    detail: storage.detail,
    paymentPolicy: 'Cash on Delivery Only',
  });
});

// Auth
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', requireAuth, getMe);

// Menu: Salads
router.get('/salads', listSalads);
router.post('/salads', requireAuth, requireAdmin, createSalad);
router.put('/salads/:id', requireAuth, requireAdmin, updateSalad);
router.delete('/salads/:id', requireAuth, requireAdmin, deleteSalad);

// Menu: Custom Builder Ingredients
router.get('/ingredients', listIngredients);
router.post('/ingredients', requireAuth, requireAdmin, createIngredient);
router.put('/ingredients/:id', requireAuth, requireAdmin, updateIngredient);
router.delete('/ingredients/:id', requireAuth, requireAdmin, deleteIngredient);

// Plans
router.get('/plans', listPlans);
router.post('/plans', requireAuth, requireAdmin, createPlan);
router.put('/plans/:id', requireAuth, requireAdmin, updatePlan);
router.delete('/plans/:id', requireAuth, requireAdmin, deletePlan);

// Member Favorites
router.get('/favorites', requireAuth, listFavorites);
router.post('/favorites', requireAuth, createFavorite);
router.delete('/favorites/:id', requireAuth, deleteFavorite);

// Member Subscriptions
router.get('/subscriptions/me', requireAuth, getMySubscription);
router.post('/subscriptions', requireAuth, createOrUpdateSubscription);
router.patch('/subscriptions/:action', requireAuth, patchSubscriptionStatus);

// Orders (Cash on Delivery Only)
router.get('/orders/my-orders', requireAuth, getMyOrders);
router.post('/orders', requireAuth, createOrder);
router.post('/orders/:id/reorder', requireAuth, reorderOrder);
router.get('/orders', requireAuth, requireAdmin, listAllOrders);
router.patch('/orders/:id/status', requireAuth, requireAdmin, updateOrderStatus);

// Admin Member & Stats Management
router.get('/members', requireAuth, requireAdmin, listMembers);
router.post('/members', requireAuth, requireAdmin, createMember);
router.put('/members/:id', requireAuth, requireAdmin, updateMember);
router.delete('/members/:id', requireAuth, requireAdmin, deleteOrDeactivateMember);
router.get('/admin/stats', requireAuth, requireAdmin, getAdminStats);

export default router;
