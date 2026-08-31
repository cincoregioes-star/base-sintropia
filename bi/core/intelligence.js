(() => {
  'use strict';

  const E = () => window.SintropiaEntities;
  const S = () => window.SintropiaStore;
  const A = () => window.SintropiaAudit;
  const R = () => window.SintropiaRules;
  const today = () => new Date().toISOString().slice(0,10);
  const now = () => new Date().toISOString();
  const actor = () => window.SintropiaAuth?.ensureSession?.()?.user?.id || 'demo';
  const addDays = (iso, days) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate()+Number(days||0)); return d.toISOString().slice(0,10); };
  const daysBetween = (a,b) => Math.floor((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`))/86400000);
  const clamp = n => Math.max(0, Math.min(100, Math.round(n)));

  function rule(key) { return R()?.get?.(key) || null; }

  function groupAttendance(groupId) {
    const sessions = S().listAttendance().filter(s => s.groupId === groupId).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    const calc = ss => { const rs = ss.flatMap(s=>s.records||[]).filter(r=>['present','absent','justified'].includes(r.status)); const p = rs.filter(r=>r.status==='present').length; return rs.length ? Math.round(p/rs.length*1000)/10 : 0; };
    const latest = sessions.slice(-2), previous = sessions.slice(-4,-2);
    return { sessions, average:calc(sessions), latest:calc(latest), previous:calc(previous), change: previous.length ? Math.round((calc(latest)-calc(previous))*10)/10 : null, lastDate:sessions.at(-1)?.date || null };
  }

  function attendanceHistory(participantId) {
    return S().listAttendance().flatMap(s => (s.records||[]).filter(r=>r.participantId===participantId).map(r=>({date:s.date,groupId:s.groupId,status:r.status,sessionId:s.id}))).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  }

  function absenceStreak(participantId, {countJustified=false}={}) {
    const history=attendanceHistory(participantId); let streak=0; const evidence=[];
    for (const row of history) { if (row.status==='absent' || (countJustified && row.status==='justified')) { streak++; evidence.push(row.date); continue; } break; }
    return {participantId,streak,evidence,lastStatus:history[0]?.status||null,lastDate:history[0]?.date||null,historyCount:history.length};
  }

  function absenceStreaks() {
    const r=rule('consecutive_absences'); const countJustified=Boolean(r?.countJustified);
    return E().listParticipants().filter(p=>p.status!=='inativo').map(p=>({ ...absenceStreak(p.id,{countJustified}), participantName:p.fullName, publicCode:p.publicCode, group:E().participantGroup(p.id)?.name||'Sem grupo' })).sort((a,b)=>b.streak-a.streak || a.participantName.localeCompare(b.participantName,'pt-BR'));
  }

  function signal({id, ruleId=null, ruleVersion=null, category, severity='attention', title, detail, impact=5, urgency=5, confidence=95, view='overview', evidence=[]}) {
    const score = Math.round((impact*.5 + urgency*.35 + confidence/10*.15)*10)/10;
    return { id, ruleId, ruleVersion, category, severity, title, detail, impact, urgency, confidence, score, view, evidence };
  }

  function fromRule(ruleKey, attrs) {
    const r=rule(ruleKey); if(!r?.enabled) return null;
    return signal({ ...attrs, ruleId:r.id, ruleVersion:r.version, category:attrs.category||r.category, severity:attrs.severity||r.severity, impact:attrs.impact??r.impact, urgency:attrs.urgency??r.urgency });
  }

  function signals() {
    const e=E(), m=e.metrics(), out=[], base=today();
    const absRule=rule('consecutive_absences');
    if(absRule?.enabled) absenceStreaks().filter(x=>x.streak>=Number(absRule.threshold||3)).forEach(x=>{ const s=fromRule('consecutive_absences',{id:`SIG-ABS-${x.participantId}`,title:`${x.streak} faltas consecutivas • ${x.participantName}`,detail:`Sequência recente no grupo ${x.group}. A plataforma sinaliza a frequência; a causa deve ser avaliada pela equipe.`,confidence:100,view:'attendance',evidence:[x.publicCode,...x.evidence]}); if(s)out.push(s); });

    const overdue=e.listReferrals().filter(r=>e.referralOverdue(r,base)), refOver=rule('referral_overdue');
    if(refOver?.enabled && overdue.length>=Number(refOver.threshold||1)) { const s=fromRule('referral_overdue',{id:'SIG-REF-OVERDUE',title:`Revisar ${overdue.length} encaminhamento(s) vencido(s)`,detail:'Há prazos vencidos que ainda não foram concluídos.',confidence:100,view:'referrals',evidence:overdue.map(r=>r.publicCode)}); if(s)out.push(s); }
    const refSoon=rule('referral_due_soon');
    if(refSoon?.enabled){const days=Number(refSoon.threshold||3), soon=e.listReferrals().filter(r=>r.status!=='concluido'&&r.dueDate&&r.dueDate>=base&&r.dueDate<=addDays(base,days));if(soon.length){const s=fromRule('referral_due_soon',{id:'SIG-REF-SOON',title:`${soon.length} encaminhamento(s) vencem em até ${days} dias`,detail:'Antecipar revisão reduz risco de atraso no fluxo.',confidence:100,view:'referrals',evidence:soon.map(r=>r.publicCode)});if(s)out.push(s);}}

    const dup=rule('duplicate_participant'); if(dup?.enabled&&m.quality.duplicates>=Number(dup.threshold||1)){const s=fromRule('duplicate_participant',{id:'SIG-DATA-DUP',title:`Resolver ${m.quality.duplicates} possível(is) duplicidade(s)`,detail:'Duplicidades podem distorcer frequência, contagem de usuários e relatórios.',confidence:96,view:'datahealth',evidence:['nome+nascimento/CPF/NIS']});if(s)out.push(s);}
    const terr=rule('missing_territory'); if(terr?.enabled&&m.quality.missingTerritory>=Number(terr.threshold||1)){const s=fromRule('missing_territory',{id:'SIG-DATA-TERRITORY',title:`Completar território de ${m.quality.missingTerritory} usuário(s)`,detail:'Cadastros sem território reduzem a confiabilidade dos mapas e análises territoriais.',confidence:100,view:'datahealth'});if(s)out.push(s);}
    const phone=rule('missing_phone'); if(phone?.enabled&&m.quality.missingPhone>=Number(phone.threshold||1)){const s=fromRule('missing_phone',{id:'SIG-DATA-PHONE',title:`Revisar ${m.quality.missingPhone} cadastro(s) sem telefone`,detail:'Informação de contato ausente pode dificultar ações operacionais.',confidence:100,view:'datahealth'});if(s)out.push(s);}
    const attUser=rule('participant_attention_status'), attentionUsers=e.listParticipants().filter(p=>p.status==='atencao'); if(attUser?.enabled&&attentionUsers.length>=Number(attUser.threshold||1)){const s=fromRule('participant_attention_status',{id:'SIG-USR-ATTENTION',title:`${attentionUsers.length} usuário(s) marcado(s) para atenção`,detail:'Revisar os registros existentes; o sistema não presume causa nem produz diagnóstico.',confidence:100,view:'users',evidence:attentionUsers.map(p=>p.publicCode)});if(s)out.push(s);}

    e.listGroups().filter(g=>g.status==='ativo').forEach(g=>{
      const a=groupAttendance(g.id), low=rule('group_low_attendance');
      if(low?.enabled&&a.sessions.length&&a.average<Number(low.threshold||75)){const critical=Number(low.secondaryThreshold||60), s=fromRule('group_low_attendance',{id:`SIG-GROUP-LOW-${g.id}`,severity:a.average<critical?'critical':low.severity,title:`Frequência baixa em ${g.name}`,detail:`Média registrada: ${a.average}%. Limite atual: ${low.threshold}%.`,impact:a.average<critical?9:low.impact,confidence:100,view:'attendance',evidence:[g.publicCode]});if(s)out.push(s);}
      const drop=rule('group_attendance_drop'); if(drop?.enabled&&a.change!=null&&a.change<=-Number(drop.threshold||10)){const s=fromRule('group_attendance_drop',{id:`SIG-GROUP-DROP-${g.id}`,title:`Queda recente em ${g.name}`,detail:`Variação de ${a.change} p.p.; limite configurado: -${drop.threshold} p.p.`,confidence:92,view:'intelligence',evidence:[g.publicCode]});if(s)out.push(s);}
      const stale=rule('group_without_recent_session'), gap=!a.lastDate?Infinity:daysBetween(a.lastDate,base); if(stale?.enabled&&gap>Number(stale.threshold||21)){const s=fromRule('group_without_recent_session',{id:`SIG-GROUP-STALE-${g.id}`,title:`Grupo sem frequência recente: ${g.name}`,detail:a.lastDate?`Última sessão em ${a.lastDate}; limite ${stale.threshold} dias.`:'Nenhuma sessão registrada.',confidence:100,view:'attendance',evidence:[g.publicCode]});if(s)out.push(s);}
    });
    const workshopRule=rule('planned_workshop_past'), overdueWorkshops=e.listWorkshops().filter(w=>w.status==='planejada'&&w.date&&w.date<base); if(workshopRule?.enabled&&overdueWorkshops.length>=Number(workshopRule.threshold||1)){const s=fromRule('planned_workshop_past',{id:'SIG-WORKSHOP-PAST',title:`${overdueWorkshops.length} oficina(s) planejada(s) com data passada`,detail:'Confirmar realização, reagendamento ou cancelamento para manter o painel consistente.',confidence:100,view:'workshops',evidence:overdueWorkshops.map(w=>w.publicCode)});if(s)out.push(s);}
    return out.filter(Boolean).sort((a,b)=>b.score-a.score||b.urgency-a.urgency||a.title.localeCompare(b.title,'pt-BR'));
  }

  function insights(){const e=E(),out=[];e.listGroups().filter(g=>g.status==='ativo').forEach(g=>{const a=groupAttendance(g.id);if(a.change!=null&&a.change>=8)out.push({id:`INS-GROUP-UP-${g.id}`,tone:'good',title:`Evolução positiva em ${g.name}`,detail:`+${a.change} p.p. nas janelas mais recentes.`,view:'attendance'});});const m=e.metrics();if(m.averageAttendance>=80)out.push({id:'INS-FREQ-GOOD',tone:'good',title:'Frequência média acima da meta de referência',detail:`Média atual: ${m.averageAttendance}%.`,view:'bi'});if(m.workshopsCompleted)out.push({id:'INS-WORKSHOPS',tone:'info',title:`${m.workshopsCompleted} oficina(s) concluída(s)`,detail:'Atividades concluídas já alimentam os indicadores da operação.',view:'workshops'});if(!out.length)out.push({id:'INS-STABLE',tone:'info',title:'Sem tendência positiva forte detectada',detail:'A plataforma continuará observando novos registros.',view:'overview'});return out.slice(0,5);}
  function myDay(){const e=E(),base=today(),workshops=e.listWorkshops().filter(w=>w.date===base).map(w=>({time:'Hoje',tone:'cyan',title:w.title,detail:`${w.status} • ${w.participantIds?.length||0} participante(s)`,view:'workshops'})),due=e.listReferrals().filter(r=>r.status!=='concluido'&&r.dueDate&&r.dueDate<=addDays(base,2)).map(r=>({time:r.dueDate<base?'Vencido':r.dueDate===base?'Hoje':'Próximo',tone:r.dueDate<base?'red':'yellow',title:`${r.publicCode} • ${r.type}`,detail:`Destino: ${r.destination}`,view:'referrals'}));return{date:base,agenda:[...workshops,...due].slice(0,8),priorities:signals().slice(0,4)}}
  function situation(){const m=E().metrics(),sig=signals(),audit=(A()?.list?.(8)||[]).map(x=>({timestamp:x.timestamp,tone:String(x.action).includes('attendance')?'good':String(x.action).includes('workshop')?'cyan':String(x.action).includes('referral')?'yellow':String(x.action).includes('decision')?'violet':'blue',text:`${x.action} • ${x.entityType}`})),critical=sig.filter(s=>s.severity==='critical').length;return{status:critical?'ATENÇÃO OPERACIONAL':sig.length>4?'OBSERVAÇÃO':'OPERAÇÃO NORMAL',tone:critical?'danger':sig.length>4?'warning':'good',metrics:{users:m.participantsActive,groups:m.groupsActive,workshops:m.workshopsTotal,referrals:m.openReferrals,alerts:sig.length},events:audit.slice(0,6)}}
  function riskHealth(){const sig=signals(),operation=clamp(100-Math.min(40,sig.filter(s=>['Operação','Frequência','Oficinas'].includes(s.category)).reduce((n,s)=>n+s.impact,0)*2)),data=window.SintropiaKPI?.qualityScore?.()??0,security=98,performance=94,continuity=92;return{overall:Math.round(operation*.28+data*.27+security*.18+performance*.12+continuity*.15),operation,data,security,performance,continuity}}

  function ensureDecisionRole(){const role=window.SintropiaAuth?.ensureSession?.()?.user?.role;if(!['coordenador','gestor','administrador'].includes(role))throw new Error('Seu perfil não possui permissão para registrar decisões executivas.');return role;}
  function decisionById(id){return S().getById('decisions',id)}
  function addDecisionEvent(decisionId,type,note='',metadata={}){ensureDecisionRole();const d=decisionById(decisionId);if(!d)throw new Error('Decisão não encontrada.');const event={id:S().newId('DEV'),decisionId,type,note:String(note||'').trim(),metadata,createdAt:now(),createdBy:actor()};S().writeEntity('decisionEvents',event,{action:'decision.event',entityType:'decision_event',metadata:{decisionId,type}});return event;}
  function recordDecision(signalId,patch={}){ensureDecisionRole();const sig=signals().find(s=>s.id===signalId);if(!sig)throw new Error('Sinal não encontrado ou já resolvido.');const all=S().collection('decisions'),open=all.find(d=>d.signalId===signalId&&d.status!=='encerrada'),base={signalId,title:sig.title,category:sig.category,impact:sig.impact,urgency:sig.urgency,confidence:sig.confidence,evidence:sig.evidence,ruleId:sig.ruleId,ruleVersion:sig.ruleVersion,status:'em_analise',rationale:'',actionPlan:'',owner:'',dueDate:'',expectedResult:'',resultSummary:'',outcome:'',...patch},row=open?{...open,...base,updatedAt:now(),updatedBy:actor(),version:(open.version||1)+1}:{id:S().newId('DEC'),...base,createdAt:now(),createdBy:actor(),updatedAt:now(),updatedBy:actor(),version:1};S().writeEntity('decisions',row,{action:open?'decision.update':'decision.create',entityType:'decision',before:open||null,metadata:{signalId,version:row.version}});if(!open)addDecisionEvent(row.id,'created',`Decisão aberta a partir do sinal ${signalId}.`,{signalId,ruleId:sig.ruleId});return row;}
  function updateDecision(id,patch={}){ensureDecisionRole();const before=decisionById(id);if(!before)throw new Error('Decisão não encontrada.');const row={...before,...patch,updatedAt:now(),updatedBy:actor(),version:(before.version||1)+1};S().writeEntity('decisions',row,{action:'decision.update',entityType:'decision',before,metadata:{version:row.version}});addDecisionEvent(id,'updated',patch.note||'Decisão atualizada.',{changed:Object.keys(patch).filter(k=>k!=='note')});return row;}
  function closeDecision(id,{resultSummary='',outcome='avaliar',note=''}={}){const row=updateDecision(id,{status:'encerrada',resultSummary,outcome,closedAt:now(),note:note||'Decisão encerrada.'});addDecisionEvent(id,'closed',note||resultSummary||'Decisão encerrada.',{outcome});return row;}
  function decisionJournal(){const decisions=S().collection('decisions').slice().sort((a,b)=>String(b.updatedAt||b.createdAt).localeCompare(String(a.updatedAt||a.createdAt))),events=S().collection('decisionEvents');return decisions.map(d=>({...d,events:events.filter(e=>e.decisionId===d.id).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))}));}

  window.SintropiaIntelligence=Object.freeze({signals,insights,myDay,situation,riskHealth,groupAttendance,attendanceHistory,absenceStreak,absenceStreaks,recordDecision,updateDecision,closeDecision,addDecisionEvent,decisionJournal,decisionById});
})();
