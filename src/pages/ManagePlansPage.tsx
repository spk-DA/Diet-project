import { FormEvent, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import api from '../api/client';
import { Plan } from '../types';
import { useToast } from '../context/ToastContext';
import AdminLayout from '../components/AdminLayout';
import ConfirmModal from '../components/ConfirmModal';

export default function ManagePlansPage() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState({
    name: '',
    price: 99,
    durationDays: 30,
    durationLabel: '30 Days',
    saladsIncluded: 20,
    cadenceLabel: '5 salads / week',
    benefitsText: '',
    isActive: true,
  });

  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ plans: Plan[] }>('/plans?all=true')
      .then(({ data }) => setPlans(data.plans))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const openModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setForm({
        name: plan.name,
        price: plan.price,
        durationDays: plan.durationDays,
        durationLabel: plan.durationLabel,
        saladsIncluded: plan.saladsIncluded,
        cadenceLabel: plan.cadenceLabel,
        benefitsText: plan.benefits.join('\n'),
        isActive: plan.isActive,
      });
    } else {
      setEditingPlan(null);
      setForm({
        name: '',
        price: 129,
        durationDays: 30,
        durationLabel: '30 Days',
        saladsIncluded: 15,
        cadenceLabel: '3–4 salads / week',
        benefitsText: 'Chilled morning or lunch delivery\nFull macro customization',
        isActive: true,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      durationDays: Number(form.durationDays),
      durationLabel: form.durationLabel.trim() || `${form.durationDays} Days`,
      saladsIncluded: Number(form.saladsIncluded),
      cadenceLabel: form.cadenceLabel.trim(),
      benefits: form.benefitsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      isActive: form.isActive,
    };

    try {
      if (editingPlan) {
        const { data } = await api.put<{ plan: Plan }>(`/plans/${editingPlan._id}`, payload);
        setPlans((prev) => prev.map((p) => (p._id === editingPlan._id ? data.plan : p)));
        showToast(`Updated ${data.plan.name}.`);
      } else {
        const { data } = await api.post<{ plan: Plan }>('/plans', payload);
        setPlans((prev) => [...prev, data.plan]);
        showToast(`Created ${data.plan.name}.`);
      }
      setModalOpen(false);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.delete(`/plans/${deleteTarget._id}`);
      setPlans((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      showToast(`Deleted ${deleteTarget.name}.`);
      setDeleteTarget(null);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Manage Plans"
      subtitle="Create, edit, or retire Weekly, Monthly, and Premium membership tiers."
      action={
        <button
          type="button"
          onClick={() => openModal()}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-[#1B6B3A] hover:bg-[#14532D] rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Create Plan</span>
        </button>
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-white border border-[#E4EBE1] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <article key={plan._id} className="bg-white border border-[#E4EBE1] rounded-2xl p-6 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-[#111C16]">{plan.name}</h2>
                  <p className="text-xs text-[#526056] mt-0.5">
                    {plan.durationLabel} · {plan.saladsIncluded} salads · {plan.cadenceLabel}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    plan.isActive ? 'bg-[#ECFDF3] text-[#1B6B3A]' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="font-mono text-2xl font-semibold text-[#111C16] tabular-nums mt-4">
                ${plan.price.toFixed(0)}
              </p>

              <ul className="mt-4 space-y-2 flex-1">
                {plan.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-xs text-[#526056]">
                    <Check className="w-3.5 h-3.5 text-[#1B6B3A] shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 pt-4 border-t border-[#E4EBE1] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => openModal(plan)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111C16] hover:text-[#1B6B3A]"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Plan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(plan)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="bg-white border border-[#E4EBE1] rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#111C16]">
                {editingPlan ? `Edit ${editingPlan.name}` : 'Create Membership Plan'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close modal">
                <X className="w-5 h-5 text-[#526056]" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111C16] mb-1">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111C16] mb-1">Price ($)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111C16] mb-1">Duration (days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.durationDays}
                    onChange={(e) => setForm((f) => ({ ...f, durationDays: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111C16] mb-1">Salads Included</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.saladsIncluded}
                    onChange={(e) => setForm((f) => ({ ...f, saladsIncluded: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111C16] mb-1">Cadence Label</label>
                  <input
                    type="text"
                    required
                    value={form.cadenceLabel}
                    onChange={(e) => setForm((f) => ({ ...f, cadenceLabel: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111C16] mb-1">
                  Benefits (one per line)
                </label>
                <textarea
                  rows={4}
                  value={form.benefitsText}
                  onChange={(e) => setForm((f) => ({ ...f, benefitsText: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-[#111C16]">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="rounded border-[#E4EBE1] text-[#1B6B3A] focus:ring-[#1B6B3A]"
                />
                <span>Plan is active and available for new subscriptions</span>
              </label>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium bg-[#F2F5F0] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#1B6B3A] rounded-lg disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingPlan ? 'Save Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name}?`}
        description="This membership plan will be permanently removed."
        confirmLabel="Delete Plan"
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
