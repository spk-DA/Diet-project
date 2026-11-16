import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Package } from 'lucide-react';
import api from '../api/client';
import { Order, OrderStatus } from '../types';
import { useToast } from '../context/ToastContext';

const STATUS_STEPS: OrderStatus[] = ['Placed', 'Preparing', 'Out for Delivery', 'Delivered'];

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    api
      .get<{ orders: Order[] }>('/orders/my-orders')
      .then(({ data }) => {
        if (active) setOrders(data.orders);
      })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  const handleReorder = async (orderId: string) => {
    setReorderingId(orderId);
    try {
      const { data } = await api.post<{ order: Order }>(`/orders/${orderId}/reorder`);
      setOrders((prev) => [data.order, ...prev]);
      showToast(`Order ${data.order.orderNumber} placed again.`);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setReorderingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-4">
        <div className="h-9 w-48 bg-[#F2F5F0] rounded animate-pulse" />
        {[1, 2].map((n) => (
          <div key={n} className="h-48 bg-white border border-[#E4EBE1] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E4EBE1]">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#111C16]">My Orders</h1>
          <p className="text-sm text-[#526056] mt-1">
            Track live kitchen preparation and reorder past bowls in one click.
          </p>
        </div>
        <Link
          to="/menu"
          className="px-4 py-2 text-sm font-semibold text-white bg-[#1B6B3A] hover:bg-[#14532D] rounded-lg transition-colors whitespace-nowrap w-fit"
        >
          Order New Bowl
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="mt-10 bg-white border border-[#E4EBE1] rounded-2xl p-12 text-center">
          <Package className="w-8 h-8 text-[#526056] mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[#111C16]">No orders yet</h2>
          <p className="text-sm text-[#526056] mt-1">Your completed and active salad orders will appear here.</p>
          <Link
            to="/menu"
            className="inline-block mt-5 px-5 py-2.5 text-sm font-semibold text-white bg-[#1B6B3A] rounded-lg"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((order) => {
            const currentStepIdx = STATUS_STEPS.indexOf(order.status);
            return (
              <article key={order._id} className="bg-white border border-[#E4EBE1] rounded-2xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E4EBE1]">
                  <div>
                    <div className="flex items-center gap-2.5 text-xs text-[#526056]">
                      <span className="font-mono font-semibold text-[#111C16] tabular-nums">{order.orderNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      <span aria-hidden="true">·</span>
                      <span>{order.paymentMethod}</span>
                    </div>
                    <p className="text-sm text-[#526056] mt-1">{order.deliveryAddress}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-[#526056] block">Total</span>
                      <span className="font-mono text-lg font-semibold text-[#111C16] tabular-nums">
                        ${order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReorder(order._id)}
                      disabled={reorderingId === order._id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#1B6B3A] bg-[#ECFDF3] hover:bg-[#DDF7E8] rounded-lg transition-colors whitespace-nowrap disabled:opacity-60"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{reorderingId === order._id ? 'Reordering...' : 'Reorder'}</span>
                    </button>
                  </div>
                </div>

                {/* Explicit 4-Stage Fulfillment Tracker */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {STATUS_STEPS.map((step, idx) => {
                    const completed = idx <= currentStepIdx;
                    const active = idx === currentStepIdx;
                    return (
                      <div key={step} className="space-y-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            completed ? 'bg-[#1B6B3A]' : 'bg-[#E4EBE1]'
                          }`}
                        />
                        <p
                          className={`text-xs font-medium ${
                            active
                              ? 'text-[#1B6B3A] font-semibold'
                              : completed
                              ? 'text-[#111C16]'
                              : 'text-[#526056]'
                          }`}
                        >
                          {step}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Items */}
                <div className="divide-y divide-[#E4EBE1]">
                  {order.items.map((item, idx) => (
                    <div key={`${order._id}-${idx}`} className="py-3 flex items-start justify-between gap-4 text-sm">
                      <div>
                        <p className="font-medium text-[#111C16]">
                          {item.quantity} × {item.name}
                        </p>
                        <p className="text-xs text-[#526056] font-mono tabular-nums mt-0.5">
                          {item.calories} kcal · {item.protein}g P · {item.carbs}g C · {item.fat}g F
                        </p>
                        {item.customDetails && (
                          <p className="text-xs text-[#526056] mt-1">
                            {item.customDetails.base}
                            {item.customDetails.toppings?.length ? `, ${item.customDetails.toppings.join(', ')}` : ''}
                            {item.customDetails.protein && item.customDetails.protein !== 'None'
                              ? `, ${item.customDetails.protein}`
                              : ''}
                            {item.customDetails.dressing && item.customDetails.dressing !== 'None'
                              ? `, ${item.customDetails.dressing}`
                              : ''}
                          </p>
                        )}
                      </div>
                      <span className="font-mono font-medium text-[#111C16] tabular-nums shrink-0">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
