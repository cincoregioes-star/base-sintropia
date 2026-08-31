(() => {
  'use strict';

  const store = () => window.SintropiaStore;
  const now = () => new Date().toISOString();
  const session = () => window.SintropiaAuth?.ensureSession?.();

  const DEMO = Object.freeze({
    families: [
      { id:'FAM-DEMO-001', publicCode:'FAM-0001', referenceName:'Mariana Souza', community:'Centro', phone:'(85) 99999-1001', status:'ativo', createdAt:'2026-08-01T12:00:00Z', version:1 },
      { id:'FAM-DEMO-002', publicCode:'FAM-0002', referenceName:'Roberto Lima', community:'Vila Esperança', phone:'(85) 99999-1002', status:'ativo', createdAt:'2026-08-02T12:00:00Z', version:1 },
      { id:'FAM-DEMO-003', publicCode:'FAM-0003', referenceName:'Patrícia Alves', community:'Jardim das Flores', phone:'(85) 99999-1003', status:'ativo', createdAt:'2026-08-03T12:00:00Z', version:1 }
    ],
    groups: [
      { id:'GRP-DEMO-CRI-A', publicCode:'GRP-0001', name:'Crianças 6–9 • A', unit:'CRAS Centro', shift:'manhã', ageMin:6, ageMax:9, capacity:30, status:'ativo', createdAt:'2026-08-01T12:00:00Z', version:1 },
      { id:'GRP-DEMO-ADO-A', publicCode:'GRP-0002', name:'Adolescentes 12–14 • A', unit:'CRAS Centro', shift:'tarde', ageMin:12, ageMax:14, capacity:30, status:'ativo', createdAt:'2026-08-01T12:00:00Z', version:1 },
      { id:'GRP-DEMO-JUV-B', publicCode:'GRP-0003', name:'Juventude 15–17 • B', unit:'CRAS Litoral', shift:'tarde', ageMin:15, ageMax:17, capacity:25, status:'ativo', createdAt:'2026-08-01T12:00:00Z', version:1 }
    ],
    participants: [
      { id:'USR-DEMO-1', publicCode:'USR-000184', fullName:'Ana Clara Souza', socialName:'', birthDate:'2010-03-18', cpf:'', nis:'', phone:'(85) 99999-2001', guardianName:'Mariana Souza', familyId:'FAM-DEMO-001', community:'Centro', status:'ativo', createdAt:'2026-08-01T12:00:00Z', version:1 },
      { id:'USR-DEMO-2', publicCode:'USR-000207', fullName:'Bruno Henrique Lima', socialName:'', birthDate:'2009-08-09', cpf:'', nis:'', phone:'(85) 99999-2002', guardianName:'Roberto Lima', familyId:'FAM-DEMO-002', community:'Vila Esperança', status:'ativo', createdAt:'2026-08-01T12:00:00Z', version:1 },
      { id:'USR-DEMO-3', publicCode:'USR-000231', fullName:'Carla Mendes Alves', socialName:'', birthDate:'2017-01-24', cpf:'', nis:'', phone:'(85) 99999-2003', guardianName:'Patrícia Alves', familyId:'FAM-DEMO-003', community:'Jardim das Flores', status:'ativo', createdAt:'2026-08-01T12:00:00Z', version:1 },
      { id:'USR-DEMO-4', publicCode:'USR-000264', fullName:'Daniel Rocha Santos', socialName:'', birthDate:'2009-11-02', cpf:'', nis:'', phone:'', guardianName:'', familyId:null, community:'Nova Sintropia', status:'atencao', createdAt:'2026-08-01T12:00:00Z', version:1 },
      { id:'USR-DEMO-5', publicCode:'USR-000271', fullName:'Eduardo Alves', socialName:'', birthDate:'2008-06-30', cpf:'', nis:'', phone:'', guardianName:'', familyId:null, community:'Morro Branco', status:'ativo', createdAt:'2026-08-01T12:00:00Z', version:1 }
    ],
    memberships: [
      { id:'MEM-DEMO-1', participantId:'USR-DEMO-1', groupId:'GRP-DEMO-JUV-B', joinedAt:'2026-08-01', leftAt:null, status:'ativo' },
      { id:'MEM-DEMO-2', participantId:'USR-DEMO-2', groupId:'GRP-DEMO-JUV-B', joinedAt:'2026-08-01', leftAt:null, status:'ativo' },
      { id:'MEM-DEMO-3', participantId:'USR-DEMO-3', groupId:'GRP-DEMO-CRI-A', joinedAt:'2026-08-01', leftAt:null, status:'ativo' },
      { id:'MEM-DEMO-4', participantId:'USR-DEMO-4', groupId:'GRP-DEMO-JUV-B', joinedAt:'2026-08-01', leftAt:null, status:'ativo' },
      { id:'MEM-DEMO-5', participantId:'USR-DEMO-5', groupId:'GRP-DEMO-JUV-B', joinedAt:'2026-08-01', leftAt:null, status:'ativo' }
    ]
  });

  function normalizeText(value) { return String(value || '').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' '); }
  function onlyDigits(value) { return String(value || '').replace(/\D/g, ''); }

  function bootstrapDemo() {
    for (const name of ['families','groups','participants','memberships']) if (!store().collection(name).length) store().replaceCollection(name, DEMO[name]);
  }

  function publicCode(prefix, collectionName) {
    const rows = store().collection(collectionName);
    const max = rows.reduce((acc,row) => Math.max(acc, Number(String(row.publicCode || '').match(/(\d+)$/)?.[1] || 0)), 0);
    return `${prefix}-${String(max + 1).padStart(6,'0')}`;
  }

  function duplicateCandidates(input, ignoreId=null) {
    const name = normalizeText(input.fullName), birthDate = input.birthDate || '', cpf = onlyDigits(input.cpf), nis = onlyDigits(input.nis);
    return store().collection('participants').filter(p => p.id !== ignoreId).map(p => {
      let score=0; const reasons=[];
      if (cpf && onlyDigits(p.cpf) === cpf) { score=100; reasons.push('CPF idêntico'); }
      if (nis && onlyDigits(p.nis) === nis) { score=Math.max(score,100); reasons.push('NIS idêntico'); }
      if (name && normalizeText(p.fullName) === name) { score += 65; reasons.push('nome idêntico'); }
      if (birthDate && p.birthDate === birthDate) { score += 30; reasons.push('nascimento idêntico'); }
      if (name && normalizeText(p.fullName).split(' ')[0] === name.split(' ')[0] && birthDate && p.birthDate === birthDate) score += 5;
      return { participant:p, score:Math.min(100,score), reasons };
    }).filter(x => x.score >= 65).sort((a,b) => b.score-a.score);
  }

  function validateParticipant(input, ignoreId=null) {
    const errors=[];
    if (!String(input.fullName || '').trim()) errors.push('Nome completo é obrigatório.');
    if (input.birthDate && Date.parse(input.birthDate) > Date.now()) errors.push('Data de nascimento não pode estar no futuro.');
    const cpf=onlyDigits(input.cpf); if (cpf && cpf.length !== 11) errors.push('CPF deve ter 11 dígitos.');
    const nis=onlyDigits(input.nis); if (nis && nis.length !== 11) errors.push('NIS deve ter 11 dígitos.');
    return { ok:errors.length===0, errors, duplicates:duplicateCandidates(input,ignoreId) };
  }

  function createParticipant(input,{forceDuplicate=false}={}) {
    if (!window.SintropiaAuth?.can?.('participant.create')) throw new Error('Seu perfil não possui permissão para criar usuários.');
    const check=validateParticipant(input); if (!check.ok) throw Object.assign(new Error(check.errors.join(' ')),{validation:check});
    if (!forceDuplicate && check.duplicates.some(x=>x.score>=90)) throw Object.assign(new Error('Possível cadastro duplicado detectado.'),{code:'DUPLICATE',validation:check});
    const actor=session()?.user?.id || 'demo';
    const entity={ id:store().newId('USR'), publicCode:publicCode('USR','participants'), fullName:String(input.fullName).trim(), socialName:String(input.socialName||'').trim(), birthDate:input.birthDate||'', cpf:onlyDigits(input.cpf), nis:onlyDigits(input.nis), phone:String(input.phone||'').trim(), guardianName:String(input.guardianName||'').trim(), familyId:input.familyId||null, community:String(input.community||'').trim(), status:input.status||'ativo', createdAt:now(), createdBy:actor, updatedAt:now(), updatedBy:actor, version:1 };
    return store().writeEntity('participants',entity,{action:'participant.create',entityType:'participant'});
  }

  function updateParticipant(id,input,{forceDuplicate=false}={}) {
    const before=store().getById('participants',id); if (!before) throw new Error('Usuário não encontrado.');
    const check=validateParticipant(input,id); if (!check.ok) throw Object.assign(new Error(check.errors.join(' ')),{validation:check});
    if (!forceDuplicate && check.duplicates.some(x=>x.score>=90)) throw Object.assign(new Error('Possível cadastro duplicado detectado.'),{code:'DUPLICATE',validation:check});
    const actor=session()?.user?.id || 'demo';
    const entity={...before,...input,cpf:onlyDigits(input.cpf),nis:onlyDigits(input.nis),updatedAt:now(),updatedBy:actor,version:(before.version||1)+1};
    return store().writeEntity('participants',entity,{action:'participant.update',entityType:'participant',before});
  }

  function deactivateParticipant(id) { const before=store().getById('participants',id); if (!before) throw new Error('Usuário não encontrado.'); return updateParticipant(id,{...before,status:'inativo'},{forceDuplicate:true}); }

  function createFamily(input) {
    if (!String(input.referenceName || '').trim()) throw new Error('Pessoa de referência é obrigatória.');
    const actor=session()?.user?.id || 'demo';
    const entity={id:store().newId('FAM'),publicCode:publicCode('FAM','families'),referenceName:String(input.referenceName).trim(),community:String(input.community||'').trim(),phone:String(input.phone||'').trim(),status:'ativo',createdAt:now(),createdBy:actor,updatedAt:now(),updatedBy:actor,version:1};
    return store().writeEntity('families',entity,{action:'family.create',entityType:'family'});
  }

  function createGroup(input) {
    const role=session()?.user?.role; if (!['coordenador','administrador'].includes(role)) throw new Error('Seu perfil não possui permissão para criar grupos.');
    if (!String(input.name || '').trim()) throw new Error('Nome do grupo é obrigatório.');
    const ageMin=input.ageMin===''||input.ageMin==null?null:Number(input.ageMin), ageMax=input.ageMax===''||input.ageMax==null?null:Number(input.ageMax);
    if (ageMin!=null && ageMax!=null && ageMax<ageMin) throw new Error('Faixa etária inválida.');
    const actor=session()?.user?.id || 'demo';
    const entity={id:store().newId('GRP'),publicCode:publicCode('GRP','groups'),name:String(input.name).trim(),unit:String(input.unit||'CRAS Centro').trim(),shift:String(input.shift||'manhã'),ageMin,ageMax,capacity:Number(input.capacity||30),status:'ativo',createdAt:now(),createdBy:actor,updatedAt:now(),updatedBy:actor,version:1};
    return store().writeEntity('groups',entity,{action:'group.create',entityType:'group'});
  }

  function assignParticipantToGroup(participantId,groupId) {
    if (!participantId || !groupId) return null;
    const memberships=store().collection('memberships'), current=memberships.find(m=>m.participantId===participantId && m.leftAt==null && m.status==='ativo');
    if (current?.groupId===groupId) return current;
    const today=new Date().toISOString().slice(0,10); if (current) { current.leftAt=today; current.status='inativo'; }
    const membership={id:store().newId('MEM'),participantId,groupId,joinedAt:today,leftAt:null,status:'ativo',createdAt:now()}; memberships.push(membership); store().replaceCollection('memberships',memberships);
    window.SintropiaAudit?.log?.({action:'membership.assign',entityType:'group_member',entityId:membership.id,before:current||null,after:membership}); return membership;
  }

  function participantGroup(participantId) { const m=store().collection('memberships').find(row=>row.participantId===participantId&&row.leftAt==null&&row.status==='ativo'); return m?store().getById('groups',m.groupId):null; }
  function groupMembers(groupId) { const ids=new Set(store().collection('memberships').filter(m=>m.groupId===groupId&&m.leftAt==null&&m.status==='ativo').map(m=>m.participantId)); return store().collection('participants').filter(p=>ids.has(p.id)&&p.status!=='inativo'); }
  function familyMembers(familyId) { return store().collection('participants').filter(p=>p.familyId===familyId&&p.status!=='inativo'); }

  function qualitySummary() {
    const participants=store().collection('participants'), active=participants.filter(p=>p.status!=='inativo'), duplicates=[], seen=new Set();
    active.forEach(p=>{const key=`${normalizeText(p.fullName)}|${p.birthDate||''}`;if(seen.has(key))duplicates.push(p.id);else seen.add(key);});
    const missingTerritory=active.filter(p=>!p.community).length, missingPhone=active.filter(p=>!p.phone).length, fields=['fullName','birthDate','community'], possible=Math.max(1,active.length*fields.length), filled=active.reduce((sum,p)=>sum+fields.filter(f=>Boolean(p[f])).length,0);
    return {active:active.length,duplicates:duplicates.length,missingTerritory,missingPhone,completeness:Math.round(filled/possible*100)};
  }

  bootstrapDemo();
  window.SintropiaEntities=Object.freeze({normalizeText,onlyDigits,bootstrapDemo,duplicateCandidates,validateParticipant,createParticipant,updateParticipant,deactivateParticipant,createFamily,createGroup,assignParticipantToGroup,participantGroup,groupMembers,familyMembers,qualitySummary,listParticipants:()=>store().collection('participants'),listFamilies:()=>store().collection('families'),listGroups:()=>store().collection('groups'),listMemberships:()=>store().collection('memberships')});
})();
