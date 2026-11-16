import { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, ArrowLeft } from 'lucide-react';

interface AdminLayoutProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function AdminLayout({ title, subtitle, action, children }: AdminLayoutProps) {
  const navItems = [
    { to: '/admin', label: 'Dashboard & Kitchen', icon: LayoutDashboard, end: true },
    { to: '/admin/members', label: 'Manage Members', icon: Users, end: false },
    { to: '/admin/plans', label: 'Manage Plans', icon: CreditCard, end: false },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
        <aside className="bg-white border border-[#E4EBE1] rounded-xl p-4 space-y-1 lg:sticky lg:top-24">
          <div className="px-3 py-2 mb-2 border-b border-[#E4EBE1]">
            <p className="text-xs font-semibold text-[#526056]">Admin Console</p>
            <p className="text-sm font-semibold text-[#111C16] mt-0.5">FreshBowl Operations</p>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#ECFDF3] text-[#1B6B3A]'
                      : 'text-[#526056] hover:bg-[#F2F5F0] hover:text-[#111C16]'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}

          <div className="pt-3 mt-3 border-t border-[#E4EBE1]">
            <Link
              to="/menu"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#526056] hover:text-[#111C16] hover:bg-[#F2F5F0]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>View Member Menu</span>
            </Link>
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E4EBE1]">
            <div>
              <h1 className="font-display text-3xl font-semibold text-[#111C16]">{title}</h1>
              {subtitle && <p className="text-sm text-[#526056] mt-1">{subtitle}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}
