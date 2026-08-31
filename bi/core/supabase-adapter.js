(() => {
  'use strict';

  function configured() {
    const s = window.SintropiaConfig?.supabase;
    return Boolean(s?.enabled && s?.url && s?.anonKey && window.supabase?.createClient);
  }

  function client() {
    if (!configured()) return null;
    if (!window.__sintropiaSupabase) {
      window.__sintropiaSupabase = window.supabase.createClient(window.SintropiaConfig.supabase.url, window.SintropiaConfig.supabase.anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
    return window.__sintropiaSupabase;
  }

  async function health() {
    const c = client();
    if (!c) return { mode: 'local', ok: true, message: 'Supabase ainda não configurado; fallback local ativo.' };
    const { error } = await c.from('organizations').select('id').limit(1);
    return { mode: 'supabase', ok: !error, error: error?.message || null };
  }

  window.SintropiaSupabase = Object.freeze({ configured, client, health });
})();
