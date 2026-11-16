import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Plus } from 'lucide-react';
import api from '../api/client';
import { Plan, Salad } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import SaladImage from '../components/SaladImage';

export default function HomePage() {
  const [featuredSalads, setFeaturedSalads] = useState<Salad[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    Promise.all([api.get<{ salads: Salad[] }>('/salads'), api.get<{ plans: Plan[] }>('/plans')])
      .then(([saladsRes, plansRes]) => {
        if (!active) return;
        const featured = saladsRes.data.salads.filter((s) => s.featured).slice(0, 3);
        setFeaturedSalads(featured.length > 0 ? featured : saladsRes.data.salads.slice(0, 3));
        setPlans(plansRes.data.plans.slice(0, 3));
      })
      .catch(() => {
        // Handled cleanly via empty fallback states
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleAdd = (salad: Salad) => {
    addItem({
      id: `ready-${salad._id}`,
      itemType: 'ready',
      saladId: salad._id,
      name: salad.name,
      image: salad.image,
      unitPrice: salad.price,
      calories: salad.calories,
      protein: salad.protein,
      carbs: salad.carbs,
      fat: salad.fat,
    });
    showToast(`Added ${salad.name} to your cart.`);
  };

  return (
    <div>
      {/* Hero Split */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center py-4">
            <p className="text-xs font-medium tracking-wide text-[#1B6B3A] mb-3">
              Daily Diet Kitchen · Macro-Verified Bowls
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#111C16] leading-[1.1] tracking-tight text-balance">
              Crisp seasonal bowls built around your nutrition goals.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#526056] leading-relaxed max-w-xl">
              Order chef-crafted Keto, Vegan, and High-Protein salads on demand, design your own bowl with live macro
              tracking, or subscribe to effortless weekday deliveries.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#1B6B3A] hover:bg-[#14532D] rounded-lg transition-colors whitespace-nowrap"
              >
                <span>Explore Salad Menu</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/customize"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#111C16] bg-[#F2F5F0] hover:bg-[#E4EBE1] rounded-lg transition-colors whitespace-nowrap"
              >
                <span>Build Custom Bowl</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[280px] sm:min-h-[360px] rounded-2xl overflow-hidden border border-[#E4EBE1] bg-white">
              <SaladImage
                src="/assets/aistudio/mutton_7c8f5b98.jpg"
                alt="Freshly prepared mutton bowl garnished with cilantro"
                className="w-full h-full object-contain p-4 bg-white"
              />
            </div>
          </div>
        </div>

        {/* 4-column Key Value Strip */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 border-y border-[#E4EBE1] py-6">
          <div>
            <p className="font-mono text-sm font-semibold text-[#111C16] tabular-nums">5 Diet Profiles</p>
            <p className="text-xs text-[#526056] mt-1">Vegan, Keto, Low-Carb, High-Protein, Weight Loss</p>
          </div>
          <div>
            <p className="font-mono text-sm font-semibold text-[#111C16] tabular-nums">20+ Fresh Ingredients</p>
            <p className="text-xs text-[#526056] mt-1">Live price and calorie calculator in builder</p>
          </div>
          <div>
            <p className="font-mono text-sm font-semibold text-[#111C16] tabular-nums">Flexible Memberships</p>
            <p className="text-xs text-[#526056] mt-1">Pause, resume, or swap bowls in one click</p>
          </div>
          <div>
            <p className="font-mono text-sm font-semibold text-[#111C16] tabular-nums">Free Delivery $25+</p>
            <p className="text-xs text-[#526056] mt-1">Chilled morning, lunch, and evening windows</p>
          </div>
        </div>
      </section>

      {/* Featured Salads */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl font-semibold text-[#111C16]">Signature Diet Bowls</h2>
            <p className="text-sm text-[#526056] mt-1">
              Prepared fresh each morning with verified protein, carbs, and healthy fat ratios.
            </p>
          </div>
          <Link
            to="/menu"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B6B3A] hover:text-[#14532D] whitespace-nowrap"
          >
            <span>View Full Menu</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-[#E4EBE1] rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-[#F2F5F0]" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-[#F2F5F0] rounded w-1/3" />
                  <div className="h-5 bg-[#F2F5F0] rounded w-2/3" />
                  <div className="h-10 bg-[#F2F5F0] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredSalads.map((salad, idx) => {
              const cardImages = [
                '/assets/aistudio/m_9221e1a1.webp',
                '/assets/aistudio/m_11ace60d.jpg',
                '/assets/aistudio/mutton_7c8f5b98.jpg',
              ];
              const cardImage = cardImages[idx % cardImages.length];
              return (
                <article
                  key={salad._id}
                  className="bg-white border border-[#E4EBE1] rounded-2xl overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <div className="aspect-[4/3] bg-white overflow-hidden">
                    <SaladImage src={cardImage} alt={salad.name} className="w-full h-full object-contain p-3 bg-white" />
                  </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-xs text-[#526056]">
                    <span className="font-medium text-[#1B6B3A]">{salad.dietType}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{salad.calories} kcal</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{salad.protein}g protein</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#111C16] mt-1.5">{salad.name}</h3>
                  <p className="text-sm text-[#526056] mt-2 leading-relaxed flex-1">{salad.description}</p>

                  <div className="mt-5 pt-4 border-t border-[#E4EBE1] flex items-center justify-between gap-4">
                    <span className="font-mono text-lg font-semibold text-[#111C16] tabular-nums">
                      ${salad.price.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdd(salad)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#1B6B3A] hover:bg-[#14532D] rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Membership Plans */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mb-8">
          <h2 className="font-display text-3xl font-semibold text-[#111C16]">Daily & Weekly Salad Memberships</h2>
          <p className="text-sm text-[#526056] mt-1">
            Lock in consistent clean eating. Choose your delivery days, morning or lunch window, and swap recipes
            whenever your goals shift.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, idx) => (
            <div
              key={plan._id}
              className={`rounded-2xl p-6 flex flex-col border ${
                idx === 1 ? 'bg-white border-[#1B6B3A] ring-1 ring-[#1B6B3A]/15' : 'bg-white border-[#E4EBE1]'
              }`}
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-xl font-semibold text-[#111C16]">{plan.name}</h3>
                <span className="text-xs font-medium text-[#1B6B3A] whitespace-nowrap">{plan.cadenceLabel}</span>
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="font-mono text-3xl font-semibold text-[#111C16] tabular-nums">
                  ${plan.price.toFixed(0)}
                </span>
                <span className="text-sm text-[#526056]">
                  / {plan.durationLabel} · {plan.saladsIncluded} bowls
                </span>
              </div>

              <ul className="mt-6 space-y-3 flex-1">
                {plan.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5 text-sm text-[#526056]">
                    <Check className="w-4 h-4 text-[#1B6B3A] shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => navigate(`/subscription?plan=${plan._id}`)}
                className={`mt-6 w-full py-2.5 px-4 text-sm font-semibold rounded-lg transition-colors ${
                  idx === 1
                    ? 'bg-[#1B6B3A] hover:bg-[#14532D] text-white'
                    : 'bg-[#F2F5F0] hover:bg-[#E4EBE1] text-[#111C16]'
                }`}
              >
                Select {plan.name}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
