(() => {
  'use strict';

  const cfg = window.SintropiaConfig || { data: { namespace: 'base-sintropia-bi', schemaVersion: 2 } };
  const ns = cfg.data.namespace;

  const KEYS = Object.freeze({
    meta: `${ns}:meta`,
    attendance: `${ns}:attendance:v1`,
    participants: `${ns}:participants:v1`,
    tasks: `${ns}:tasks:v1`
  });

  function parse(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function bootstrap() {
    const current = parse(KEYS.meta, null);
    if (!current || current.schemaVersion !== cfg.data.schemaVersion) {
      save(KEYS.meta, { schemaVersion: cfg.data.schemaVersion, updatedAt: new Date().toISOString(), mode: cfg.mode });
    }
  }

  function saveAttendance({ groupId, date, records }) {
    if (!Array.isArray(records) || !records.length) throw new Error('Nenhum registro de frequência recebido.');
    const session = window.SintropiaAuth?.ensureSession?.();
    const all = parse(KEYS.attendance, []);
    const compositeKey = `${groupId}|${date}`;
    const existingIndex = all.findIndex(item => item.compositeKey === compositeKey);
    const payload = {
      id: existingIndex >= 0 ? all[existingIndex].id : (crypto.randomUUID ? crypto.randomUUID() : `ATT-${Date.now()}`),
      compositeKey,
      groupId,
      date,
      records: records.map(r => ({ participantId: r.participantId, name: r.name, status: r.status })),
      updatedAt: new Date().toISOString(),
      updatedBy: session?.user?.id || 'demo'
    };
    const before = existingIndex >= 0 ? all[existingIndex] : null;
    if (existingIndex >= 0) all[existingIndex] = payload; else all.push(payload);
    save(KEYS.attendance, all);
    window.SintropiaAudit?.log?.({ action: 'attendance.save', entityType: 'attendance_session', entityId: payload.id, before, after: payload, metadata: { compositeKey } });
    return payload;
  }

  function getAttendance(groupId, date) {
    return parse(KEYS.attendance, []).find(item => item.compositeKey === `${groupId}|${date}`) || null;
  }

  function listAttendance() {
    return parse(KEYS.attendance, []);
  }

  window.SintropiaStore = Object.freeze({ bootstrap, saveAttendance, getAttendance, listAttendance, KEYS });
  bootstrap();
})();
