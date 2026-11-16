import type { Response } from 'express';
import { repo } from '../db/repository.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import type { OrderItemRecord, OrderStatus } from '../types.ts';

const VALID_STATUSES: OrderStatus[] = ['Placed', 'Preparing', 'Out for Delivery', 'Delivered'];

export async function getMyOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const orders = await repo.listOrdersByUser(req.user!._id);
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const body = req.body || {};

    if (body.paymentMethod && body.paymentMethod !== 'Cash on Delivery') {
      res.status(400).json({ message: 'Only Cash on Delivery is accepted. Online payments are disabled.' });
      return;
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ message: 'Your cart is empty.' });
      return;
    }

    const deliveryAddress = String(body.deliveryAddress || '').trim();
    const phone = String(body.phone || '').trim();
    if (!deliveryAddress || !phone) {
      res.status(400).json({ message: 'Delivery address and phone number are required.' });
      return;
    }

    const catalogSalads = await repo.listSalads(true);
    const sanitizedItems: OrderItemRecord[] = [];

    for (const rawItem of body.items) {
      const quantity = Math.max(1, Math.floor(Number(rawItem.quantity) || 1));
      let unitPrice = Number(rawItem.unitPrice) || 0;
      let name = String(rawItem.name || 'FreshBowl Salad').trim();
      let image = String(rawItem.image || '');
      let calories = Math.max(0, Number(rawItem.calories) || 0);
      let protein = Math.max(0, Number(rawItem.protein) || 0);
      let carbs = Math.max(0, Number(rawItem.carbs) || 0);
      let fat = Math.max(0, Number(rawItem.fat) || 0);

      if (rawItem.itemType === 'ready' && rawItem.salad) {
        const catalogSalad = catalogSalads.find((s) => s._id === rawItem.salad);
        if (catalogSalad) {
          unitPrice = catalogSalad.price;
          name = catalogSalad.name;
          image = catalogSalad.image;
          calories = catalogSalad.calories;
          protein = catalogSalad.protein;
          carbs = catalogSalad.carbs;
          fat = catalogSalad.fat;
        }
      }

      sanitizedItems.push({
        itemType: rawItem.itemType === 'custom' ? 'custom' : 'ready',
        salad: rawItem.salad || null,
        name,
        image,
        quantity,
        unitPrice: Number(unitPrice.toFixed(2)),
        calories,
        protein,
        carbs,
        fat,
        ...(rawItem.customDetails ? { customDetails: rawItem.customDetails } : {}),
      });
    }

    const subtotal = Number(
      sanitizedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)
    );
    const deliveryFee = subtotal >= 25 ? 0 : 2.5;
    const totalAmount = Number((subtotal + deliveryFee).toFixed(2));

    const order = await repo.createOrder({
      user: req.user!,
      orderNumber: `FB-${Math.floor(1000 + Math.random() * 9000)}`,
      items: sanitizedItems,
      subtotal,
      deliveryFee,
      totalAmount,
      deliveryAddress,
      phone,
      deliveryNote: String(body.deliveryNote || '').trim(),
    });

    res.status(201).json({ order });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function reorderOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const prev = await repo.findOrderById(req.params.id);
    if (!prev) {
      res.status(404).json({ message: 'Previous order not found.' });
      return;
    }

    const ownerId = typeof prev.user === 'string' ? prev.user : prev.user._id;
    if (ownerId !== req.user!._id && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'You are not allowed to reorder this order.' });
      return;
    }

    const order = await repo.createOrder({
      user: req.user!,
      orderNumber: `FB-${Math.floor(1000 + Math.random() * 9000)}`,
      items: prev.items,
      subtotal: prev.subtotal,
      deliveryFee: prev.deliveryFee,
      totalAmount: prev.totalAmount,
      deliveryAddress: prev.deliveryAddress,
      phone: prev.phone,
      deliveryNote: prev.deliveryNote,
    });

    res.status(201).json({ order });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function listAllOrders(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const orders = await repo.listAllOrders();
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}

export async function updateOrderStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const nextStatus = req.body?.status as OrderStatus;
    if (!VALID_STATUSES.includes(nextStatus)) {
      res.status(400).json({ message: 'Invalid order status value.' });
      return;
    }

    const order = await repo.updateOrderStatus(req.params.id, nextStatus);
    if (!order) {
      res.status(404).json({ message: 'Order not found.' });
      return;
    }
    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
}
