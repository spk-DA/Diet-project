import { FormEvent, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import api from '../api/client';
import { AdminStats, DietType, Ingredient, IngredientCategory, Order, OrderStatus, Salad } from '../types';
import { useToast } from '../context/ToastContext';
import AdminLayout from '../components/AdminLayout';
import ConfirmModal from '../components/ConfirmModal';

const ORDER_STATUSES: OrderStatus[] = ['Placed', 'Preparing', 'Out for Delivery', 'Delivered'];
const DIET_TYPES: DietType[] = ['Vegan', 'Keto', 'Low-Carb', 'High-Protein', 'Weight Loss'];
const SALAD_IMAGES = [
  { label: 'Mediterranean Quinoa', value: '/src/assets/images/salad_mediterranean_quinoa_1794716158637.jpg' },
  { label: 'Keto Avocado Cobb', value: '/src/assets/images/salad_keto_avocado_cobb_1794716158856.jpg' },
  { label: 'Vegan Green Detox', value: '/src/assets/images/salad_vegan_greens_detox_1794716160028.jpg' },
  { label: 'Protein Tofu Crunch', value: '/src/assets/images/salad_protein_tofu_crunch_1794716160536.jpg' },
  { label: 'Harvest Hero Bowl', value: '/src/assets/images/hero_fresh_salad_1794716157514.jpg' },
];

export default function AdminDashboardPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'orders' | 'salads' | 'ingredients'>('orders');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [salads, setSalads] = useState<Salad[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [orderFilter, setOrderFilter] = useState<'All' | OrderStatus>('All');
  const [loading, setLoading] = useState(true);

  // Salad Modal State
  const [saladModalOpen, setSaladModalOpen] = useState(false);
  const [editingSalad, setEditingSalad] = useState<Salad | null>(null);
  const [saladForm, setSaladForm] = useState({
    name: '',
    description: '',
    dietType: 'High-Protein' as DietType,
    image: SALAD_IMAGES[0].value,
    calories: 420,
    protein: 28,
    carbs: 24,
    fat: 18,
    price: 14.0,
    inStock: true,
  });

  // Ingredient Modal State
  const [ingModalOpen, setIngModalOpen] = useState(false);
  const [editingIng, setEditingIng] = useState<Ingredient | null>(null);
  const [ingForm, setIngForm] = useState({
    name: '',
    category: 'topping' as IngredientCategory,
    subCategory: 'vegetables',
    price: 1.5,
    calories: 40,
    protein: 2,
    carbs: 6,
    fat: 1,
    inStock: true,
  });

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'salad' | 'ingredient'; id: string; name: string } | null>(
    null
  );

  const loadData = async () => {
    try {
      const [statsRes, ordersRes, saladsRes, ingRes] = await Promise.all([
        api.get<{ stats: AdminStats }>('/admin/stats'),
        api.get<{ orders: Order[] }>('/orders'),
        api.get<{ salads: Salad[] }>('/salads?includeOutOfStock=true'),
        api.get<{ ingredients: Ingredient[] }>('/ingredients?includeOutOfStock=true'),
      ]);
      setStats(statsRes.data.stats);
      setOrders(ordersRes.data.orders);
      setSalads(saladsRes.data.salads);
      setIngredients(ingRes.data.ingredients);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOrderStatusUpdate = async (orderId: string, status: OrderStatus) => {
    try {
      const { data } = await api.patch<{ order: Order }>(`/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => (o._id === orderId ? data.order : o)));
      showToast(`Order ${data.order.orderNumber} updated to ${status}.`);
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const openSaladModal = (salad?: Salad) => {
    if (salad) {
      setEditingSalad(salad);
      setSaladForm({
        name: salad.name,
        description: salad.description,
        dietType: salad.dietType,
        image: salad.image,
        calories: salad.calories,
        protein: salad.protein,
        carbs: salad.carbs,
        fat: salad.fat,
        price: salad.price,
        inStock: salad.inStock,
      });
    } else {
      setEditingSalad(null);
      setSaladForm({
        name: '',
        description: '',
        dietType: 'High-Protein',
        image: SALAD_IMAGES[0].value,
        calories: 420,
        protein: 28,
        carbs: 24,
        fat: 18,
        price: 14.0,
        inStock: true,
      });
    }
    setSaladModalOpen(true);
  };

  const saveSalad = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingSalad) {
        const { data } = await api.put<{ salad: Salad }>(`/salads/${editingSalad._id}`, saladForm);
        setSalads((prev) => prev.map((s) => (s._id === editingSalad._id ? data.salad : s)));
        showToast('Salad updated.');
      } else {
        const { data } = await api.post<{ salad: Salad }>('/salads', saladForm);
        setSalads((prev) => [data.salad, ...prev]);
        showToast('New salad added to menu.');
      }
      setSaladModalOpen(false);
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const toggleSaladStock = async (salad: Salad) => {
    try {
      const { data } = await api.put<{ salad: Salad }>(`/salads/${salad._id}`, { inStock: !salad.inStock });
      setSalads((prev) => prev.map((s) => (s._id === salad._id ? data.salad : s)));
      showToast(`${salad.name} marked ${data.salad.inStock ? 'in stock' : 'out of stock'}.`);
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const openIngredientModal = (ing?: Ingredient) => {
    if (ing) {
      setEditingIng(ing);
      setIngForm({
        name: ing.name,
        category: ing.category,
        subCategory: ing.subCategory,
        price: ing.price,
        calories: ing.calories,
        protein: ing.protein,
        carbs: ing.carbs,
        fat: ing.fat,
        inStock: ing.inStock,
      });
    } else {
      setEditingIng(null);
      setIngForm({
        name: '',
        category: 'topping',
        subCategory: 'vegetables',
        price: 1.5,
        calories: 40,
        protein: 2,
        carbs: 6,
        fat: 1,
        inStock: true,
      });
    }
    setIngModalOpen(true);
  };

  const saveIngredient = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingIng) {
        const { data } = await api.put<{ ingredient: Ingredient }>(`/ingredients/${editingIng._id}`, ingForm);
        setIngredients((prev) => prev.map((i) => (i._id === editingIng._id ? data.ingredient : i)));
        showToast('Ingredient updated.');
      } else {
        const { data } = await api.post<{ ingredient: Ingredient }>('/ingredients', ingForm);
        setIngredients((prev) => [...prev, data.ingredient]);
        showToast('Ingredient added.');
      }
      setIngModalOpen(false);
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const toggleIngredientStock = async (ing: Ingredient) => {
    try {
      const { data } = await api.put<{ ingredient: Ingredient }>(`/ingredients/${ing._id}`, {
        inStock: !ing.inStock,
      });
      setIngredients((prev) => prev.map((i) => (i._id === ing._id ? data.ingredient : i)));
      showToast(`${ing.name} marked ${data.ingredient.inStock ? 'in stock' : 'out of stock'}.`);
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'salad') {
        await api.delete(`/salads/${deleteTarget.id}`);
        setSalads((prev) => prev.filter((s) => s._id !== deleteTarget.id));
        showToast('Salad removed from menu.');
      } else {
        await api.delete(`/ingredients/${deleteTarget.id}`);
        setIngredients((prev) => prev.filter((i) => i._id !== deleteTarget.id));
        showToast('Ingredient removed.');
      }
      setDeleteTarget(null);
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  const filteredOrders = orderFilter === 'All' ? orders : orders.filter((o) => o.status === orderFilter);

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Monitor daily revenue, active subscriptions, order fulfillment, and kitchen inventory."
    >
      {/* Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E4EBE1] rounded-xl p-5">
          <p className="text-xs font-medium text-[#526056]">Total Members</p>
          <p className="font-mono text-2xl font-semibold text-[#111C16] tabular-nums mt-2">
            {loading ? '—' : stats?.totalMembers ?? 0}
          </p>
          <p className="text-xs text-[#526056] mt-1">{stats?.activeMembers ?? 0} active accounts</p>
        </div>

        <div className="bg-white border border-[#E4EBE1] rounded-xl p-5">
          <p className="text-xs font-medium text-[#526056]">Active Subscriptions</p>
          <p className="font-mono text-2xl font-semibold text-[#1B6B3A] tabular-nums mt-2">
            {loading ? '—' : stats?.activeSubscriptions ?? 0}
          </p>
          <p className="text-xs text-[#526056] mt-1">Recurring meal plans</p>
        </div>

        <div className="bg-white border border-[#E4EBE1] rounded-xl p-5">
          <p className="text-xs font-medium text-[#526056]">Today's Orders</p>
          <p className="font-mono text-2xl font-semibold text-[#111C16] tabular-nums mt-2">
            {loading ? '—' : stats?.todaysOrders ?? 0}
          </p>
          <p className="text-xs text-[#526056] mt-1">{stats?.totalOrders ?? 0} total orders</p>
        </div>

        <div className="bg-white border border-[#E4EBE1] rounded-xl p-5">
          <p className="text-xs font-medium text-[#526056]">Total Revenue</p>
          <p className="font-mono text-2xl font-semibold text-[#111C16] tabular-nums mt-2">
            {loading ? '—' : `$${(stats?.totalRevenue ?? 0).toFixed(2)}`}
          </p>
          <p className="text-xs text-[#526056] mt-1">Orders + active plans</p>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex p-1 bg-[#F2F5F0] rounded-xl">
          {(
            [
              { id: 'orders', label: `Orders (${orders.length})` },
              { id: 'salads', label: `Salads (${salads.length})` },
              { id: 'ingredients', label: `Ingredients (${ingredients.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'bg-white text-[#1B6B3A] shadow-sm' : 'text-[#526056] hover:text-[#111C16]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'salads' && (
          <button
            type="button"
            onClick={() => openSaladModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#1B6B3A] hover:bg-[#14532D] rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Salad</span>
          </button>
        )}

        {activeTab === 'ingredients' && (
          <button
            type="button"
            onClick={() => openIngredientModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#1B6B3A] hover:bg-[#14532D] rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ingredient</span>
          </button>
        )}
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-[#E4EBE1] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#E4EBE1] flex flex-wrap items-center gap-2">
            {(['All', ...ORDER_STATUSES] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setOrderFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  orderFilter === status
                    ? 'border-[#1B6B3A] bg-[#ECFDF3] text-[#1B6B3A]'
                    : 'border-[#E4EBE1] text-[#526056]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E4EBE1] bg-[#FAFBF9] text-xs font-semibold text-[#526056]">
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EBE1]">
                {filteredOrders.map((order) => {
                  const customer = typeof order.user === 'object' ? order.user : null;
                  return (
                    <tr key={order._id} className="hover:bg-[#FAFBF9]">
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#111C16] tabular-nums">
                        {order.orderNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-[#111C16]">{customer?.name || 'Member'}</p>
                        <p className="text-xs text-[#526056]">{order.deliveryAddress}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#526056]">
                        {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#111C16] tabular-nums">
                        ${order.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleOrderStatusUpdate(order._id, e.target.value as OrderStatus)}
                          aria-label={`Status for order ${order.orderNumber}`}
                          className="px-2.5 py-1.5 text-xs font-medium border border-[#E4EBE1] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]"
                        >
                          {ORDER_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-[#526056]">
                      No orders in this status.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Salads Tab */}
      {activeTab === 'salads' && (
        <div className="bg-white border border-[#E4EBE1] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E4EBE1] bg-[#FAFBF9] text-xs font-semibold text-[#526056]">
                  <th className="py-3 px-4">Salad</th>
                  <th className="py-3 px-4">Diet Type</th>
                  <th className="py-3 px-4 text-right">Calories</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4">Availability</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EBE1]">
                {salads.map((salad) => (
                  <tr key={salad._id} className="hover:bg-[#FAFBF9]">
                    <td className="py-3.5 px-4 font-medium text-[#111C16]">{salad.name}</td>
                    <td className="py-3.5 px-4 text-xs text-[#526056]">{salad.dietType}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums">{salad.calories} kcal</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums">
                      ${salad.price.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => toggleSaladStock(salad)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                          salad.inStock ? 'bg-[#ECFDF3] text-[#1B6B3A]' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {salad.inStock ? 'In Stock' : 'Out of Stock'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openSaladModal(salad)}
                          className="p-1.5 text-[#526056] hover:text-[#111C16] rounded"
                          aria-label={`Edit ${salad.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ type: 'salad', id: salad._id, name: salad.name })}
                          className="p-1.5 text-red-700 hover:text-red-800 rounded"
                          aria-label={`Delete ${salad.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ingredients Tab */}
      {activeTab === 'ingredients' && (
        <div className="bg-white border border-[#E4EBE1] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E4EBE1] bg-[#FAFBF9] text-xs font-semibold text-[#526056]">
                  <th className="py-3 px-4">Ingredient</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Calories</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EBE1]">
                {ingredients.map((ing) => (
                  <tr key={ing._id} className="hover:bg-[#FAFBF9]">
                    <td className="py-3.5 px-4 font-medium text-[#111C16]">{ing.name}</td>
                    <td className="py-3.5 px-4 text-xs text-[#526056] capitalize">
                      {ing.category} · {ing.subCategory}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums">{ing.calories} kcal</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums">
                      ${ing.price.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => toggleIngredientStock(ing)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                          ing.inStock ? 'bg-[#ECFDF3] text-[#1B6B3A]' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {ing.inStock ? 'In Stock' : 'Out of Stock'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openIngredientModal(ing)}
                          className="p-1.5 text-[#526056] hover:text-[#111C16] rounded"
                          aria-label={`Edit ${ing.name}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ type: 'ingredient', id: ing._id, name: ing.name })}
                          className="p-1.5 text-red-700 hover:text-red-800 rounded"
                          aria-label={`Delete ${ing.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Salad Modal */}
      {saladModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="bg-white border border-[#E4EBE1] rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#111C16]">
                {editingSalad ? 'Edit Salad' : 'Add New Salad'}
              </h2>
              <button type="button" onClick={() => setSaladModalOpen(false)} aria-label="Close modal">
                <X className="w-5 h-5 text-[#526056]" />
              </button>
            </div>
            <form onSubmit={saveSalad} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111C16] mb-1">Salad Name</label>
                <input
                  type="text"
                  required
                  value={saladForm.name}
                  onChange={(e) => setSaladForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111C16] mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={saladForm.description}
                  onChange={(e) => setSaladForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111C16] mb-1">Diet Type</label>
                  <select
                    value={saladForm.dietType}
                    onChange={(e) => setSaladForm((f) => ({ ...f, dietType: e.target.value as DietType }))}
                    className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg bg-white"
                  >
                    {DIET_TYPES.map((dt) => (
                      <option key={dt} value={dt}>
                        {dt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111C16] mb-1">Studio Image</label>
                  <select
                    value={saladForm.image}
                    onChange={(e) => setSaladForm((f) => ({ ...f, image: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg bg-white"
                  >
                    {SALAD_IMAGES.map((img) => (
                      <option key={img.value} value={img.value}>
                        {img.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#526056] mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.25"
                    min="1"
                    required
                    value={saladForm.price}
                    onChange={(e) => setSaladForm((f) => ({ ...f, price: Number(e.target.value) }))}
                    className="w-full px-2.5 py-2 text-sm border border-[#E4EBE1] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#526056] mb-1">kcal</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={saladForm.calories}
                    onChange={(e) => setSaladForm((f) => ({ ...f, calories: Number(e.target.value) }))}
                    className="w-full px-2.5 py-2 text-sm border border-[#E4EBE1] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#526056] mb-1">Prot (g)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={saladForm.protein}
                    onChange={(e) => setSaladForm((f) => ({ ...f, protein: Number(e.target.value) }))}
                    className="w-full px-2.5 py-2 text-sm border border-[#E4EBE1] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#526056] mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={saladForm.carbs}
                    onChange={(e) => setSaladForm((f) => ({ ...f, carbs: Number(e.target.value) }))}
                    className="w-full px-2.5 py-2 text-sm border border-[#E4EBE1] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#526056] mb-1">Fat (g)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={saladForm.fat}
                    onChange={(e) => setSaladForm((f) => ({ ...f, fat: Number(e.target.value) }))}
                    className="w-full px-2.5 py-2 text-sm border border-[#E4EBE1] rounded-lg font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSaladModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium bg-[#F2F5F0] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#1B6B3A] rounded-lg"
                >
                  {editingSalad ? 'Save Changes' : 'Create Salad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Ingredient Modal */}
      {ingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="bg-white border border-[#E4EBE1] rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#111C16]">
                {editingIng ? 'Edit Ingredient' : 'Add Ingredient'}
              </h2>
              <button type="button" onClick={() => setIngModalOpen(false)} aria-label="Close modal">
                <X className="w-5 h-5 text-[#526056]" />
              </button>
            </div>
            <form onSubmit={saveIngredient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111C16] mb-1">Ingredient Name</label>
                <input
                  type="text"
                  required
                  value={ingForm.name}
                  onChange={(e) => setIngForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111C16] mb-1">Category</label>
                  <select
                    value={ingForm.category}
                    onChange={(e) => setIngForm((f) => ({ ...f, category: e.target.value as IngredientCategory }))}
                    className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg bg-white"
                  >
                    <option value="base">Base</option>
                    <option value="topping">Topping</option>
                    <option value="protein">Protein</option>
                    <option value="dressing">Dressing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111C16] mb-1">Sub-Category</label>
                  <input
                    type="text"
                    value={ingForm.subCategory}
                    onChange={(e) => setIngForm((f) => ({ ...f, subCategory: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#526056] mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    required
                    value={ingForm.price}
                    onChange={(e) => setIngForm((f) => ({ ...f, price: Number(e.target.value) }))}
                    className="w-full px-2 py-2 text-sm border border-[#E4EBE1] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#526056] mb-1">kcal</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={ingForm.calories}
                    onChange={(e) => setIngForm((f) => ({ ...f, calories: Number(e.target.value) }))}
                    className="w-full px-2 py-2 text-sm border border-[#E4EBE1] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#526056] mb-1">Prot</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={ingForm.protein}
                    onChange={(e) => setIngForm((f) => ({ ...f, protein: Number(e.target.value) }))}
                    className="w-full px-2 py-2 text-sm border border-[#E4EBE1] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#526056] mb-1">Carbs</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={ingForm.carbs}
                    onChange={(e) => setIngForm((f) => ({ ...f, carbs: Number(e.target.value) }))}
                    className="w-full px-2 py-2 text-sm border border-[#E4EBE1] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#526056] mb-1">Fat</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={ingForm.fat}
                    onChange={(e) => setIngForm((f) => ({ ...f, fat: Number(e.target.value) }))}
                    className="w-full px-2 py-2 text-sm border border-[#E4EBE1] rounded-lg font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIngModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium bg-[#F2F5F0] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#1B6B3A] rounded-lg"
                >
                  {editingIng ? 'Save Changes' : 'Add Ingredient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name}?`}
        description="This item will be permanently removed from the kitchen catalog."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
