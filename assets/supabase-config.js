// Plataforma Reino — conexão pública com Supabase
// Nunca coloque service_role/secret key no navegador.
const REINO_SUPABASE_URL = 'https://baiwbuezoazfjbyqwnlv.supabase.co';
const REINO_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_e7MDlm-DcElUj-HCqA-XIw_rWNuzQ9x';
window.REINO_SUPABASE = window.supabase.createClient(
  REINO_SUPABASE_URL,
  REINO_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
