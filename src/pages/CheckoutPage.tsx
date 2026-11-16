import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Banknote } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal, deliveryFee, totalAmount, clearCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (user) {
      if (!recipientName && user.name) setRecipientName(user.name);
      if (!deliveryAddress && user.address) setDeliveryAddress(user.address);
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user, recipientName, deliveryAddress, phone]);

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-[#E4EBE1] rounded-2xl p-8">
          <h1 className="font-display text-2xl font-semibold text-[#111C16]">No items to check out</h1>
          <p className="text-sm text-[#526056] mt-2">Add fresh bowls to your cart before placing an order.</p>
          <Link
            to="/menu"
            className="inline-block mt-5 px-5 py-2.5 text-sm font-semibold text-white bg-[#1B6B3A] rounded-lg"
          >
            Explore Menu
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!recipientName.trim()) {
      setFormError('Please enter the recipient name.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please provide a contact phone number for delivery verification.');
      return;
    }
    if (!deliveryAddress.trim()) {
      setFormError('Please enter your delivery address.');
      return;
    }

    const fullAddress = postalCode.trim()
      ? `${deliveryAddress.trim()}, ${postalCode.trim()}`
      : deliveryAddress.trim();

    setSubmitting(true);
    try {
      const payload = {
        items: items.map((item) => ({
          itemType: item.itemType,
          salad: item.saladId || null,
          name: item.name,
          image: item.image || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          customDetails: item.customDetails,
        })),
        deliveryAddress: fullAddress,
        phone: phone.trim(),
        deliveryNote: [
          `Recipient: ${recipientName.trim()}`,
          deliveryNote.trim(),
        ]
          .filter(Boolean)
          .join(' · '),
        paymentMethod: 'Cash on Delivery' as const,
      };

      const { data } = await api.post<{ order: { orderNumber: string } }>('/orders', payload);
      clearCart();
      showToast(`Order ${data.order.orderNumber} confirmed (Cash on Delivery).`);
      navigate('/orders');
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-semibold text-[#111C16] pb-6 border-b border-[#E4EBE1]">Checkout</h1>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white border border-[#E4EBE1] rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[#111C16]">Delivery & Cash on Delivery Verification</h2>
            <span className="text-xs font-medium text-[#1B6B3A]">Free delivery on orders $25+</span>
          </div>

          {formError && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">{formError}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="recipient-name" className="block text-sm font-medium text-[#111C16] mb-1.5">
                Recipient Name
              </label>
              <input
                id="recipient-name"
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Full name"
                className="w-full px-3.5 py-2.5 text-sm border border-[#E4EBE1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[#111C16] mb-1.5">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (415) 555-0148"
                className="w-full px-3.5 py-2.5 text-sm border border-[#E4EBE1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-[#111C16] mb-1.5">
                Delivery Address
              </label>
              <input
                id="address"
                type="text"
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Street address, apartment or suite"
                className="w-full px-3.5 py-2.5 text-sm border border-[#E4EBE1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]"
              />
            </div>

            <div>
              <label htmlFor="postal-code" className="block text-sm font-medium text-[#111C16] mb-1.5">
                Postal Code
              </label>
              <input
                id="postal-code"
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="94103"
                className="w-full px-3.5 py-2.5 text-sm border border-[#E4EBE1] rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-[#111C16] mb-1.5">
              Courier Instructions (Optional)
            </label>
            <textarea
              id="note"
              rows={2}
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
              placeholder="Gate code, concierge drop-off, etc."
              className="w-full px-3.5 py-2.5 text-sm border border-[#E4EBE1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]"
            />
          </div>

          {/* Cash on Delivery Only Notice */}
          <div className="p-4 rounded-xl bg-[#ECFDF3]/70 border border-[#1B6B3A]/25 flex items-start gap-3">
            <Banknote className="w-5 h-5 text-[#1B6B3A] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#111C16]">Cash on Delivery Only</p>
              <p className="text-xs text-[#526056] mt-0.5 leading-relaxed">
                No online payment is required. Please pay{' '}
                <span className="font-mono font-semibold text-[#111C16] tabular-nums">
                  ${totalAmount.toFixed(2)}
                </span>{' '}
                in cash when your fresh bowls arrive.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#1B6B3A] hover:bg-[#14532D] rounded-lg transition-colors disabled:opacity-60"
          >
            {submitting
              ? 'Placing Order...'
              : `Confirm Order · Pay $${totalAmount.toFixed(2)} on Delivery`}
          </button>
        </form>

        <aside className="lg:col-span-5 bg-white border border-[#E4EBE1] rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#111C16]">Order Items ({items.length})</h2>
          <div className="divide-y divide-[#E4EBE1]">
            {items.map((item) => (
              <div key={item.id} className="py-3 flex justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-[#111C16]">
                    {item.quantity} × {item.name}
                  </p>
                  <p className="text-xs text-[#526056] font-mono tabular-nums">{item.calories} kcal</p>
                </div>
                <span className="font-mono font-medium text-[#111C16] tabular-nums">
                  ${(item.unitPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#E4EBE1] space-y-2 text-sm">
            <div className="flex justify-between text-[#526056]">
              <span>Subtotal</span>
              <span className="font-mono text-[#111C16] tabular-nums">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#526056]">
              <span>Delivery Fee (Free $25+)</span>
              <span className="font-mono text-[#111C16] tabular-nums">
                {deliveryFee === 0 ? 'Free' : `$${deliveryFee.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-[#526056]">
              <span>Payment Method</span>
              <span className="font-medium text-[#1B6B3A]">Cash on Delivery</span>
            </div>
            <div className="pt-3 border-t border-[#E4EBE1] flex justify-between font-semibold text-[#111C16]">
              <span>Total Payable on Delivery</span>
              <span className="font-mono text-lg tabular-nums">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
