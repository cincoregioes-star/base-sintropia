(() => {
  'use strict';
  const definitions = Object.freeze([
    { id:'KPI-001', key:'participantsActive', name:'Usuários ativos', unit:'count', version:'1.0', source:'participants', definition:'Participantes cujo status não é inativo.' },
    { id:'KPI-002', key:'groupsActive', name:'Grupos ativos', unit:'count', version:'1.0', source:'groups', definition:'Grupos com status ativo.' },
    { id:'KPI-003', key:'averageAttendance', name:'Frequência média', unit:'percent', version:'1.0', source:'attendance', definition:'Presenças registradas divididas pelo total de registros de frequência válidos.' },
    { id:'KPI-004', key:'workshopsTotal', name:'Oficinas registradas', unit:'count', version:'1.0', source:'workshops', definition:'Total de oficinas cadastradas no escopo atual.' },
    { id:'KPI-005', key:'openReferrals', name:'Encaminhamentos em aberto', unit:'count', version:'1.0', source:'referrals', definition:'Encaminhamentos cujo status é diferente de concluído.' },
    { id:'KPI-006', key:'overdueReferrals', name:'Encaminhamentos vencidos', unit:'count', version:'1.0', source:'referrals', definition:'Encaminhamentos em aberto com prazo anterior à data atual.' },
    { id:'KPI-007', key:'alertsActive', name:'Alertas operacionais', unit:'count', version:'1.0', source:'intelligence_rules', definition:'Quantidade de sinais ativos derivados pelas regras do Early Warning System.' },
    { id:'KPI-008', key:'dataQualityScore', name:'Saúde dos dados', unit:'score', version:'1.0', source:'data_quality', definition:'Índice composto de completude, unicidade e cobertura territorial.' }
  ]);
  function qualityScore(){const q=window.SintropiaEntities?.qualitySummary?.()||{completeness:0,duplicates:0,missingTerritory:0};return Math.max(0,Math.min(100,Math.round(q.completeness*.65+(100-Math.min(100,q.duplicates*10))*.2+(100-Math.min(100,q.missingTerritory*5))*.15)))}
  function evaluate(){const m=window.SintropiaEntities?.metrics?.()||{},signalCount=window.SintropiaIntelligence?.signals?.().length,values={...m,alertsActive:Number.isFinite(signalCount)?signalCount:(m.alertsActive||0),dataQualityScore:qualityScore()};return definitions.map(d=>({...d,value:values[d.key]??0,refreshedAt:new Date().toISOString(),confidence:d.source==='intelligence_rules'?96:100}))}
  function get(idOrKey){return evaluate().find(k=>k.id===idOrKey||k.key===idOrKey)||null}
  function format(kpi){if(!kpi)return'—';if(kpi.unit==='percent')return `${Number(kpi.value||0).toLocaleString('pt-BR',{maximumFractionDigits:1})}%`;if(kpi.unit==='score')return `${Math.round(Number(kpi.value||0))}/100`;return Number(kpi.value||0).toLocaleString('pt-BR')}
  function explain(idOrKey){const k=get(idOrKey);return k?{id:k.id,name:k.name,value:format(k),definition:k.definition,source:k.source,version:k.version,confidence:k.confidence,refreshedAt:k.refreshedAt}:null}
  window.SintropiaKPI=Object.freeze({definitions,evaluate,get,format,explain,qualityScore});
})();
