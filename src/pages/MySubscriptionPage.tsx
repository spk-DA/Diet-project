import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, Pause, Play, XCircle, Check } from 'lucide-react';
import api from '../api/client';
import { CustomSaladSpec, FavoriteSalad, Plan, Salad, Subscription } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = ['8:00 AM - 9:00 AM', '12:00 PM - 1:00 PM', '6:00 PM - 7:00 PM'];

export default function MySubscriptionPage() {
  const { user } = useAuth();
  const { pendingSubscriptionCustom, setPendingSubscriptionCustom } = useCart();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [salads, setSalads] = useState<Salad[]>([]);
  const [favorites, setFavorites] = useState<FavoriteSalad[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [frequency, setFrequency] = useState<'1_per_day' | '5_per_week'>('5_per_week');
  const [deliveryDays, setDeliveryDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[1]);
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [bowlSource, setBowlSource] = useState<'ready' | 'custom'>('ready');
  const [preferredSaladId, setPreferredSaladId] = useState('');
  const [customSalad, setCustomSalad] = useState<CustomSaladSpec | null>(null);

  const [saving, setSaving] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<{ subscription: Subscription | null }>('/subscriptions/me'),
      api.get<{ plans: Plan[] }>('/plans'),
      api.get<{ salads: Salad[] }>('/salads'),
      api.get<{ favorites: FavoriteSalad[] }>('/favorites'),
    ])
      .then(([subRes, plansRes, saladsRes, favRes]) => {
        if (!active) return;
        const fetchedPlans = plansRes.data.plans;
        const fetchedSalads = saladsRes.data.salads;
        const sub = subRes.data.subscription;

        setPlans(fetchedPlans);
        setSalads(fetchedSalads);
        setFavorites(favRes.data.favorites);
        setSubscription(sub);

        const paramPlan = searchParams.get('plan');
        if (paramPlan) {
          setSelectedPlanId(paramPlan);
        } else if (sub?.plan?._id) {
          setSelectedPlanId(sub.plan._id);
        } else if (fetchedPlans[1]) {
          setSelectedPlanId(fetchedPlans[1]._id);
        } else if (fetchedPlans[0]) {
          setSelectedPlanId(fetchedPlans[0]._id);
        }

        if (pendingSubscriptionCustom) {
          setBowlSource('custom');
          setCustomSalad(pendingSubscriptionCustom);
        } else if (sub) {
          setFrequency(sub.frequency);
          setDeliveryDays(sub.deliveryDays);
          setTimeSlot(sub.timeSlot);
          setDeliveryAddress(sub.deliveryAddress);
          if (sub.customSalad) {
            setBowlSource('custom');
            setCustomSalad(sub.customSalad);
          } else if (sub.preferredSalad?._id) {
            setBowlSource('ready');
            setPreferredSaladId(sub.preferredSalad._id);
          }
        } else if (fetchedSalads[0]) {
          setPreferredSaladId(fetchedSalads[0]._id);
        }
      })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [searchParams, pendingSubscriptionCustom, showToast]);

  const toggleDay = (day: string) => {
    setDeliveryDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleFrequencyChange = (nextFreq: '1_per_day' | '5_per_week') => {
    setFrequency(nextFreq);
    if (nextFreq === '1_per_day') {
      setDeliveryDays(WEEKDAYS);
    } else {
      setDeliveryDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    }
  };

  const handleSelectFavoriteAsCustom = (fav: FavoriteSalad) => {
    setBowlSource('custom');
    setCustomSalad({
      name: fav.name,
      base: fav.base.name,
      toppings: fav.toppings.map((t) => t.name),
      protein: fav.protein?.name || 'None',
      dressing: fav.dressing?.name || 'None',
      totalCalories: fav.totalCalories,
      totalProtein: fav.totalProtein,
      totalCarbs: fav.totalCarbs,
      totalFat: fav.totalFat,
      price: fav.totalPrice,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) {
      showToast('Please select a membership plan.', 'error');
      return;
    }
    if (deliveryDays.length === 0) {
      showToast('Please select at least one delivery day.', 'error');
      return;
    }
    if (!deliveryAddress.trim()) {
      showToast('Please provide a delivery address.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        planId: selectedPlanId,
        frequency,
        deliveryDays,
        timeSlot,
        deliveryAddress: deliveryAddress.trim(),
        preferredSaladId: bowlSource === 'ready' ? preferredSaladId || null : null,
        customSalad: bowlSource === 'custom' ? customSalad : null,
      };
      const { data } = await api.post<{ subscription: Subscription }>('/subscriptions', payload);
      setSubscription(data.subscription);
      setPendingSubscriptionCustom(null);
      showToast('Subscription schedule saved and activated.');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (action: 'pause' | 'resume' | 'cancel') => {
    setActionLoading(true);
    try {
      const { data } = await api.patch<{ subscription: Subscription }>(`/subscriptions/${action}`);
      setSubscription(data.subscription);
      setCancelModalOpen(false);
      showToast(
        action === 'pause'
          ? 'Subscription paused.'
          : action === 'resume'
          ? 'Subscription resumed.'
          : 'Subscription cancelled.'
      );
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-10 w-64 bg-[#F2F5F0] rounded animate-pulse" />
        <div className="h-56 bg-white border border-[#E4EBE1] rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="pb-6 border-b border-[#E4EBE1] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#111C16]">My Subscription</h1>
          <p className="text-sm text-[#526056] mt-1">
            Manage your recurring salad deliveries, schedule windows, and renewal status.
          </p>
        </div>
        <Link
          to="/customize"
          className="text-sm font-semibold text-[#1B6B3A] hover:underline whitespace-nowrap"
        >
          Customize a new bowl for subscription
        </Link>
      </div>

      {/* Current Subscription Status Card */}
      {subscription && (
        <section className="bg-white border border-[#E4EBE1] rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-[#111C16]">{subscription.plan.name}</h2>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                    subscription.status === 'active'
                      ? 'bg-[#ECFDF3] text-[#1B6B3A]'
                      : subscription.status === 'paused'
                      ? 'bg-amber-50 text-amber-800'
                      : 'bg-red-50 text-red-800'
                  }`}
                >
                  Status: {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#526056]">
                <span>{subscription.frequency === '1_per_day' ? '1 salad per day' : '5 salads per week'}</span>
                <span aria-hidden="true">·</span>
                <span>Days: {subscription.deliveryDays.join(', ')}</span>
                <span aria-hidden="true">·</span>
                <span>Window: {subscription.timeSlot}</span>
              </div>

              <p className="text-sm text-[#526056]">
                <strong className="text-[#111C16]">Scheduled Bowl:</strong>{' '}
                {subscription.customSalad
                  ? `${subscription.customSalad.name} (Custom · ${subscription.customSalad.totalCalories} kcal)`
                  : subscription.preferredSalad?.name || "Chef's Daily Diet Selection"}
              </p>

              <p className="text-xs text-[#526056] flex items-center gap-1.5 pt-1">
                <Calendar className="w-3.5 h-3.5 text-[#1B6B3A]" />
                <span>Next Renewal Date:</span>
                <span className="font-mono font-semibold text-[#111C16] tabular-nums">
                  {new Date(subscription.nextRenewalDate).toLocaleDateString()}
                </span>
              </p>
            </div>

            {subscription.status !== 'cancelled' && (
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {subscription.status === 'active' ? (
                  <button
                    type="button"
                    onClick={() => handleStatusChange('pause')}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#111C16] bg-[#F2F5F0] hover:bg-[#E4EBE1] rounded-lg transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause Subscription</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStatusChange('resume')}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#1B6B3A] hover:bg-[#14532D] rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Resume Subscription</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(true)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Configure or Start Monthly Subscription */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#E4EBE1] rounded-2xl p-6 space-y-7">
        <div>
          <h2 className="text-xl font-semibold text-[#111C16]">
            {subscription && subscription.status !== 'cancelled'
              ? 'Update Plan or Delivery Schedule'
              : 'Start a Monthly Salad Subscription'}
          </h2>
          <p className="text-sm text-[#526056] mt-1">
            Pick your membership tier, delivery cadence, preferred days, and recurring bowl.
          </p>
        </div>

        {/* 1. Choose Plan */}
        <div className="space-y-3">
          <span className="block text-sm font-semibold text-[#111C16]">1. Select Membership Plan</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const selected = selectedPlanId === plan._id;
              return (
                <button
                  key={plan._id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan._id)}
                  className={`text-left p-4 rounded-xl border transition-colors flex flex-col justify-between ${
                    selected
                      ? 'border-[#1B6B3A] bg-[#ECFDF3]/60'
                      : 'border-[#E4EBE1] hover:border-[#1B6B3A]/40 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#111C16]">{plan.name}</p>
                      <p className="text-xs text-[#526056] mt-0.5">
                        {plan.saladsIncluded} salads · {plan.durationLabel}
                      </p>
                    </div>
                    {selected && <Check className="w-4 h-4 text-[#1B6B3A]" />}
                  </div>
                  <p className="font-mono text-lg font-semibold text-[#111C16] tabular-nums mt-3">
                    ${plan.price.toFixed(0)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Cadence & Days */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2.5">
            <span className="block text-sm font-semibold text-[#111C16]">2. Delivery Cadence</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleFrequencyChange('5_per_week')}
                className={`py-2.5 px-3 text-sm font-medium rounded-lg border ${
                  frequency === '5_per_week'
                    ? 'border-[#1B6B3A] bg-[#ECFDF3] text-[#1B6B3A]'
                    : 'border-[#E4EBE1] text-[#526056]'
                }`}
              >
                5 Salads / Week
              </button>
              <button
                type="button"
                onClick={() => handleFrequencyChange('1_per_day')}
                className={`py-2.5 px-3 text-sm font-medium rounded-lg border ${
                  frequency === '1_per_day'
                    ? 'border-[#1B6B3A] bg-[#ECFDF3] text-[#1B6B3A]'
                    : 'border-[#E4EBE1] text-[#526056]'
                }`}
              >
                1 Salad / Day
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="block text-sm font-semibold text-[#111C16]">3. Delivery Time Slot</span>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              aria-label="Delivery time slot"
              className="w-full px-3.5 py-2.5 text-sm border border-[#E4EBE1] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]"
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Delivery Days */}
        <div className="space-y-2.5">
          <span className="block text-sm font-semibold text-[#111C16]">4. Delivery Days</span>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => {
              const active = deliveryDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    active
                      ? 'border-[#1B6B3A] bg-[#1B6B3A] text-white'
                      : 'border-[#E4EBE1] bg-white text-[#526056] hover:text-[#111C16]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Choose Salad or Custom Bowl */}
        <div className="space-y-3">
          <span className="block text-sm font-semibold text-[#111C16]">5. Recurring Bowl Selection</span>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setBowlSource('ready')}
              className={`px-4 py-2 text-sm font-medium rounded-lg border ${
                bowlSource === 'ready'
                  ? 'border-[#1B6B3A] bg-[#ECFDF3] text-[#1B6B3A]'
                  : 'border-[#E4EBE1] text-[#526056]'
              }`}
            >
              Signature Menu Salad
            </button>
            <button
              type="button"
              onClick={() => setBowlSource('custom')}
              className={`px-4 py-2 text-sm font-medium rounded-lg border ${
                bowlSource === 'custom'
                  ? 'border-[#1B6B3A] bg-[#ECFDF3] text-[#1B6B3A]'
                  : 'border-[#E4EBE1] text-[#526056]'
              }`}
            >
              Custom / Saved Bowl
            </button>
          </div>

          {bowlSource === 'ready' ? (
            <select
              value={preferredSaladId}
              onChange={(e) => setPreferredSaladId(e.target.value)}
              aria-label="Preferred menu salad"
              className="w-full px-3.5 py-2.5 text-sm border border-[#E4EBE1] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]"
            >
              {salads.map((salad) => (
                <option key={salad._id} value={salad._id}>
                  {salad.name} ({salad.dietType} · {salad.calories} kcal)
                </option>
              ))}
            </select>
          ) : (
            <div className="p-4 rounded-xl bg-[#FAFBF9] border border-[#E4EBE1] space-y-3">
              {customSalad ? (
                <div>
                  <p className="text-sm font-semibold text-[#111C16]">{customSalad.name}</p>
                  <p className="text-xs text-[#526056] mt-1">
                    {customSalad.base}
                    {customSalad.toppings.length > 0 ? `, ${customSalad.toppings.join(', ')}` : ''}
                    {customSalad.protein !== 'None' ? `, ${customSalad.protein}` : ''}
                    {customSalad.dressing !== 'None' ? `, ${customSalad.dressing}` : ''}
                  </p>
                  <p className="text-xs font-mono text-[#1B6B3A] mt-1 tabular-nums">
                    {customSalad.totalCalories} kcal · {customSalad.totalProtein}g protein
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[#526056]">
                  No custom bowl selected yet. Pick one of your saved favorites below or{' '}
                  <Link to="/customize" className="text-[#1B6B3A] font-semibold underline">
                    build one now
                  </Link>
                  .
                </p>
              )}

              {favorites.length > 0 && (
                <div className="pt-2 border-t border-[#E4EBE1]">
                  <p className="text-xs font-semibold text-[#526056] mb-2">Or select from saved favorites:</p>
                  <div className="flex flex-wrap gap-2">
                    {favorites.map((fav) => (
                      <button
                        key={fav._id}
                        type="button"
                        onClick={() => handleSelectFavoriteAsCustom(fav)}
                        className="px-3 py-1.5 text-xs font-medium bg-white border border-[#E4EBE1] hover:border-[#1B6B3A] rounded-lg"
                      >
                        {fav.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 6. Delivery Address */}
        <div>
          <label htmlFor="sub-address" className="block text-sm font-semibold text-[#111C16] mb-1.5">
            6. Delivery Address
          </label>
          <input
            id="sub-address"
            type="text"
            required
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Street address, apartment or office suite"
            className="w-full px-3.5 py-2.5 text-sm border border-[#E4EBE1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]"
          />
        </div>

        <div className="pt-2 space-y-3">
          <p className="text-xs text-[#526056]">
            Payment Method: <strong className="text-[#111C16]">Cash on Delivery</strong> — no online card payment is
            required.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 text-sm font-semibold text-white bg-[#1B6B3A] hover:bg-[#14532D] rounded-lg transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving Subscription...' : 'Save & Activate Subscription'}
          </button>
        </div>
      </form>

      <ConfirmModal
        open={cancelModalOpen}
        title="Cancel Monthly Subscription?"
        description="Your recurring deliveries will stop immediately. You can start a new subscription at any time."
        confirmLabel="Cancel Subscription"
        loading={actionLoading}
        onConfirm={() => handleStatusChange('cancel')}
        onCancel={() => setCancelModalOpen(false)}
      />
    </div>
  );
}
