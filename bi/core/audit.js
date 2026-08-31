(() => {
  'use strict';

  const cfg = window.SintropiaConfig || { data: { namespace: 'base-sintropia-bi' } };
  const key = `${cfg.data.namespace}:audit:v1`;

  function read() {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
  }

  function write(entries) {
    localStorage.setItem(key, JSON.stringify(entries.slice(-1000)));
  }

  function log({ action, entityType = 'system', entityId = null, before = null, after = null, metadata = {} }) {
    const session = window.SintropiaAuth?.getSession?.() || null;
    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : `AUD-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: new Date().toISOString(),
      actor: session ? { id: session.user.id, name: session.user.name, role: session.user.role } : { id: 'anonymous', name: 'Sessão local', role: 'demo' },
      action,
      entityType,
      entityId,
      before,
      after,
      metadata
    };
    const entries = read();
    entries.push(entry);
    write(entries);
    return entry;
  }

  function list(limit = 100) {
    return read().slice(-Math.max(1, limit)).reverse();
  }

  window.SintropiaAudit = Object.freeze({ log, list });
})();
