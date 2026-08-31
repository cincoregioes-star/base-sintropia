(() => {
  'use strict';

  const S = () => window.SintropiaStore;
  const auth = () => window.SintropiaAuth?.ensureSession?.();
  const actor = () => auth()?.user?.id || 'demo';
  const now = () => new Date().toISOString();

  const DEFAULT_RULES = Object.freeze([
    { id:'RULE-ATT-CONSEC', key:'consecutive_absences', name:'Ausências consecutivas', category:'Frequência', enabled:true, threshold:3, secondaryThreshold:null, countJustified:false, severity:'attention', impact:8, urgency:8, description:'Sinaliza usuário com sequência de faltas não justificadas igual ou superior ao limite.' },
    { id:'RULE-GROUP-LOW', key:'group_low_attendance', name:'Frequência baixa do grupo', category:'Frequência', enabled:true, threshold:75, secondaryThreshold:60, severity:'attention', impact:7, urgency:7, description:'Sinaliza grupo cuja frequência média fique abaixo do limite; abaixo do limite crítico usa severidade crítica.' },
    { id:'RULE-GROUP-DROP', key:'group_attendance_drop', name:'Queda recente de frequência', category:'Frequência', enabled:true, threshold:10, secondaryThreshold:null, severity:'attention', impact:7, urgency:7, description:'Sinaliza queda, em pontos percentuais, entre duas janelas recentes.' },
    { id:'RULE-GROUP-STALE', key:'group_without_recent_session', name:'Grupo sem frequência recente', category:'Operação', enabled:true, threshold:21, secondaryThreshold:null, severity:'attention', impact:6, urgency:6, description:'Sinaliza grupo ativo sem sessão registrada dentro da quantidade de dias configurada.' },
    { id:'RULE-REF-OVERDUE', key:'referral_overdue', name:'Encaminhamento vencido', category:'Encaminhamentos', enabled:true, threshold:1, secondaryThreshold:null, severity:'critical', impact:9, urgency:10, description:'Sinaliza quando existe ao menos a quantidade configurada de encaminhamentos vencidos.' },
    { id:'RULE-REF-SOON', key:'referral_due_soon', name:'Encaminhamento próximo do prazo', category:'Encaminhamentos', enabled:true, threshold:3, secondaryThreshold:null, severity:'attention', impact:7, urgency:8, description:'Considera como próximo do prazo o encaminhamento que vence dentro do número de dias configurado.' },
    { id:'RULE-DATA-DUP', key:'duplicate_participant', name:'Possível duplicidade', category:'Dados', enabled:true, threshold:1, secondaryThreshold:null, severity:'critical', impact:9, urgency:8, description:'Sinaliza quando o motor de qualidade detecta possíveis cadastros duplicados.' },
    { id:'RULE-DATA-TERRITORY', key:'missing_territory', name:'Cadastro sem território', category:'Dados', enabled:true, threshold:1, secondaryThreshold:null, severity:'attention', impact:6, urgency:5, description:'Sinaliza quando usuários ativos estão sem comunidade/território.' },
    { id:'RULE-DATA-PHONE', key:'missing_phone', name:'Cadastro sem telefone', category:'Dados', enabled:true, threshold:1, secondaryThreshold:null, severity:'info', impact:4, urgency:4, description:'Sinaliza ausência de telefone como pendência operacional de menor severidade.' },
    { id:'RULE-WORKSHOP-PAST', key:'planned_workshop_past', name:'Oficina planejada com data passada', category:'Oficinas', enabled:true, threshold:1, secondaryThreshold:null, severity:'attention', impact:5, urgency:6, description:'Sinaliza oficinas ainda planejadas cuja data já passou.' },
    { id:'RULE-USR-ATT', key:'participant_attention_status', name:'Usuário marcado para atenção', category:'Acompanhamento', enabled:true, threshold:1, secondaryThreshold:null, severity:'attention', impact:7, urgency:6, description:'Sinaliza usuários marcados manualmente para atenção, sem inferir causa ou diagnóstico.' }
  ]);

  function bootstrap() {
    const existing = S().collection('alertRules');
    if (!existing.length) {
      S().replaceCollection('alertRules', DEFAULT_RULES.map(r => ({...r, version:1, updatedAt:now(), updatedBy:'system'})));
      return;
    }
    const byId = new Map(existing.map(r => [r.id, r]));
    let changed = false;
    for (const def of DEFAULT_RULES) {
      if (!byId.has(def.id)) { existing.push({...def, version:1, updatedAt:now(), updatedBy:'system'}); changed = true; }
    }
    if (changed) S().replaceCollection('alertRules', existing);
  }

  function list() { bootstrap(); return S().collection('alertRules'); }
  function get(idOrKey) { return list().find(r => r.id === idOrKey || r.key === idOrKey) || null; }
  function enabled(key) { const r = get(key); return Boolean(r?.enabled); }

  function canManage() {
    const role = auth()?.user?.role;
    return ['coordenador','gestor','administrador'].includes(role);
  }

  function update(id, patch) {
    if (!canManage()) throw new Error('Seu perfil não possui permissão para alterar regras do Radar.');
    const before = get(id); if (!before) throw new Error('Regra não encontrada.');
    const clean = { ...patch };
    if ('threshold' in clean) clean.threshold = Number(clean.threshold);
    if ('secondaryThreshold' in clean && clean.secondaryThreshold !== null && clean.secondaryThreshold !== '') clean.secondaryThreshold = Number(clean.secondaryThreshold);
    if ('enabled' in clean) clean.enabled = Boolean(clean.enabled);
    if ('countJustified' in clean) clean.countJustified = Boolean(clean.countJustified);
    const row = { ...before, ...clean, updatedAt:now(), updatedBy:actor(), version:(before.version||1)+1 };
    S().writeEntity('alertRules', row, { action:'rule.update', entityType:'alert_rule', before, metadata:{ version:row.version } });
    return row;
  }

  function reset(id) {
    if (!canManage()) throw new Error('Seu perfil não possui permissão para restaurar regras.');
    const def = DEFAULT_RULES.find(r => r.id === id); if (!def) throw new Error('Regra padrão não encontrada.');
    const before = get(id);
    const row = { ...def, version:(before?.version||0)+1, updatedAt:now(), updatedBy:actor() };
    S().writeEntity('alertRules', row, { action:'rule.reset', entityType:'alert_rule', before, metadata:{ version:row.version } });
    return row;
  }

  window.SintropiaRules = Object.freeze({ DEFAULT_RULES, bootstrap, list, get, enabled, update, reset, canManage });
  bootstrap();
})();
