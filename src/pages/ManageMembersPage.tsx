import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, UserX, Trash2, X } from 'lucide-react';
import api from '../api/client';
import { Plan, User } from '../types';
import { useToast } from '../context/ToastContext';
import AdminLayout from '../components/AdminLayout';
import ConfirmModal from '../components/ConfirmModal';

export default function ManageMembersPage() {
  const { showToast } = useToast();
  const [members, setMembers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    membershipPlan: '',
    startDate: new Date().toISOString().split('T')[0],
    status: 'active' as 'active' | 'inactive',
  });

  const [removeTarget, setRemoveTarget] = useState<{ member: User; mode: 'delete' | 'deactivate' } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.get<{ members: User[] }>('/members'), api.get<{ plans: Plan[] }>('/plans?all=true')])
      .then(([membersRes, plansRes]) => {
        setMembers(membersRes.data.members);
        setPlans(plansRes.data.plans);
      })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      const q = search.trim().toLowerCase();
      const planName = typeof m.membershipPlan === 'object' && m.membershipPlan ? m.membershipPlan.name : '';
      const matchesQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        planName.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [members, search, statusFilter]);

  const openAddModal = () => {
    setEditingMember(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      password: '',
      membershipPlan: plans[0]?._id || '',
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEditModal = (member: User) => {
    setEditingMember(member);
    const planId =
      typeof member.membershipPlan === 'object' && member.membershipPlan
        ? member.membershipPlan._id
        : (member.membershipPlan as string) || '';
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      address: member.address || '',
      password: '',
      membershipPlan: planId,
      startDate: new Date(member.joinedDate).toISOString().split('T')[0],
      status: member.status,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingMember) {
        const { data } = await api.put<{ member: User }>(`/members/${editingMember._id}`, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          membershipPlan: form.membershipPlan || null,
          status: form.status,
          joinedDate: form.startDate,
        });
        setMembers((prev) => prev.map((m) => (m._id === editingMember._id ? data.member : m)));
        showToast(`Updated member ${data.member.name}.`);
      } else {
        const { data } = await api.post<{ member: User }>('/members', {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          password: form.password,
          membershipPlan: form.membershipPlan || null,
          startDate: form.startDate,
        });
        setMembers((prev) => [data.member, ...prev]);
        showToast(`Added member ${data.member.name}.`);
      }
      setModalOpen(false);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!removeTarget) return;
    setActionLoading(true);
    try {
      const { member, mode } = removeTarget;
      const { data } = await api.delete<{ message: string; member?: User }>(
        `/members/${member._id}?mode=${mode}`
      );
      if (mode === 'deactivate' && data.member) {
        setMembers((prev) => prev.map((m) => (m._id === member._id ? data.member! : m)));
      } else {
        setMembers((prev) => prev.filter((m) => m._id !== member._id));
      }
      showToast(data.message);
      setRemoveTarget(null);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Manage Members"
      subtitle="Search members, enroll new accounts, update plans, or deactivate/remove memberships."
      action={
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-[#1B6B3A] hover:bg-[#14532D] rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Member</span>
        </button>
      }
    >
      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#526056] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or plan..."
            aria-label="Search members"
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#E4EBE1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]"
          />
        </div>

        <div className="inline-flex p-1 bg-[#F2F5F0] rounded-xl w-fit">
          {(['all', 'active', 'inactive'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                statusFilter === status ? 'bg-white text-[#1B6B3A] shadow-sm' : 'text-[#526056]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white border border-[#E4EBE1] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#E4EBE1] bg-[#FAFBF9] text-xs font-semibold text-[#526056]">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EBE1]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-[#526056]">
                    Loading members...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-[#526056]">
                    No members match your search.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const planObj =
                    typeof member.membershipPlan === 'object' && member.membershipPlan
                      ? member.membershipPlan
                      : null;
                  return (
                    <tr key={member._id} className="hover:bg-[#FAFBF9]">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#111C16]">{member.name}</p>
                        <p className="text-xs text-[#526056]">
                          {member.email}
                          {member.phone ? ` · ${member.phone}` : ''}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-[#111C16]">
                        {planObj ? planObj.name : <span className="text-[#526056]">No Plan</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-md capitalize ${
                            member.status === 'active'
                              ? 'bg-[#ECFDF3] text-[#1B6B3A]'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#526056] tabular-nums">
                        {new Date(member.joinedDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(member)}
                            className="p-1.5 text-[#526056] hover:text-[#111C16] rounded"
                            title="Edit member"
                            aria-label={`Edit ${member.name}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRemoveTarget({ member, mode: 'deactivate' })}
                            className="p-1.5 text-amber-700 hover:text-amber-800 rounded"
                            title={member.status === 'active' ? 'Deactivate member' : 'Reactivate member'}
                            aria-label={`Toggle active status for ${member.name}`}
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRemoveTarget({ member, mode: 'delete' })}
                            className="p-1.5 text-red-700 hover:text-red-800 rounded"
                            title="Delete member"
                            aria-label={`Delete ${member.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Member Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="bg-white border border-[#E4EBE1] rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#111C16]">
                {editingMember ? `Edit ${editingMember.name}` : 'Add New Member'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close modal">
                <X className="w-5 h-5 text-[#526056]" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111C16] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111C16] mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111C16] mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111C16] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111C16] mb-1">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg"
                />
              </div>

              {!editingMember && (
                <div>
                  <label className="block text-xs font-semibold text-[#111C16] mb-1">Temporary Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111C16] mb-1">Membership Plan</label>
                  <select
                    value={form.membershipPlan}
                    onChange={(e) => setForm((f) => ({ ...f, membershipPlan: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg bg-white"
                  >
                    <option value="">No Plan Assigned</option>
                    {plans.map((plan) => (
                      <option key={plan._id} value={plan._id}>
                        {plan.name} (${plan.price})
                      </option>
                    ))}
                  </select>
                </div>

                {editingMember && (
                  <div>
                    <label className="block text-xs font-semibold text-[#111C16] mb-1">Account Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
                      className="w-full px-3 py-2 text-sm border border-[#E4EBE1] rounded-lg bg-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>

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
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#1B6B3A] rounded-lg disabled:opacity-60"
                >
                  {actionLoading ? 'Saving...' : editingMember ? 'Save Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Popup */}
      <ConfirmModal
        open={Boolean(removeTarget)}
        title={
          removeTarget?.mode === 'deactivate'
            ? removeTarget.member.status === 'active'
              ? `Deactivate ${removeTarget.member.name}?`
              : `Reactivate ${removeTarget?.member.name}?`
            : `Permanently Remove ${removeTarget?.member.name}?`
        }
        description={
          removeTarget?.mode === 'deactivate'
            ? removeTarget.member.status === 'active'
              ? 'This member will no longer be able to sign in until reactivated.'
              : 'This member will regain full access to their account.'
            : 'This will permanently delete the member account and any linked subscriptions.'
        }
        confirmLabel={
          removeTarget?.mode === 'deactivate'
            ? removeTarget.member.status === 'active'
              ? 'Deactivate'
              : 'Reactivate'
            : 'Delete Member'
        }
        destructive={removeTarget?.mode === 'delete' || removeTarget?.member.status === 'active'}
        loading={actionLoading}
        onConfirm={handleConfirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </AdminLayout>
  );
}
