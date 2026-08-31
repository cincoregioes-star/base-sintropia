(() => {
  'use strict';

  const definitions = Object.freeze([
    { id:'KPI-001', key:'participantsActive', name:'Usuários ativos', unit:'count', version:'1.1', source:'participants', definition:'Participantes cujo status não é inativo.', formula:'COUNT(participants WHERE status != inativo)' },
    { id:'KPI-002', key:'groupsActive', name:'Grupos ativos', unit:'count', version:'1.1', source:'groups', definition:'Grupos com status ativo.', formula:'COUNT(groups WHERE status = ativo)' },
    { id:'KPI-003', key:'averageAttendance', name:'Frequência média', unit:'percent', version:'1.1', source:'attendance', definition:'Presenças válidas divididas pelo total de registros válidos de frequência.', formula:'presenças / (presenças + faltas + justificadas) × 100' },
    { id:'KPI-004', key:'workshopsTotal', name:'Oficinas registradas', unit:'count', version:'1.1', source:'workshops', definition:'Total de oficinas cadastradas no escopo atual.', formula:'COUNT(workshops)' },
    { id:'KPI-005', key:'openReferrals', name:'Encaminhamentos em aberto', unit:'count', version:'1.1', source:'referrals', definition:'Encaminhamentos cujo status é diferente de concluído.', formula:'COUNT(referrals WHERE status != concluido)' },
    { id:'KPI-006', key:'overdueReferrals', name:'Encaminhamentos vencidos', unit:'count', version:'1.1', source:'referrals', definition:'Encaminhamentos em aberto com prazo anterior à data atual.', formula:'COUNT(referrals WHERE status != concluido AND due_date < hoje)' },
    { id:'KPI-007', key:'alertsActive', name:'Alertas operacionais', unit:'count', version:'1.1', source:'intelligence_rules', definition:'Quantidade de sinais ativos derivados somente das regras do Radar habilitadas.', formula:'COUNT(EarlyWarning.signals WHERE regra_ativa = true)' },
    { id:'KPI-008', key:'dataQualityScore', name:'Saúde dos dados', unit:'score', version:'1.1', source:'data_quality', definition:'Índice composto de completude, unicidade e cobertura territorial.', formula:'completude×0,65 + unicidade×0,20 + cobertura_territorial×0,15' }
  ]);

  function qualityScore() {
    const q = window.SintropiaEntities?.qualitySummary?.() || { completeness:0, duplicates:0, missingTerritory:0 };
    return Math.max(0, Math.min(100, Math.round((q.completeness * .65) + ((100 - Math.min(100, q.duplicates * 10)) * .20) + ((100 - Math.min(100, q.missingTerritory * 5)) * .15)));
  }

  function lineage(key) {
    const S = window.SintropiaStore, E = window.SintropiaEntities;
    if (!S) return { considered:0, ignored:0, sourceRows:0, detail:'Armazenamento indisponível.' };
    if (key === 'participantsActive') { const rows=S.collection('participants'), considered=rows.filter(r=>r.status!=='inativo').length; return {considered,ignored:rows.length-considered,sourceRows:rows.length,detail:'Considera participantes ativos, em atenção ou afastados; ignora status inativo.'}; }
    if (key === 'groupsActive') { const rows=S.collection('groups'), considered=rows.filter(r=>r.status==='ativo').length; return {considered,ignored:rows.length-considered,sourceRows:rows.length,detail:'Considera somente grupos com status ativo.'}; }
    if (key === 'averageAttendance') { const sessions=S.listAttendance(), raw=sessions.flatMap(s=>s.records||[]), valid=raw.filter(r=>['present','absent','justified'].includes(r.status)); return {considered:valid.length,ignored:raw.length-valid.length,sourceRows:sessions.length,detail:`${sessions.length} sessão(ões); ${valid.filter(r=>r.status==='present').length} presença(s) válidas.`}; }
    if (key === 'workshopsTotal') { const rows=S.collection('workshops'); return {considered:rows.length,ignored:0,sourceRows:rows.length,detail:'Todas as oficinas cadastradas no escopo atual.'}; }
    if (key === 'openReferrals') { const rows=S.collection('referrals'), considered=rows.filter(r=>r.status!=='concluido').length; return {considered,ignored:rows.length-considered,sourceRows:rows.length,detail:'Ignora encaminhamentos concluídos.'}; }
    if (key === 'overdueReferrals') { const rows=S.collection('referrals'), considered=rows.filter(r=>E?.referralOverdue?.(r)).length; return {considered,ignored:rows.length-considered,sourceRows:rows.length,detail:'Considera apenas encaminhamentos não concluídos com prazo anterior a hoje.'}; }
    if (key === 'alertsActive') { const rules=window.SintropiaRules?.list?.()||[], signals=window.SintropiaIntelligence?.signals?.()||[]; return {considered:signals.length,ignored:rules.filter(r=>!r.enabled).length,sourceRows:rules.length,detail:`${rules.filter(r=>r.enabled).length} regra(s) ativa(s); regras desativadas não geram sinal.`}; }
    if (key === 'dataQualityScore') { const q=E?.qualitySummary?.()||{}; return {considered:q.active||0,ignored:0,sourceRows:q.active||0,detail:`Completude ${q.completeness||0}%, duplicidades ${q.duplicates||0}, sem território ${q.missingTerritory||0}.`}; }
    return {considered:0,ignored:0,sourceRows:0,detail:'Sem linhagem detalhada disponível.'};
  }

  function evaluate() {
    const m = window.SintropiaEntities?.metrics?.() || {}, signalCount = window.SintropiaIntelligence?.signals?.().length;
    const values = { ...m, alertsActive:Number.isFinite(signalCount)?signalCount:(m.alertsActive||0), dataQualityScore:qualityScore() };
    return definitions.map(def=>({...def,value:values[def.key]??0,refreshedAt:new Date().toISOString(),confidence:def.source==='intelligence_rules'?96:100}));
  }
  function get(idOrKey){return evaluate().find(k=>k.id===idOrKey||k.key===idOrKey)||null}
  function format(kpi){if(!kpi)return'—';if(kpi.unit==='percent')return `${Number(kpi.value||0).toLocaleString('pt-BR',{maximumFractionDigits:1})}%`;if(kpi.unit==='score')return `${Math.round(Number(kpi.value||0))}/100`;return Number(kpi.value||0).toLocaleString('pt-BR')}
  function explain(idOrKey){const kpi=get(idOrKey);return kpi?{id:kpi.id,key:kpi.key,name:kpi.name,value:format(kpi),definition:kpi.definition,formula:kpi.formula,source:kpi.source,version:kpi.version,confidence:kpi.confidence,refreshedAt:kpi.refreshedAt,lineage:lineage(kpi.key)}:null}
  window.SintropiaKPI=Object.freeze({definitions,evaluate,get,format,explain,qualityScore,lineage});
})();
