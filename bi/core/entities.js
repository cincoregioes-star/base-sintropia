(() => {
  'use strict';

  const store = () => window.SintropiaStore;
  const now = () => new Date().toISOString();
  const today = () => new Date().toISOString().slice(0,10);
  const session = () => window.SintropiaAuth?.ensureSession?.();
  const actor = () => session()?.user?.id || 'demo';
  const norm = value => String(value || '').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
  const digits = value => String(value || '').replace(/\D/g,'');

  const DEMO = Object.freeze({
    families:[
      {id:'FAM-DEMO-001',publicCode:'FAM-000001',referenceName:'Mariana Souza',community:'Centro',phone:'(85) 99999-1001',status:'ativo',version:1},
      {id:'FAM-DEMO-002',publicCode:'FAM-000002',referenceName:'Roberto Lima',community:'Vila Esperança',phone:'(85) 99999-1002',status:'ativo',version:1},
      {id:'FAM-DEMO-003',publicCode:'FAM-000003',referenceName:'Patrícia Alves',community:'Jardim das Flores',phone:'(85) 99999-1003',status:'ativo',version:1}
    ],
    groups:[
      {id:'GRP-DEMO-CRI-A',publicCode:'GRP-000001',name:'Crianças 6–9 • A',unit:'CRAS Centro',shift:'manhã',ageMin:6,ageMax:9,capacity:30,status:'ativo',version:1},
      {id:'GRP-DEMO-ADO-A',publicCode:'GRP-000002',name:'Adolescentes 12–14 • A',unit:'CRAS Centro',shift:'tarde',ageMin:12,ageMax:14,capacity:30,status:'ativo',version:1},
      {id:'GRP-DEMO-JUV-B',publicCode:'GRP-000003',name:'Juventude 15–17 • B',unit:'CRAS Litoral',shift:'tarde',ageMin:15,ageMax:17,capacity:25,status:'ativo',version:1}
    ],
    participants:[
      {id:'USR-DEMO-1',publicCode:'USR-000184',fullName:'Ana Clara Souza',birthDate:'2010-03-18',phone:'(85) 99999-2001',guardianName:'Mariana Souza',familyId:'FAM-DEMO-001',community:'Centro',status:'ativo',version:1},
      {id:'USR-DEMO-2',publicCode:'USR-000207',fullName:'Bruno Henrique Lima',birthDate:'2009-08-09',phone:'(85) 99999-2002',guardianName:'Roberto Lima',familyId:'FAM-DEMO-002',community:'Vila Esperança',status:'ativo',version:1},
      {id:'USR-DEMO-3',publicCode:'USR-000231',fullName:'Carla Mendes Alves',birthDate:'2017-01-24',phone:'(85) 99999-2003',guardianName:'Patrícia Alves',familyId:'FAM-DEMO-003',community:'Jardim das Flores',status:'ativo',version:1},
      {id:'USR-DEMO-4',publicCode:'USR-000264',fullName:'Daniel Rocha Santos',birthDate:'2009-11-02',phone:'',familyId:null,community:'Nova Sintropia',status:'atencao',version:1},
      {id:'USR-DEMO-5',publicCode:'USR-000271',fullName:'Eduardo Alves',birthDate:'2008-06-30',phone:'',familyId:null,community:'Morro Branco',status:'ativo',version:1}
    ],
    memberships:[
      {id:'MEM-1',participantId:'USR-DEMO-1',groupId:'GRP-DEMO-JUV-B',joinedAt:'2026-08-01',leftAt:null,status:'ativo'},
      {id:'MEM-2',participantId:'USR-DEMO-2',groupId:'GRP-DEMO-JUV-B',joinedAt:'2026-08-01',leftAt:null,status:'ativo'},
      {id:'MEM-3',participantId:'USR-DEMO-3',groupId:'GRP-DEMO-CRI-A',joinedAt:'2026-08-01',leftAt:null,status:'ativo'},
      {id:'MEM-4',participantId:'USR-DEMO-4',groupId:'GRP-DEMO-JUV-B',joinedAt:'2026-08-01',leftAt:null,status:'ativo'},
      {id:'MEM-5',participantId:'USR-DEMO-5',groupId:'GRP-DEMO-JUV-B',joinedAt:'2026-08-01',leftAt:null,status:'ativo'}
    ],
    attendance:[
      {id:'ATT-1',compositeKey:'GRP-DEMO-JUV-B|2026-08-12',groupId:'GRP-DEMO-JUV-B',date:'2026-08-12',records:[{participantId:'USR-DEMO-1',status:'present'},{participantId:'USR-DEMO-2',status:'present'},{participantId:'USR-DEMO-4',status:'absent'},{participantId:'USR-DEMO-5',status:'present'}],version:1},
      {id:'ATT-2',compositeKey:'GRP-DEMO-JUV-B|2026-08-19',groupId:'GRP-DEMO-JUV-B',date:'2026-08-19',records:[{participantId:'USR-DEMO-1',status:'present'},{participantId:'USR-DEMO-2',status:'present'},{participantId:'USR-DEMO-4',status:'present'},{participantId:'USR-DEMO-5',status:'absent'}],version:1},
      {id:'ATT-3',compositeKey:'GRP-DEMO-JUV-B|2026-08-26',groupId:'GRP-DEMO-JUV-B',date:'2026-08-26',records:[{participantId:'USR-DEMO-1',status:'present'},{participantId:'USR-DEMO-2',status:'present'},{participantId:'USR-DEMO-4',status:'absent'},{participantId:'USR-DEMO-5',status:'present'}],version:1}
    ],
    workshops:[
      {id:'OFI-1',publicCode:'OFI-000001',title:'Cidadania Digital',category:'Cidadania',groupId:'GRP-DEMO-JUV-B',date:'2026-08-10',durationMinutes:90,participantIds:['USR-DEMO-1','USR-DEMO-2','USR-DEMO-4'],status:'concluida',version:1},
      {id:'OFI-2',publicCode:'OFI-000002',title:'Convivência e Cooperação',category:'Convivência',groupId:'GRP-DEMO-CRI-A',date:'2026-08-18',durationMinutes:60,participantIds:['USR-DEMO-3'],status:'concluida',version:1},
      {id:'OFI-3',publicCode:'OFI-000003',title:'Território e Meio Ambiente',category:'Meio Ambiente',groupId:'GRP-DEMO-JUV-B',date:'2026-09-04',durationMinutes:90,participantIds:[],status:'planejada',version:1}
    ],
    referrals:[
      {id:'ENC-1',publicCode:'ENC-000001',participantId:'USR-DEMO-4',type:'Acompanhamento de frequência',destination:'Equipe técnica',dueDate:'2026-08-30',status:'aguardando',notes:'Ausências recorrentes registradas.',version:1},
      {id:'ENC-2',publicCode:'ENC-000002',participantId:'USR-DEMO-2',type:'Atualização cadastral',destination:'Cadastro',dueDate:'2026-09-05',status:'criado',version:1},
      {id:'ENC-3',publicCode:'ENC-000003',participantId:'USR-DEMO-1',type:'Articulação de rede',destination:'Coordenação',dueDate:'2026-09-02',status:'analise',version:1}
    ]
  });

  function bootstrapDemo(){for(const name of Object.keys(DEMO)) if(!store().collection(name).length) store().replaceCollection(name,DEMO[name]);}
  function publicCode(prefix,name){const max=store().collection(name).reduce((a,r)=>Math.max(a,Number(String(r.publicCode||'').match(/(\d+)$/)?.[1]||0)),0);return `${prefix}-${String(max+1).padStart(6,'0')}`;}

  function duplicateCandidates(input,ignoreId=null){const name=norm(input.fullName),birth=input.birthDate||'',cpf=digits(input.cpf),nis=digits(input.nis);return store().collection('participants').filter(p=>p.id!==ignoreId).map(p=>{let score=0,reasons=[];if(cpf&&digits(p.cpf)===cpf){score=100;reasons.push('CPF idêntico')}if(nis&&digits(p.nis)===nis){score=100;reasons.push('NIS idêntico')}if(name&&norm(p.fullName)===name){score+=65;reasons.push('nome idêntico')}if(birth&&p.birthDate===birth){score+=30;reasons.push('nascimento idêntico')}return{participant:p,score:Math.min(score,100),reasons}}).filter(x=>x.score>=65).sort((a,b)=>b.score-a.score);}
  function validateParticipant(input,ignoreId=null){const errors=[];if(!String(input.fullName||'').trim())errors.push('Nome completo é obrigatório.');if(input.birthDate&&Date.parse(input.birthDate)>Date.now())errors.push('Data de nascimento não pode estar no futuro.');if(digits(input.cpf)&&digits(input.cpf).length!==11)errors.push('CPF deve ter 11 dígitos.');if(digits(input.nis)&&digits(input.nis).length!==11)errors.push('NIS deve ter 11 dígitos.');return{ok:!errors.length,errors,duplicates:duplicateCandidates(input,ignoreId)}}

  function createParticipant(input,{forceDuplicate=false}={}){const check=validateParticipant(input);if(!check.ok)throw new Error(check.errors.join(' '));if(!forceDuplicate&&check.duplicates.some(x=>x.score>=90))throw Object.assign(new Error('Possível cadastro duplicado detectado.'),{code:'DUPLICATE',validation:check});const row={...input,id:store().newId('USR'),publicCode:publicCode('USR','participants'),cpf:digits(input.cpf),nis:digits(input.nis),status:input.status||'ativo',createdAt:now(),createdBy:actor(),updatedAt:now(),updatedBy:actor(),version:1};return store().writeEntity('participants',row,{action:'participant.create',entityType:'participant',metadata:{version:1}})}
  function updateParticipant(id,input,{forceDuplicate=false}={}){const before=store().getById('participants',id);if(!before)throw new Error('Usuário não encontrado.');const check=validateParticipant(input,id);if(!check.ok)throw new Error(check.errors.join(' '));if(!forceDuplicate&&check.duplicates.some(x=>x.score>=90))throw Object.assign(new Error('Possível cadastro duplicado detectado.'),{code:'DUPLICATE',validation:check});const row={...before,...input,cpf:digits(input.cpf),nis:digits(input.nis),updatedAt:now(),updatedBy:actor(),version:(before.version||1)+1};return store().writeEntity('participants',row,{action:'participant.update',entityType:'participant',before,metadata:{version:row.version}})}
  const deactivateParticipant=id=>updateParticipant(id,{...store().getById('participants',id),status:'inativo'},{forceDuplicate:true});

  function createFamily(input){const row={...input,id:store().newId('FAM'),publicCode:publicCode('FAM','families'),status:'ativo',createdAt:now(),createdBy:actor(),updatedAt:now(),updatedBy:actor(),version:1};return store().writeEntity('families',row,{action:'family.create',entityType:'family',metadata:{version:1}})}
  function updateFamily(id,input){const before=store().getById('families',id);const row={...before,...input,updatedAt:now(),updatedBy:actor(),version:(before.version||1)+1};return store().writeEntity('families',row,{action:'family.update',entityType:'family',before,metadata:{version:row.version}})}
  function createGroup(input){const row={...input,id:store().newId('GRP'),publicCode:publicCode('GRP','groups'),capacity:Number(input.capacity||30),ageMin:input.ageMin===''?null:Number(input.ageMin),ageMax:input.ageMax===''?null:Number(input.ageMax),status:'ativo',createdAt:now(),createdBy:actor(),updatedAt:now(),updatedBy:actor(),version:1};return store().writeEntity('groups',row,{action:'group.create',entityType:'group',metadata:{version:1}})}
  function updateGroup(id,input){const before=store().getById('groups',id);const row={...before,...input,capacity:Number(input.capacity||before.capacity||30),updatedAt:now(),updatedBy:actor(),version:(before.version||1)+1};return store().writeEntity('groups',row,{action:'group.update',entityType:'group',before,metadata:{version:row.version}})}

  function assignParticipantToGroup(participantId,groupId){const rows=store().collection('memberships'),current=rows.find(m=>m.participantId===participantId&&m.leftAt==null&&m.status==='ativo');if(current?.groupId===groupId)return current;if(current){current.leftAt=today();current.status='inativo'}const row={id:store().newId('MEM'),participantId,groupId,joinedAt:today(),leftAt:null,status:'ativo'};rows.push(row);store().replaceCollection('memberships',rows);return row}
  function unassignParticipantFromGroup(participantId){const rows=store().collection('memberships'),m=rows.find(x=>x.participantId===participantId&&x.leftAt==null&&x.status==='ativo');if(!m)return null;m.leftAt=today();m.status='inativo';store().replaceCollection('memberships',rows);return m}
  function participantGroup(participantId){const m=store().collection('memberships').find(x=>x.participantId===participantId&&x.leftAt==null&&x.status==='ativo');return m?store().getById('groups',m.groupId):null}
  function groupMembers(groupId){const ids=new Set(store().collection('memberships').filter(m=>m.groupId===groupId&&m.leftAt==null&&m.status==='ativo').map(m=>m.participantId));return store().collection('participants').filter(p=>ids.has(p.id)&&p.status!=='inativo')}
  const familyMembers=familyId=>store().collection('participants').filter(p=>p.familyId===familyId&&p.status!=='inativo');

  function createWorkshop(input){const row={...input,id:store().newId('OFI'),publicCode:publicCode('OFI','workshops'),participantIds:[...new Set(input.participantIds||[])],status:input.status||'planejada',createdAt:now(),createdBy:actor(),updatedAt:now(),updatedBy:actor(),version:1};return store().writeEntity('workshops',row,{action:'workshop.create',entityType:'workshop',metadata:{version:1}})}
  function updateWorkshop(id,input){const before=store().getById('workshops',id),row={...before,...input,participantIds:[...new Set(input.participantIds||before.participantIds||[])],updatedAt:now(),updatedBy:actor(),version:(before.version||1)+1};return store().writeEntity('workshops',row,{action:'workshop.update',entityType:'workshop',before,metadata:{version:row.version}})}
  const completeWorkshop=id=>updateWorkshop(id,{...store().getById('workshops',id),status:'concluida'});
  function createReferral(input){const row={...input,id:store().newId('ENC'),publicCode:publicCode('ENC','referrals'),status:input.status||'criado',createdAt:now(),createdBy:actor(),updatedAt:now(),updatedBy:actor(),version:1};return store().writeEntity('referrals',row,{action:'referral.create',entityType:'referral',metadata:{version:1}})}
  function updateReferral(id,input){const before=store().getById('referrals',id),row={...before,...input,updatedAt:now(),updatedBy:actor(),version:(before.version||1)+1};return store().writeEntity('referrals',row,{action:'referral.update',entityType:'referral',before,metadata:{version:row.version}})}
  const referralOverdue=(r,base=today())=>r.status!=='concluido'&&Boolean(r.dueDate)&&r.dueDate<base;

  function ageOn(v,ref=new Date()){if(!v)return null;const d=new Date(`${v}T00:00:00`);let a=ref.getFullYear()-d.getFullYear();const m=ref.getMonth()-d.getMonth();if(m<0||(m===0&&ref.getDate()<d.getDate()))a--;return a}
  function qualitySummary(){const active=store().collection('participants').filter(p=>p.status!=='inativo'),seen=new Set();let duplicates=0;active.forEach(p=>{const k=`${norm(p.fullName)}|${p.birthDate||''}`;if(seen.has(k))duplicates++;else seen.add(k)});const missingTerritory=active.filter(p=>!p.community).length,missingPhone=active.filter(p=>!p.phone).length,filled=active.reduce((n,p)=>n+['fullName','birthDate','community'].filter(f=>p[f]).length,0),possible=Math.max(1,active.length*3);return{active:active.length,duplicates,missingTerritory,missingPhone,completeness:Math.round(filled/possible*100)}}
  function metrics(){const participants=store().collection('participants').filter(p=>p.status!=='inativo'),groups=store().collection('groups').filter(g=>g.status==='ativo'),attendance=store().collection('attendance'),workshops=store().collection('workshops'),referrals=store().collection('referrals'),quality=qualitySummary(),records=attendance.flatMap(s=>s.records||[]),present=records.filter(r=>r.status==='present').length,averageAttendance=records.length?Math.round(present/records.length*1000)/10:0,lowAttendanceSessions=attendance.filter(s=>{const rs=s.records||[];return rs.length&&rs.filter(r=>r.status==='present').length/rs.length<.7}).length,overdueReferrals=referrals.filter(r=>referralOverdue(r)).length,openReferrals=referrals.filter(r=>r.status!=='concluido').length,categoryCounts={};workshops.forEach(w=>categoryCounts[w.category]=(categoryCounts[w.category]||0)+1);const ageBuckets={'0–6':0,'7–11':0,'12–14':0,'15–17':0,'18–29':0,'30+':0};participants.forEach(p=>{const a=ageOn(p.birthDate);if(a==null)return;if(a<=6)ageBuckets['0–6']++;else if(a<=11)ageBuckets['7–11']++;else if(a<=14)ageBuckets['12–14']++;else if(a<=17)ageBuckets['15–17']++;else if(a<=29)ageBuckets['18–29']++;else ageBuckets['30+']++});const monthMap={};attendance.forEach(s=>{const k=s.date?.slice(0,7);if(!k)return;const x=monthMap[k]||(monthMap[k]={p:0,t:0});(s.records||[]).forEach(r=>{x.t++;if(r.status==='present')x.p++})});const monthlyAttendance=Object.entries(monthMap).sort(([a],[b])=>a.localeCompare(b)).slice(-6).map(([month,x])=>({month,value:x.t?Math.round(x.p/x.t*1000)/10:0}));const frequencyByUnit=groups.map(g=>g.unit).filter((v,i,a)=>a.indexOf(v)===i).map(unit=>{const gids=new Set(groups.filter(g=>g.unit===unit).map(g=>g.id)),rs=attendance.filter(s=>gids.has(s.groupId)).flatMap(s=>s.records||[]),p=rs.filter(r=>r.status==='present').length;return{unit,frequency:rs.length?Math.round(p/rs.length*1000)/10:0,users:new Set(rs.map(r=>r.participantId)).size}});return{participantsActive:participants.length,groupsActive:groups.length,familiesActive:store().collection('families').filter(f=>f.status==='ativo').length,averageAttendance,attendanceSessions:attendance.length,workshopsTotal:workshops.length,workshopsCompleted:workshops.filter(w=>w.status==='concluida').length,openReferrals,overdueReferrals,alertsActive:overdueReferrals+quality.duplicates+lowAttendanceSessions,lowAttendanceSessions,quality,categoryCounts,ageBuckets,monthlyAttendance,frequencyByUnit}}

  bootstrapDemo();
  window.SintropiaEntities=Object.freeze({normalizeText:norm,onlyDigits:digits,bootstrapDemo,duplicateCandidates,validateParticipant,createParticipant,updateParticipant,deactivateParticipant,createFamily,updateFamily,createGroup,updateGroup,assignParticipantToGroup,unassignParticipantFromGroup,participantGroup,groupMembers,familyMembers,createWorkshop,updateWorkshop,completeWorkshop,createReferral,updateReferral,referralOverdue,qualitySummary,metrics,ageOn,listParticipants:()=>store().collection('participants'),listFamilies:()=>store().collection('families'),listGroups:()=>store().collection('groups'),listMemberships:()=>store().collection('memberships'),listWorkshops:()=>store().collection('workshops'),listReferrals:()=>store().collection('referrals')});
})();
