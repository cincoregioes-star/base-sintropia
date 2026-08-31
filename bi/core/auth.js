(() => {
  'use strict';

  const cfg = window.SintropiaConfig || { data: { namespace: 'base-sintropia-bi' } };
  const key = `${cfg.data.namespace}:session:v1`;

  const DEMO_USERS = Object.freeze({
    orientador: { id: 'USR-DEMO-ORI', name: 'Orientador Demo', role: 'orientador', organizationId: 'ORG-DEMO', unitId: 'UNI-001' },
    coordenador: { id: 'USR-DEMO-COO', name: 'Coordenação Demo', role: 'coordenador', organizationId: 'ORG-DEMO', unitId: 'UNI-001' },
    gestor: { id: 'USR-DEMO-GES', name: 'Gestão Demo', role: 'gestor', organizationId: 'ORG-DEMO', unitId: null },
    administrador: { id: 'USR-DEMO-ADM', name: 'Administrador Demo', role: 'administrador', organizationId: 'ORG-DEMO', unitId: null }
  });

  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(key) || 'null'); }
    catch { return null; }
  }

  function startDemo(role = 'orientador') {
    const user = DEMO_USERS[role] || DEMO_USERS.orientador;
    const session = {
      user,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ((cfg.security?.sessionMinutes || 60) * 60000)).toISOString(),
      mode: 'demo-local'
    };
    sessionStorage.setItem(key, JSON.stringify(session));
    window.SintropiaAudit?.log?.({ action: 'auth.demo_login', entityType: 'session', entityId: user.id, after: { role: user.role } });
    return session;
  }

  function ensureSession() {
    const current = getSession();
    if (current && Date.parse(current.expiresAt) > Date.now()) return current;
    sessionStorage.removeItem(key);
    return startDemo('orientador');
  }

  function switchRole(role) {
    sessionStorage.removeItem(key);
    return startDemo(role);
  }

  function logout() {
    const current = getSession();
    sessionStorage.removeItem(key);
    window.SintropiaAudit?.log?.({ action: 'auth.logout', entityType: 'session', entityId: current?.user?.id || null });
  }

  function can(permission) {
    const session = ensureSession();
    return window.SintropiaPermissions?.can?.(session.user.role, permission) ?? false;
  }

  window.SintropiaAuth = Object.freeze({ DEMO_USERS, getSession, ensureSession, startDemo, switchRole, logout, can });
})();
