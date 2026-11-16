import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, CalendarCheck, Trash2, Check } from 'lucide-react';
import api from '../api/client';
import { CustomSaladSpec, FavoriteSalad, Ingredient, IngredientSnapshot } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

function toSnapshot(ing: Ingredient): IngredientSnapshot {
  return {
    ingredientId: ing._id,
    name: ing.name,
    price: ing.price,
    calories: ing.calories,
    protein: ing.protein,
    carbs: ing.carbs,
    fat: ing.fat,
  };
}

export default function CustomizeSaladPage() {
  const { user } = useAuth();
  const { addItem, setPendingSubscriptionCustom } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [favorites, setFavorites] = useState<FavoriteSalad[]>([]);
  const [loading, setLoading] = useState(true);

  const [bowlName, setBowlName] = useState('My Custom Power Bowl');
  const [selectedBaseId, setSelectedBaseId] = useState<string>('');
  const [selectedToppingIds, setSelectedToppingIds] = useState<string[]>([]);
  const [selectedProteinId, setSelectedProteinId] = useState<string>('');
  const [selectedDressingId, setSelectedDressingId] = useState<string>('');
  const [savingFav, setSavingFav] = useState(false);

  useEffect(() => {
    let active = true;
    const reqs: [Promise<{ data: { ingredients: Ingredient[] } }>, Promise<{ data: { favorites: FavoriteSalad[] } } | null>] = [
      api.get<{ ingredients: Ingredient[] }>('/ingredients'),
      user ? api.get<{ favorites: FavoriteSalad[] }>('/favorites') : Promise.resolve(null),
    ];

    Promise.all(reqs)
      .then(([ingRes, favRes]) => {
        if (!active) return;
        const list = ingRes.data.ingredients;
        setIngredients(list);
        const firstBase = list.find((i) => i.category === 'base');
        if (firstBase) setSelectedBaseId(firstBase._id);
        const firstDressing = list.find((i) => i.category === 'dressing');
        if (firstDressing) setSelectedDressingId(firstDressing._id);
        if (favRes) setFavorites(favRes.data.favorites);
      })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, showToast]);

  const grouped = useMemo(() => {
    return {
      bases: ingredients.filter((i) => i.category === 'base'),
      toppings: ingredients.filter((i) => i.category === 'topping'),
      proteins: ingredients.filter((i) => i.category === 'protein'),
      dressings: ingredients.filter((i) => i.category === 'dressing'),
    };
  }, [ingredients]);

  const selectedItems = useMemo(() => {
    const base = grouped.bases.find((b) => b._id === selectedBaseId) || null;
    const toppings = grouped.toppings.filter((t) => selectedToppingIds.includes(t._id));
    const protein = grouped.proteins.find((p) => p._id === selectedProteinId) || null;
    const dressing = grouped.dressings.find((d) => d._id === selectedDressingId) || null;
    return { base, toppings, protein, dressing };
  }, [grouped, selectedBaseId, selectedToppingIds, selectedProteinId, selectedDressingId]);

  const totals = useMemo(() => {
    const list: Ingredient[] = [];
    if (selectedItems.base) list.push(selectedItems.base);
    list.push(...selectedItems.toppings);
    if (selectedItems.protein) list.push(selectedItems.protein);
    if (selectedItems.dressing) list.push(selectedItems.dressing);

    return list.reduce(
      (acc, item) => ({
        price: Number((acc.price + item.price).toFixed(2)),
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { price: 0, calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [selectedItems]);

  const toggleTopping = (id: string) => {
    setSelectedToppingIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const buildCustomSpec = (): CustomSaladSpec | null => {
    if (!selectedItems.base) {
      showToast('Please select a salad base first.', 'error');
      return null;
    }
    return {
      name: bowlName.trim() || 'Custom FreshBowl',
      base: selectedItems.base.name,
      toppings: selectedItems.toppings.map((t) => t.name),
      protein: selectedItems.protein?.name || 'None',
      dressing: selectedItems.dressing?.name || 'None',
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      price: totals.price,
    };
  };

  const handleAddToCart = () => {
    const spec = buildCustomSpec();
    if (!spec) return;

    addItem({
      id: `custom-${Date.now()}`,
      itemType: 'custom',
      name: spec.name,
      unitPrice: spec.price,
      calories: spec.totalCalories,
      protein: spec.totalProtein,
      carbs: spec.totalCarbs,
      fat: spec.totalFat,
      customDetails: {
        base: spec.base,
        toppings: spec.toppings,
        protein: spec.protein,
        dressing: spec.dressing,
      },
    });
    showToast(`Added "${spec.name}" to your cart.`);
  };

  const handleSaveFavorite = async () => {
    if (!user) {
      showToast('Please sign in to save favorite custom bowls.', 'info');
      navigate('/login', { state: { from: '/customize' } });
      return;
    }
    if (!selectedItems.base) {
      showToast('Please select a salad base first.', 'error');
      return;
    }
    if (!bowlName.trim()) {
      showToast('Please enter a name for your custom salad.', 'error');
      return;
    }

    setSavingFav(true);
    try {
      const payload = {
        name: bowlName.trim(),
        base: toSnapshot(selectedItems.base),
        toppings: selectedItems.toppings.map(toSnapshot),
        protein: selectedItems.protein ? toSnapshot(selectedItems.protein) : null,
        dressing: selectedItems.dressing ? toSnapshot(selectedItems.dressing) : null,
        totalPrice: totals.price,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
      };
      const { data } = await api.post<{ favorite: FavoriteSalad }>('/favorites', payload);
      setFavorites((prev) => [data.favorite, ...prev]);
      showToast(`Saved "${data.favorite.name}" to favorites.`);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setSavingFav(false);
    }
  };

  const handleUseInSubscription = () => {
    const spec = buildCustomSpec();
    if (!spec) return;
    setPendingSubscriptionCustom(spec);
    showToast(`Selected "${spec.name}" for your subscription.`);
    navigate('/subscription');
  };

  const handleLoadFavorite = (fav: FavoriteSalad) => {
    setBowlName(fav.name);
    setSelectedBaseId(fav.base.ingredientId);
    setSelectedToppingIds(fav.toppings.map((t) => t.ingredientId));
    setSelectedProteinId(fav.protein?.ingredientId || '');
    setSelectedDressingId(fav.dressing?.ingredientId || '');
    showToast(`Loaded "${fav.name}" into builder.`);
  };

  const handleDeleteFavorite = async (id: string) => {
    try {
      await api.delete(`/favorites/${id}`);
      setFavorites((prev) => prev.filter((f) => f._id !== id));
      showToast('Removed from favorites.');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-8 w-64 bg-[#F2F5F0] rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 bg-white border border-[#E4EBE1] rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="lg:col-span-4 h-96 bg-white border border-[#E4EBE1] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-6 border-b border-[#E4EBE1]">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#111C16]">Customize Your Salad</h1>
        <p className="text-sm text-[#526056] mt-1.5">
          Select your base, fresh toppings, protein, and dressing. Calories, macros, and price update live.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Builder Steps */}
        <div className="lg:col-span-8 space-y-8">
          {/* 1. Base */}
          <section className="bg-white border border-[#E4EBE1] rounded-2xl p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#111C16]">1. Choose a Base</h2>
              <span className="text-xs text-[#526056]">Required · Select 1</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {grouped.bases.map((item) => {
                const selected = selectedBaseId === item._id;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setSelectedBaseId(item._id)}
                    className={`text-left p-4 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                      selected
                        ? 'border-[#1B6B3A] bg-[#ECFDF3]/60'
                        : 'border-[#E4EBE1] hover:border-[#1B6B3A]/40 bg-white'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#111C16]">{item.name}</p>
                      <p className="text-xs text-[#526056] mt-1 font-mono tabular-nums">
                        {item.calories} kcal · {item.protein}g P · {item.carbs}g C
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm font-semibold text-[#111C16] tabular-nums">
                        ${item.price.toFixed(2)}
                      </span>
                      {selected && <Check className="w-4 h-4 text-[#1B6B3A] ml-auto mt-1" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Toppings */}
          <section className="bg-white border border-[#E4EBE1] rounded-2xl p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#111C16]">2. Choose Toppings</h2>
              <span className="text-xs text-[#526056]">Vegetables, fruits, nuts & seeds · Multi-select</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {grouped.toppings.map((item) => {
                const selected = selectedToppingIds.includes(item._id);
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => toggleTopping(item._id)}
                    className={`text-left p-4 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                      selected
                        ? 'border-[#1B6B3A] bg-[#ECFDF3]/60'
                        : 'border-[#E4EBE1] hover:border-[#1B6B3A]/40 bg-white'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#111C16]">{item.name}</p>
                      <p className="text-xs text-[#526056] mt-1 font-mono tabular-nums">
                        {item.calories} kcal · {item.subCategory}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm font-semibold text-[#111C16] tabular-nums">
                        +${item.price.toFixed(2)}
                      </span>
                      {selected && <Check className="w-4 h-4 text-[#1B6B3A] ml-auto mt-1" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. Protein */}
          <section className="bg-white border border-[#E4EBE1] rounded-2xl p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#111C16]">3. Choose Protein</h2>
              <button
                type="button"
                onClick={() => setSelectedProteinId('')}
                className="text-xs font-medium text-[#526056] hover:text-[#111C16]"
              >
                Clear protein
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {grouped.proteins.map((item) => {
                const selected = selectedProteinId === item._id;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setSelectedProteinId(selected ? '' : item._id)}
                    className={`text-left p-4 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                      selected
                        ? 'border-[#1B6B3A] bg-[#ECFDF3]/60'
                        : 'border-[#E4EBE1] hover:border-[#1B6B3A]/40 bg-white'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#111C16]">{item.name}</p>
                      <p className="text-xs text-[#526056] mt-1 font-mono tabular-nums">
                        {item.calories} kcal · {item.protein}g protein
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm font-semibold text-[#111C16] tabular-nums">
                        +${item.price.toFixed(2)}
                      </span>
                      {selected && <Check className="w-4 h-4 text-[#1B6B3A] ml-auto mt-1" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 4. Dressing */}
          <section className="bg-white border border-[#E4EBE1] rounded-2xl p-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#111C16]">4. Choose Dressing</h2>
              <button
                type="button"
                onClick={() => setSelectedDressingId('')}
                className="text-xs font-medium text-[#526056] hover:text-[#111C16]"
              >
                No dressing
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {grouped.dressings.map((item) => {
                const selected = selectedDressingId === item._id;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setSelectedDressingId(selected ? '' : item._id)}
                    className={`text-left p-4 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                      selected
                        ? 'border-[#1B6B3A] bg-[#ECFDF3]/60'
                        : 'border-[#E4EBE1] hover:border-[#1B6B3A]/40 bg-white'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#111C16]">{item.name}</p>
                      <p className="text-xs text-[#526056] mt-1 font-mono tabular-nums">
                        {item.calories} kcal · {item.fat}g fat
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm font-semibold text-[#111C16] tabular-nums">
                        +${item.price.toFixed(2)}
                      </span>
                      {selected && <Check className="w-4 h-4 text-[#1B6B3A] ml-auto mt-1" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sticky Live Macro & Price Calculator */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 bg-white border border-[#E4EBE1] rounded-2xl p-6 space-y-5">
          <div>
            <label htmlFor="bowl-name" className="block text-xs font-semibold text-[#526056] mb-1.5">
              Custom Bowl Name
            </label>
            <input
              id="bowl-name"
              type="text"
              value={bowlName}
              onChange={(e) => setBowlName(e.target.value)}
              placeholder="e.g. Post-Workout Kale Bowl"
              className="w-full px-3.5 py-2.5 text-sm border border-[#E4EBE1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]"
            />
          </div>

          {/* Live Macros */}
          <div className="p-4 rounded-xl bg-[#FAFBF9] border border-[#E4EBE1]">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-[#526056]">Estimated Total</span>
              <span className="font-mono text-2xl font-semibold text-[#111C16] tabular-nums">
                ${totals.price.toFixed(2)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 pt-3 border-t border-[#E4EBE1] text-center">
              <div>
                <p className="font-mono text-sm font-semibold text-[#111C16] tabular-nums">{totals.calories}</p>
                <p className="text-[11px] text-[#526056]">kcal</p>
              </div>
              <div>
                <p className="font-mono text-sm font-semibold text-[#1B6B3A] tabular-nums">{totals.protein}g</p>
                <p className="text-[11px] text-[#526056]">Protein</p>
              </div>
              <div>
                <p className="font-mono text-sm font-semibold text-[#111C16] tabular-nums">{totals.carbs}g</p>
                <p className="text-[11px] text-[#526056]">Carbs</p>
              </div>
              <div>
                <p className="font-mono text-sm font-semibold text-[#111C16] tabular-nums">{totals.fat}g</p>
                <p className="text-[11px] text-[#526056]">Fat</p>
              </div>
            </div>
          </div>

          {/* Current Selection Summary */}
          <div className="space-y-2 text-xs text-[#526056]">
            <p>
              <strong className="text-[#111C16]">Base:</strong> {selectedItems.base?.name || 'None'}
            </p>
            <p>
              <strong className="text-[#111C16]">Toppings:</strong>{' '}
              {selectedItems.toppings.length > 0
                ? selectedItems.toppings.map((t) => t.name).join(', ')
                : 'None selected'}
            </p>
            <p>
              <strong className="text-[#111C16]">Protein:</strong> {selectedItems.protein?.name || 'None'}
            </p>
            <p>
              <strong className="text-[#111C16]">Dressing:</strong> {selectedItems.dressing?.name || 'None'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-[#1B6B3A] hover:bg-[#14532D] rounded-lg transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to One-Time Order</span>
            </button>

            <button
              type="button"
              onClick={handleUseInSubscription}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-[#1B6B3A] bg-[#ECFDF3] hover:bg-[#DDF7E8] rounded-lg transition-colors"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Use in Monthly Subscription</span>
            </button>

            <button
              type="button"
              onClick={handleSaveFavorite}
              disabled={savingFav}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium text-[#111C16] bg-[#F2F5F0] hover:bg-[#E4EBE1] rounded-lg transition-colors disabled:opacity-60"
            >
              <Heart className="w-4 h-4" />
              <span>{savingFav ? 'Saving...' : 'Save as Favorite'}</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Saved Favorites */}
      {user && (
        <section className="mt-12 pt-10 border-t border-[#E4EBE1]">
          <h2 className="font-display text-2xl font-semibold text-[#111C16]">Your Saved Custom Bowls</h2>
          {favorites.length === 0 ? (
            <p className="text-sm text-[#526056] mt-2">
              You have not saved any custom recipes yet. Build a bowl above and click Save as Favorite.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {favorites.map((fav) => (
                <div key={fav._id} className="bg-white border border-[#E4EBE1] rounded-xl p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-[#111C16]">{fav.name}</h3>
                    <span className="font-mono text-sm font-semibold text-[#111C16] tabular-nums">
                      ${fav.totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-[#526056] mt-1 font-mono tabular-nums">
                    {fav.totalCalories} kcal · {fav.totalProtein}g P · {fav.totalCarbs}g C · {fav.totalFat}g F
                  </p>
                  <p className="text-xs text-[#526056] mt-3 flex-1 leading-relaxed">
                    {fav.base.name}
                    {fav.toppings.length > 0 ? `, ${fav.toppings.map((t) => t.name).join(', ')}` : ''}
                    {fav.protein ? `, ${fav.protein.name}` : ''}
                    {fav.dressing ? `, ${fav.dressing.name}` : ''}
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#E4EBE1] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoadFavorite(fav)}
                      className="text-xs font-semibold text-[#1B6B3A] hover:underline"
                    >
                      Load in Builder
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFavorite(fav._id)}
                      className="inline-flex items-center gap-1 text-xs text-red-700 hover:text-red-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
