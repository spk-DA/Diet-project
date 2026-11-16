import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-[#E4EBE1] bg-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <Link to="/" className="font-display text-2xl font-semibold text-[#111C16]">
              FreshBowl
            </Link>
            <p className="text-sm text-[#526056] max-w-md leading-relaxed">
              Daily chef-prepared diet bowls, precision macro customization, and flexible weekday or daily meal
              memberships crafted from locally harvested greens.
            </p>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold text-[#111C16]">Kitchen</h3>
            <ul className="space-y-2 text-sm text-[#526056]">
              <li>
                <Link to="/menu" className="hover:text-[#1B6B3A] transition-colors">
                  Salad Menu
                </Link>
              </li>
              <li>
                <Link to="/customize" className="hover:text-[#1B6B3A] transition-colors">
                  Custom Bowl Builder
                </Link>
              </li>
              <li>
                <Link to="/subscription" className="hover:text-[#1B6B3A] transition-colors">
                  Membership Plans
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold text-[#111C16]">Account</h3>
            <ul className="space-y-2 text-sm text-[#526056]">
              <li>
                <Link to="/orders" className="hover:text-[#1B6B3A] transition-colors">
                  Order History
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-[#1B6B3A] transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#1B6B3A] transition-colors">
                  Member Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#E4EBE1] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#526056]">
          <p>© {new Date().getFullYear()} FreshBowl Kitchen. All rights reserved.</p>
          <p>Fresh greens harvested daily · Macro-verified recipes</p>
        </div>
      </div>
    </footer>
  );
}
