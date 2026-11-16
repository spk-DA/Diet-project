import 'dotenv/config';

const rawSupabaseUrl = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://uxkaxigpmgtnmmuuqstz.supabase.co'
).trim();

const envKeyCandidates = [
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  process.env.SUPABASE_ANON_KEY,
  process.env.VITE_SUPABASE_ANON_KEY,
]
  .map((k) => (k || '').trim())
  .find((k) => Boolean(k) && !k.startsWith('MY_'));

const rawSupabaseKey = envKeyCandidates || 'sb_publishable_v9baCnPGgfxwJrpqEH_Reg_6-qHiGC7';

export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret:
    (process.env.JWT_SECRET && !process.env.JWT_SECRET.startsWith('MY_')
      ? process.env.JWT_SECRET
      : '') || 'Prem',
  jwtExpiresIn: '7d' as const,
  supabaseUrl: rawSupabaseUrl,
  supabaseServiceKey: rawSupabaseKey,
  hasSupabaseCredentials: Boolean(rawSupabaseUrl) && Boolean(rawSupabaseKey),
};
