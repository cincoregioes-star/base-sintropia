(() => {
  'use strict';

  const cfg = window.SintropiaConfig || { data: { namespace: 'base-sintropia-bi', schemaVersion: 3 } };
  const ns = cfg.data.namespace;

  const KEYS = Object.freeze({
    meta: `${ns}:meta`,
    participants: `${ns}:participants:v2`,
    families: `${ns}:families:v2`,
    groups: `${ns}:groups:v2`,
    memberships: `${ns}:memberships:v2`,
    attendance: `${ns}:attendance:v2`,
    tasks: `${ns}:tasks:v1`
  });

  function clone(value) { try { return structuredClone(value); } catch { return JSON.parse(JSON.stringify(value)); } }
  function parse(key, fallback) { try { const raw = localStorage.getItem(key); return raw == null ? clone(fallback) : JSON.parse(raw); } catch { return clone(fallback); } }
  function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); return value; }
  function collection(name) { const key = KEYS[name]; if (!key) throw new Error(`Coleção desconhecida: ${name}`); return parse(key, []); }
  function replaceCollection(name, rows) { const key = KEYS[name]; if (!key) throw new Error(`Coleção desconhecida: ${name}`); if (!Array.isArray(rows)) throw new Error('A coleção precisa ser uma lista.'); return save(key, rows); }

  function writeEntity(name, entity, { action='entity.save', entityType=name, before=null }={}) {
    if (!entity?.id) throw new Error('Entidade sem ID.');
    const rows = collection(name); const idx = rows.findIndex(row => row.id === entity.id); const previous = idx >= 0 ? rows[idx] : before;
    if (idx >= 0) rows[idx] = entity; else rows.push(entity);
    replaceCollection(name, rows);
    window.SintropiaAudit?.log?.({ action, entityType, entityId:entity.id, before:previous || null, after:entity });
    return entity;
  }

  function getById(name, id) { return collection(name).find(row => row.id === id) || null; }
  function newId(prefix='ID') { const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; return `${prefix}-${id}`; }

  function bootstrap() {
    const current = parse(KEYS.meta, null); const expectedVersion = cfg.data.schemaVersion || 3;
    if (!current || current.schemaVersion !== expectedVersion) save(KEYS.meta, { schemaVersion:expectedVersion, updatedAt:new Date().toISOString(), mode:cfg.mode || 'demo-local' });
  }

  function saveAttendance({ groupId, date, records }) {
    if (!groupId || !date) throw new Error('Grupo e data são obrigatórios.');
    if (!Array.isArray(records) || !records.length) throw new Error('Nenhum registro de frequência recebido.');
    const session = window.SintropiaAuth?.ensureSession?.(); const all = collection('attendance'); const compositeKey = `${groupId}|${date}`;
    const existingIndex = all.findIndex(item => item.compositeKey === compositeKey); const before = existingIndex >= 0 ? all[existingIndex] : null;
    const payload = {
      id: before?.id || newId('ATT'), compositeKey, groupId, date,
      records: records.map(r => ({ participantId:r.participantId, status:r.status, justification:r.justification || '' })),
      createdAt: before?.createdAt || new Date().toISOString(), createdBy: before?.createdBy || session?.user?.id || 'demo',
      updatedAt:new Date().toISOString(), updatedBy:session?.user?.id || 'demo', version:(before?.version || 0) + 1
    };
    if (existingIndex >= 0) all[existingIndex] = payload; else all.push(payload);
    replaceCollection('attendance', all);
    window.SintropiaAudit?.log?.({ action:before ? 'attendance.update' : 'attendance.create', entityType:'attendance_session', entityId:payload.id, before, after:payload, metadata:{compositeKey} });
    return payload;
  }

  function getAttendance(groupId, date) { return collection('attendance').find(item => item.compositeKey === `${groupId}|${date}`) || null; }
  function listAttendance() { return collection('attendance'); }

  window.SintropiaStore = Object.freeze({ bootstrap, collection, replaceCollection, writeEntity, getById, saveAttendance, getAttendance, listAttendance, newId, KEYS });
  bootstrap();
})();
