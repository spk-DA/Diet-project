import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, SlidersHorizontal } from 'lucide-react';
import api from '../api/client';
import { DietType, Salad } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import SaladImage from '../components/SaladImage';

const DIET_FILTERS: Array<'All' | DietType> = [
  'All',
  'Vegan',
  'Keto',
  'Low-Carb',
  'High-Protein',
  'Weight Loss',
];

export default function MenuPage() {
  const [salads, setSalads] = useState<Salad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dietFilter, setDietFilter] = useState<'All' | DietType>('All');
  const [search, setSearch] = useState('');
  const { addItem } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get<{ salads: Salad[] }>('/salads')
      .then(({ data }) => {
        if (active) setSalads(data.salads);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredSalads = useMemo(() => {
    return salads.filter((salad) => {
      const matchesDiet = dietFilter === 'All' || salad.dietType === dietFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        salad.name.toLowerCase().includes(q) ||
        salad.description.toLowerCase().includes(q) ||
        salad.ingredientsList.some((ing) => ing.toLowerCase().includes(q));
      return matchesDiet && matchesSearch;
    });
  }, [salads, dietFilter, search]);

  const handleAddToCart = (salad: Salad) => {
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
    showToast(`Added ${salad.name} to cart.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E4EBE1]">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#111C16]">Ready-Made Diet Salads</h1>
          <p className="text-sm text-[#526056] mt-1.5">
            Filter by nutrition protocol or build your own bowl from 20 fresh ingredients.
          </p>
        </div>
        <Link
          to="/customize"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#1B6B3A] bg-[#ECFDF3] hover:bg-[#DDF7E8] rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Build Custom Salad</span>
        </Link>
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F2F5F0] rounded-xl w-fit">
          {DIET_FILTERS.map((diet) => (
            <button
              key={diet}
              type="button"
              onClick={() => setDietFilter(diet)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                dietFilter === diet
                  ? 'bg-white text-[#1B6B3A] shadow-sm'
                  : 'text-[#526056] hover:text-[#111C16]'
              }`}
            >
              {diet}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-[#526056] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search salads or ingredients..."
            aria-label="Search salads"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#E4EBE1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]"
          />
        </div>
      </div>

      {/* Content */}
      {error && (
        <div className="mt-8 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800">{error}</div>
      )}

      {loading ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="bg-white border border-[#E4EBE1] rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-[#F2F5F0]" />
              <div className="p-5 space-y-3">
                <div className="h-3 bg-[#F2F5F0] rounded w-1/2" />
                <div className="h-5 bg-[#F2F5F0] rounded w-3/4" />
                <div className="h-12 bg-[#F2F5F0] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredSalads.length === 0 ? (
        <div className="mt-10 text-center py-16 bg-white border border-[#E4EBE1] rounded-2xl">
          <p className="text-base font-semibold text-[#111C16]">No salads match your filter</p>
          <p className="text-sm text-[#526056] mt-1">Try clearing your search or selecting another diet category.</p>
          <button
            type="button"
            onClick={() => {
              setDietFilter('All');
              setSearch('');
            }}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#1B6B3A] rounded-lg"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSalads.map((salad) => (
            <article
              key={salad._id}
              className="bg-white border border-[#E4EBE1] rounded-2xl overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5"
            >
              <div className="aspect-[4/3] bg-[#F2F5F0] overflow-hidden">
                <SaladImage src={salad.image} alt={salad.name} className="w-full h-full object-cover" />
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-xs text-[#526056]">
                  <span className="font-semibold text-[#1B6B3A]">{salad.dietType}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{salad.calories} kcal</span>
                </div>

                <h2 className="text-2xl font-bold text-[#111C16] mt-1.5 leading-snug">{salad.name}</h2>
                <p className="text-sm text-[#526056] mt-2 leading-relaxed flex-1">{salad.description}</p>

                {/* Macro breakdown row */}
                <div className="mt-4 pt-3 border-t border-[#E4EBE1] grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[#526056] block">Protein</span>
                    <span className="font-mono font-semibold text-[#111C16] tabular-nums">{salad.protein}g</span>
                  </div>
                  <div>
                    <span className="text-[#526056] block">Carbs</span>
                    <span className="font-mono font-semibold text-[#111C16] tabular-nums">{salad.carbs}g</span>
                  </div>
                  <div>
                    <span className="text-[#526056] block">Fat</span>
                    <span className="font-mono font-semibold text-[#111C16] tabular-nums">{salad.fat}g</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#E4EBE1] flex items-center justify-between gap-4">
                  <span className="font-mono text-lg font-semibold text-[#111C16] tabular-nums">
                    ${salad.price.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(salad)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#1B6B3A] hover:bg-[#14532D] rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
