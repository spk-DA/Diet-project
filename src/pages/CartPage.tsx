import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import SaladImage from '../components/SaladImage';

export default function CartPage() {
  const { items, subtotal, deliveryFee, totalAmount, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-white border border-[#E4EBE1] rounded-2xl p-10">
          <h1 className="font-display text-3xl font-semibold text-[#111C16]">Your cart is empty</h1>
          <p className="text-sm text-[#526056] mt-2">
            Explore our ready-made diet bowls or build your own custom salad with live macro tracking.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/menu"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1B6B3A] hover:bg-[#14532D] rounded-lg transition-colors"
            >
              Browse Menu
            </Link>
            <Link
              to="/customize"
              className="px-5 py-2.5 text-sm font-semibold text-[#111C16] bg-[#F2F5F0] hover:bg-[#E4EBE1] rounded-lg transition-colors"
            >
              Customize Salad
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const remainingForFreeDelivery = Math.max(0, Number((25 - subtotal).toFixed(2)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl font-semibold text-[#111C16] pb-6 border-b border-[#E4EBE1]">
        Shopping Cart
      </h1>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#E4EBE1] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-5"
            >
              <div className="w-full sm:w-24 h-24 rounded-xl overflow-hidden bg-[#F2F5F0] shrink-0">
                <SaladImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-[#1B6B3A]">
                      {item.itemType === 'custom' ? 'Custom Bowl' : 'Signature Salad'}
                    </p>
                    <h2 className="text-base font-semibold text-[#111C16] mt-0.5">{item.name}</h2>
                  </div>
                  <span className="font-mono text-base font-semibold text-[#111C16] tabular-nums">
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </span>
                </div>

                <p className="text-xs text-[#526056] font-mono tabular-nums mt-1">
                  {item.calories} kcal · {item.protein}g P · {item.carbs}g C · {item.fat}g F
                </p>

                {item.customDetails && (
                  <p className="text-xs text-[#526056] mt-2">
                    {item.customDetails.base}
                    {item.customDetails.toppings.length > 0 ? `, ${item.customDetails.toppings.join(', ')}` : ''}
                    {item.customDetails.protein !== 'None' ? `, ${item.customDetails.protein}` : ''}
                    {item.customDetails.dressing !== 'None' ? `, ${item.customDetails.dressing}` : ''}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="inline-flex items-center border border-[#E4EBE1] rounded-lg bg-[#FAFBF9]">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-2 text-[#111C16] hover:bg-[#F2F5F0] rounded-l-lg"
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-sm font-mono font-semibold tabular-nums">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-2 text-[#111C16] hover:bg-[#F2F5F0] rounded-r-lg"
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 hover:text-red-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="lg:col-span-4 bg-white border border-[#E4EBE1] rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#111C16]">Order Summary</h2>

          {remainingForFreeDelivery > 0 ? (
            <p className="text-xs text-[#526056] p-3 rounded-lg bg-[#FAFBF9] border border-[#E4EBE1]">
              Add <span className="font-mono font-semibold text-[#111C16]">${remainingForFreeDelivery.toFixed(2)}</span>{' '}
              more to unlock free chilled delivery.
            </p>
          ) : (
            <p className="text-xs text-[#1B6B3A] p-3 rounded-lg bg-[#ECFDF3] font-medium">
              Your order qualifies for free chilled delivery.
            </p>
          )}

          <div className="space-y-2.5 text-sm pt-2">
            <div className="flex justify-between text-[#526056]">
              <span>Subtotal</span>
              <span className="font-mono text-[#111C16] tabular-nums">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#526056]">
              <span>Delivery Fee</span>
              <span className="font-mono text-[#111C16] tabular-nums">
                {deliveryFee === 0 ? 'Free' : `$${deliveryFee.toFixed(2)}`}
              </span>
            </div>
            <div className="pt-3 border-t border-[#E4EBE1] flex justify-between font-semibold text-[#111C16]">
              <span>Total</span>
              <span className="font-mono text-lg tabular-nums">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-white bg-[#1B6B3A] hover:bg-[#14532D] rounded-lg transition-colors"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </aside>
      </div>
    </div>
  );
}
