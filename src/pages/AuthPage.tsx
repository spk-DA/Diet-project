import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AuthPage({ defaultMode = 'login' }: { defaultMode?: 'login' | 'register' }) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = (location.state as { from?: string } | null)?.from || '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (mode === 'register' && !name.trim()) {
      setFormError('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setFormError('Email address is required.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const user =
        mode === 'login'
          ? await login(email.trim(), password)
          : await register({
              name: name.trim(),
              email: email.trim(),
              password,
              phone: phone.trim(),
              address: address.trim(),
            });

      showToast(`Welcome${mode === 'register' ? ' to FreshBowl' : ' back'}, ${user.name}.`);
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(redirectPath === '/login' ? '/menu' : redirectPath, { replace: true });
      }
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = async (role: 'member' | 'admin') => {
    const demoEmail = role === 'admin' ? 'admin@freshbowl.com' : 'member@freshbowl.com';
    const demoPassword = role === 'admin' ? 'Admin123!' : 'Member123!';
    setMode('login');
    setEmail(demoEmail);
    setPassword(demoPassword);
    setFormError('');
    setSubmitting(true);
    try {
      const user = await login(demoEmail, demoPassword);
      showToast(`Signed in as ${user.name}.`);
      navigate(user.role === 'admin' ? '/admin' : '/menu', { replace: true });
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="bg-white border border-[#E4EBE1] rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#111C16]">
            {mode === 'login' ? 'Sign in to FreshBowl' : 'Create Member Account'}
          </h1>
          <p className="text-sm text-[#526056] mt-1">
            {mode === 'login'
              ? 'Manage your salad deliveries, favorites, and orders.'
              : 'Join FreshBowl for custom bowls and flexible meal plans.'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 p-1 bg-[#F2F5F0] rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setFormError('');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'login' ? 'bg-white text-[#1B6B3A] shadow-sm' : 'text-[#526056]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setFormError('');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'register' ? 'bg-white text-[#1B6B3A] shadow-sm' : 'text-[#526056]'
            }`}
          >
            Register
          </button>
        </div>

        {formError && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">{formError}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-semibold text-[#111C16] mb-1.5">
                Full Name
              </label>
              <input
                id="auth-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Maya Lin"
                className="w-full px-3.5 py-2.5 text-sm border border-[#E4EBE1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold text-[#111C16] mb-1.5">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 text-sm border border-[#E4EBE1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-semibold text-[#111C16] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-3.5 pr-10 py-2.5 text-sm border border-[#E4EBE1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#526056] hover:text-[#111C16]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label htmlFor="auth-phone" className="block text-xs font-semibold text-[#111C16] mb-1.5">
                  Phone Number
                </label>
                <input
                  id="auth-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (415) 555-0148"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#E4EBE1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]"
                />
              </div>

              <div>
                <label htmlFor="auth-address" className="block text-xs font-semibold text-[#111C16] mb-1.5">
                  Default Delivery Address
                </label>
                <input
                  id="auth-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="2140 Market St, San Francisco, CA"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#E4EBE1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B6B3A]"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#1B6B3A] hover:bg-[#14532D] rounded-lg transition-colors disabled:opacity-60"
          >
            {submitting ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="pt-5 border-t border-[#E4EBE1] space-y-2.5">
          <p className="text-xs font-medium text-[#526056]">Quick Demo Sign-In</p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => fillDemo('member')}
              disabled={submitting}
              className="py-2 px-3 text-xs font-semibold text-[#111C16] bg-[#F2F5F0] hover:bg-[#E4EBE1] rounded-lg transition-colors"
            >
              Member Demo
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              disabled={submitting}
              className="py-2 px-3 text-xs font-semibold text-[#1B6B3A] bg-[#ECFDF3] hover:bg-[#DDF7E8] rounded-lg transition-colors"
            >
              Admin Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
