import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap shrink-0 text-sm font-medium transition-colors py-1 border-b-2 ${
      isActive
        ? 'text-[#1B6B3A] border-[#1B6B3A]'
        : 'text-[#526056] border-transparent hover:text-[#111C16]'
    }`;

  const links =
    user?.role === 'admin'
      ? [
          { to: '/menu', label: 'Menu' },
          { to: '/customize', label: 'Customize' },
          { to: '/admin', label: 'Admin Dashboard' },
          { to: '/admin/members', label: 'Members' },
          { to: '/admin/plans', label: 'Plans' },
        ]
      : [
          { to: '/menu', label: 'Menu' },
          { to: '/customize', label: 'Customize Salad' },
          { to: '/subscription', label: 'My Subscription' },
          { to: '/orders', label: 'My Orders' },
        ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAFBF9]/95 backdrop-blur-sm border-b border-[#E4EBE1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element wordmark */}
        <Link
          to="/"
          className="font-display text-2xl font-semibold tracking-tight text-[#111C16] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B6B3A] rounded"
        >
          FreshBowl
        </Link>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary Navigation">
          {links.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: Primary action area */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#111C16] hover:text-[#1B6B3A] transition-colors whitespace-nowrap shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B6B3A]"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cart</span>
            <span className="font-mono tabular-nums text-xs text-[#526056]">({totalItems})</span>
          </Link>

          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#111C16] bg-[#F2F5F0] hover:bg-[#E4EBE1] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B6B3A]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#1B6B3A] hover:bg-[#14532D] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B6B3A] focus-visible:ring-offset-2"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex md:hidden items-center gap-3 shrink-0">
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 p-2 text-sm font-medium text-[#111C16]"
            aria-label={`Shopping cart with ${totalItems} items`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="font-mono tabular-nums text-xs">{totalItems}</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="p-2 text-[#111C16] rounded-lg hover:bg-[#F2F5F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B6B3A]"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E4EBE1] bg-white px-4 py-4 space-y-2">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-[#ECFDF3] text-[#1B6B3A]' : 'text-[#526056] hover:bg-[#F2F5F0]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-[#E4EBE1]">
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#111C16] hover:bg-[#F2F5F0]"
              >
                Sign Out ({user.name})
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#1B6B3A]"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
