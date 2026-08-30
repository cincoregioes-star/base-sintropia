const STORAGE_KEY = "baseSintropiaV1";

const initialData = {
  users: [],
  groups: [],
  agenda: [],
  notes: [],
  tasks: [],
  meetings: [],
  attendance: [],
  bonds: []
};

let data = loadData();
let calendarCursor = new Date();
calendarCursor.setDate(1);
let selectedCalendarDate = todayISO();

const workshops = [
  {name:"Eu Faço Parte", axis:"Pertencimento", duration:"50 min", audience:"Crianças e adolescentes", accent:"#4dff7a", desc:"Identidade, integração e reconhecimento do lugar de cada participante no grupo."},
  {name:"Minha Voz no Grupo", axis:"Participação", duration:"50 min", audience:"Adolescentes", accent:"#ffe45a", desc:"Expressão de opiniões, escolhas, escuta e participação cidadã."},
  {name:"Construir Juntos", axis:"Cooperação", duration:"45 min", audience:"Todos", accent:"#ff9e46", desc:"Desafio coletivo que exige comunicação, divisão de responsabilidades e cooperação."},
  {name:"Diferenças que nos Unem", axis:"Convivência", duration:"60 min", audience:"Todos", accent:"#ff5b6e", desc:"Respeito, diversidade, empatia e resolução construtiva de conflitos."},
  {name:"Meu Território", axis:"Território", duration:"60 min", audience:"Todos", accent:"#48e8ff", desc:"Mapeamento de equipamentos públicos, potencialidades, problemas e pertencimento comunitário."},
  {name:"Memórias que Conectam", axis:"Pertencimento", duration:"60 min", audience:"Idosos / intergeracional", accent:"#5f83ff", desc:"Memória, identidade e troca entre gerações por histórias, imagens e registros."},
  {name:"Cidadania Digital", axis:"Autonomia", duration:"60 min", audience:"Jovens, adultos e idosos", accent:"#a966ff", desc:"Acesso a serviços digitais, segurança, informação e autonomia no ambiente digital."},
  {name:"Cultivando Vínculos", axis:"Convivência", duration:"60+ min", audience:"Intergeracional", accent:"#ff5fd1", desc:"Cultivo coletivo como instrumento socioeducativo de cooperação, responsabilidade e pertencimento."}
];

const workshopDetails = {
  "Eu Faço Parte": {materials:["Papel A4","Canetas coloridas","Cartolina"],steps:["Acolhida e apresentação da proposta.","Cada participante registra algo que representa sua identidade.","Compartilhamento voluntário em pequenos grupos.","Construção de um painel coletivo do grupo.","Fechamento com reflexão sobre pertencimento e respeito."],observe:["Participação espontânea","Interação com colegas","Reconhecimento das diferenças","Sentimento de pertencimento"],access:["Oferecer descrição oral dos materiais visuais.","Permitir respostas orais ou por apoio de outro recurso comunicacional.","Garantir circulação e posição acessível na atividade."]},
  "Minha Voz no Grupo": {materials:["Cartões de perguntas","Papel","Canetas"],steps:["Apresentar uma situação cotidiana do grupo.","Cada participante escolhe uma posição ou opinião.","Organizar falas com tempo de escuta.","Registrar propostas do próprio grupo.","Definir uma pequena decisão coletiva."],observe:["Capacidade de expressão","Escuta","Participação nas decisões","Respeito à opinião do outro"],access:["Ler os cartões em voz alta quando necessário.","Permitir comunicação por imagens, escrita ou apoio.","Evitar obrigatoriedade de exposição individual."]},
  "Construir Juntos": {materials:["Papelão ou cartolina","Fita adesiva","Canudos ou palitos","Tesoura sem ponta"],steps:["Dividir o grupo em equipes.","Apresentar um desafio que não possa ser concluído individualmente.","Distribuir funções dentro da equipe.","Construir a solução coletivamente.","Conversar sobre como cada pessoa contribuiu."],observe:["Cooperação","Divisão de responsabilidades","Comunicação","Resolução de divergências"],access:["Distribuir tarefas compatíveis com diferentes habilidades.","Garantir mesa ou superfície acessível.","Usar materiais maiores quando necessário."]},
  "Diferenças que nos Unem": {materials:["Cartões com situações","Papel","Canetas"],steps:["Apresentar situações de convivência e diversidade.","Discutir diferentes formas de reagir.","Identificar atitudes que aproximam ou afastam pessoas.","Criar combinados de convivência.","Registrar os combinados do grupo."],observe:["Empatia","Respeito","Capacidade de negociação","Manejo de conflitos"],access:["Usar linguagem simples e concreta.","Disponibilizar recursos visuais.","Permitir participação por diferentes formas de comunicação."]},
  "Meu Território": {materials:["Mapa simples do território ou papel grande","Canetas","Adesivos coloridos"],steps:["Listar lugares importantes da comunidade.","Marcar equipamentos, oportunidades e dificuldades.","Identificar pessoas e redes de apoio conhecidas.","Escolher um ponto que o grupo gostaria de melhorar.","Registrar uma proposta possível de participação comunitária."],observe:["Conhecimento do território","Participação cidadã","Pertencimento comunitário","Proposição de soluções"],access:["Utilizar mapa tátil ou descrição oral quando necessário.","Permitir marcações com símbolos grandes.","Adaptar deslocamentos se houver atividade externa."]},
  "Memórias que Conectam": {materials:["Fotografias opcionais","Celular ou gravador","Papel","Canetas"],steps:["Escolher um tema de memória do território.","Idosos ou participantes compartilham histórias voluntariamente.","Jovens ou colegas ajudam a registrar relatos.","Produzir mural, áudio ou pequeno álbum coletivo.","Conversar sobre mudanças e permanências na comunidade."],observe:["Escuta intergeracional","Valorização da história","Participação","Troca de experiências"],access:["Ampliar fontes e imagens.","Usar áudio para participantes com dificuldade de leitura.","Respeitar ritmo de fala e memória de cada participante."]},
  "Cidadania Digital": {materials:["Celular ou computador quando disponível","Projetor opcional","Folha de apoio"],steps:["Levantar dificuldades digitais do grupo.","Demonstrar um serviço público digital ou prática segura.","Realizar atividade acompanhada em dupla.","Trabalhar golpes, senhas e desinformação.","Finalizar com checklist de segurança e autonomia."],observe:["Autonomia","Cooperação","Solicitação de ajuda","Uso crítico da informação"],access:["Aumentar fonte e contraste.","Usar leitor de tela quando disponível.","Realizar demonstração passo a passo e sem pressa."]},
  "Cultivando Vínculos": {materials:["Vasos ou canteiro acessível","Terra/substrato","Mudas ou sementes","Regador","Etiquetas"],steps:["Definir coletivamente o que será cultivado.","Distribuir funções entre participantes.","Realizar plantio ou manutenção do espaço.","Criar escala coletiva de cuidado.","Registrar evolução e conversar sobre cooperação e responsabilidade."],observe:["Cooperação","Responsabilidade compartilhada","Interação intergeracional","Pertencimento"],access:["Usar canteiros suspensos ou vasos em altura acessível.","Disponibilizar ferramentas adaptadas quando possível.","Criar funções diversas para garantir participação de todos."]}
};

const recommendationMap = {
  "Participação":["Minha Voz no Grupo","Eu Faço Parte"],
  "Convivência":["Construir Juntos","Diferenças que nos Unem","Cultivando Vínculos"],
  "Pertencimento":["Eu Faço Parte","Memórias que Conectam","Cultivando Vínculos"],
  "Autonomia":["Cidadania Digital","Minha Voz no Grupo"],
  "Protagonismo":["Minha Voz no Grupo","Meu Território"],
  "Território e redes":["Meu Território","Memórias que Conectam","Cultivando Vínculos"]
};

function loadData(){
  try{
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? {...initialData, ...JSON.parse(saved)} : structuredClone(initialData);
  }catch(e){
    return structuredClone(initialData);
  }
}

function saveData(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  refreshAll();
}

function escapeHTML(str=""){
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function uid(prefix){
  return prefix + "-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,5).toUpperCase();
}

function formatDate(date){
  if(!date) return "—";
  const d = new Date(date + "T12:00:00");
  return d.toLocaleDateString("pt-BR");
}

function todayISO(){
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset()*60000);
  return local.toISOString().split("T")[0];
}

function toast(message){
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"), 2200);
}

function showView(view){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(v=>v.classList.remove("active"));
  const target = document.getElementById("view-"+view);
  if(target) target.classList.add("active");
  const nav = document.querySelector(`.nav-item[data-view="${view}"]`);
  if(nav) nav.classList.add("active");
  document.getElementById("sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
}

document.querySelectorAll(".nav-item").forEach(btn=>{
  btn.addEventListener("click",()=>showView(btn.dataset.view));
});
document.querySelectorAll("[data-view-link]").forEach(btn=>{
  btn.addEventListener("click",()=>showView(btn.dataset.viewLink));
});
document.getElementById("menuToggle").addEventListener("click",()=>document.getElementById("sidebar").classList.toggle("open"));

function updateClock(){
  const now = new Date();
  document.getElementById("clock").textContent = now.toLocaleTimeString("pt-BR");
  document.getElementById("dateText").textContent = now.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});
  const h = now.getHours();
  document.getElementById("welcomeText").textContent = (h<12?"Bom dia":h<18?"Boa tarde":"Boa noite") + ", Orientador";
}
setInterval(updateClock,1000);
updateClock();

function setDefaultDates(){
  ["meetingDate","attendanceDate","bondDate","agendaDate","taskDate"].forEach(id=>{
    const el=document.getElementById(id); if(el && !el.value) el.value=todayISO();
  });
}

function refreshSelects(){
  const groupOptions = ['<option value="">Sem grupo</option>'].concat(data.groups.map(g=>`<option value="${g.id}">${escapeHTML(g.name)}</option>`)).join("");
  document.getElementById("userGroup").innerHTML = groupOptions;
  document.getElementById("meetingGroup").innerHTML = data.groups.length ? data.groups.map(g=>`<option value="${g.id}">${escapeHTML(g.name)}</option>`).join("") : '<option value="">Cadastre um grupo primeiro</option>';

  const userOptions = data.users.length ? data.users.map(u=>`<option value="${u.id}">${escapeHTML(u.name)}</option>`).join("") : '<option value="">Cadastre um usuário primeiro</option>';
  ["attendanceUser","bondUser"].forEach(id=>document.getElementById(id).innerHTML=userOptions);
}

function groupName(id){
  return data.groups.find(g=>g.id===id)?.name || "Sem grupo";
}
function userName(id){
  return data.users.find(u=>u.id===id)?.name || "Usuário não encontrado";
}

function renderUsers(){
  const list=document.getElementById("usersList");
  const q=document.getElementById("userSearch").value.trim().toLowerCase();
  const arr=data.users.filter(u=>u.name.toLowerCase().includes(q));
  if(!arr.length){list.className="list empty-state";list.innerHTML="Nenhum usuário encontrado.";return;}
  list.className="list";
  list.innerHTML=arr.map(u=>`
    <div class="list-item">
      <div>
        <strong>${escapeHTML(u.name)}</strong>
        <small>${escapeHTML(u.code)} · ${escapeHTML(groupName(u.group))}<br>${escapeHTML(u.status)} · ${escapeHTML(u.accessibility)}</small>
      </div>
      <div class="item-actions">
        <button class="mini-btn primary-lite" onclick="openUserProfile('${u.id}')"><i class="bi bi-person-vcard-fill"></i> Ver ficha</button>
        <button class="mini-btn danger" onclick="removeItem('users','${u.id}')"><i class="bi bi-trash3"></i> Excluir</button>
      </div>
    </div>`).join("");
}

function renderGroups(){
  const list=document.getElementById("groupsList");
  if(!data.groups.length){list.className="list empty-state";list.innerHTML="Nenhum grupo cadastrado.";return;}
  list.className="list";
  list.innerHTML=data.groups.map(g=>`
    <div class="list-item">
      <div><strong>${escapeHTML(g.name)}</strong><small>${escapeHTML(g.age||"Faixa etária não informada")}<br>${escapeHTML(g.day)} ${g.time?("· "+g.time):""}</small></div>
      <button class="mini-btn danger" onclick="removeItem('groups','${g.id}')"><i class="bi bi-trash3"></i> Excluir</button>
    </div>`).join("");
}

function renderAgenda(){
  const sorted=[...data.agenda].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  const list=document.getElementById("agendaList");
  if(!sorted.length){list.className="list empty-state";list.innerHTML="Nenhum compromisso agendado.";}
  else{
    list.className="list";
    list.innerHTML=sorted.map(a=>`
      <div class="list-item">
        <div><strong>${escapeHTML(a.title)}</strong><small>${formatDate(a.date)} ${a.time?("· "+a.time):""} · ${escapeHTML(a.type)}<br>${escapeHTML(a.description||"")}</small></div>
        <button class="mini-btn danger" onclick="removeItem('agenda','${a.id}')"><i class="bi bi-trash3"></i> Excluir</button>
      </div>`).join("");
  }
  renderCalendar();
}

function renderNotes(){
  const sorted=[...data.notes].sort((a,b)=>b.created.localeCompare(a.created));
  const list=document.getElementById("notesList");
  if(!sorted.length){list.className="list empty-state";list.innerHTML="Nenhuma nota salva.";}
  else{
    list.className="list";
    list.innerHTML=sorted.map(n=>`
      <div class="list-item">
        <div><strong>${escapeHTML(n.title||"Nota")}</strong><small>${new Date(n.created).toLocaleString("pt-BR")} · ${escapeHTML(n.type)}</small><p>${escapeHTML(n.text)}</p></div>
        <button class="mini-btn danger" onclick="removeItem('notes','${n.id}')"><i class="bi bi-trash3"></i> Excluir</button>
      </div>`).join("");
  }
}

function renderTasks(){
  const sorted=[...data.tasks].sort((a,b)=>(a.done-b.done)||String(a.date).localeCompare(String(b.date)));
  const list=document.getElementById("tasksList");
  if(!sorted.length){list.className="list empty-state";list.innerHTML="Nenhuma tarefa cadastrada.";}
  else{
    list.className="list";
    list.innerHTML=sorted.map(t=>`
      <div class="list-item">
        <div>
          <strong style="${t.done?'text-decoration:line-through;opacity:.6':''}">${escapeHTML(t.title)}</strong>
          <small>${t.date?formatDate(t.date):"Sem prazo"} · ${escapeHTML(t.priority)} · ${t.done?"Concluída":"Pendente"}</small>
        </div>
        <div class="item-actions">
          <button class="mini-btn" onclick="toggleTask('${t.id}')"><i class="bi ${t.done?"bi-arrow-counterclockwise":"bi-check2-circle"}"></i> ${t.done?"Reabrir":"Concluir"}</button>
          <button class="mini-btn danger" onclick="removeItem('tasks','${t.id}')"><i class="bi bi-trash3"></i> Excluir</button>
        </div>
      </div>`).join("");
  }
}

function renderMeetings(){
  const list=document.getElementById("meetingsList");
  const sorted=[...data.meetings].sort((a,b)=>b.date.localeCompare(a.date));
  if(!sorted.length){list.className="list empty-state";list.innerHTML="Nenhum encontro registrado.";return;}
  list.className="list";
  list.innerHTML=sorted.map(m=>`
    <div class="list-item">
      <div><strong>${escapeHTML(m.theme)}</strong><small>${formatDate(m.date)} ${m.time?("· "+m.time):""} · ${escapeHTML(groupName(m.group))}<br>${escapeHTML(m.goal||"")}</small><p>${escapeHTML(m.report||"")}</p></div>
      <button class="mini-btn danger" onclick="removeItem('meetings','${m.id}')"><i class="bi bi-trash3"></i> Excluir</button>
    </div>`).join("");
}

function renderAttendance(){
  const list=document.getElementById("attendanceList");
  const sorted=[...data.attendance].sort((a,b)=>b.date.localeCompare(a.date));
  if(!sorted.length){list.className="list empty-state";list.innerHTML="Nenhum registro de frequência.";return;}
  list.className="list";
  list.innerHTML=sorted.map(a=>`
    <div class="list-item"><div><strong>${escapeHTML(userName(a.user))}</strong><small>${formatDate(a.date)} · ${escapeHTML(a.status)}</small></div>
    <button class="mini-btn danger" onclick="removeItem('attendance','${a.id}')"><i class="bi bi-trash3"></i> Excluir</button></div>`).join("");
}

function renderBonds(){
  const list=document.getElementById("bondsList");
  const sorted=[...data.bonds].sort((a,b)=>b.date.localeCompare(a.date));
  if(!sorted.length){list.className="list empty-state";list.innerHTML="Nenhuma observação registrada.";return;}
  list.className="list";
  list.innerHTML=sorted.map(b=>`
    <div class="list-item">
      <div><strong>${escapeHTML(userName(b.user))} · ${escapeHTML(b.dimension)}</strong>
      <small>${formatDate(b.date)} · ${escapeHTML(b.type)}</small><p>${escapeHTML(b.text)}</p></div>
      <button class="mini-btn danger" onclick="removeItem('bonds','${b.id}')"><i class="bi bi-trash3"></i> Excluir</button>
    </div>`).join("");
}

function calculateAge(birth){
  if(!birth) return "—";
  const b=new Date(birth+"T12:00:00"), now=new Date();
  let age=now.getFullYear()-b.getFullYear();
  const md=now.getMonth()-b.getMonth();
  if(md<0 || (md===0 && now.getDate()<b.getDate())) age--;
  return Math.max(age,0)+" anos";
}

function latestBondByDimension(userId, dimension){
  return [...data.bonds].filter(b=>b.user===userId && b.dimension===dimension).sort((a,b)=>b.date.localeCompare(a.date))[0] || null;
}

function bondClass(type){
  if(!type) return "none";
  if(type.includes("Potencialidade")) return "positive";
  if(type.includes("atenção")) return "attention";
  if(type.includes("recorrente")) return "recurring";
  if(type.includes("equipe")) return "team";
  return "none";
}

function openUserProfile(id){
  const u=data.users.find(x=>x.id===id);
  if(!u) return;
  const att=[...data.attendance].filter(a=>a.user===id);
  const present=att.filter(a=>a.status==="Presente" || a.status==="Participação parcial").length;
  const attendancePct=att.length?Math.round((present/att.length)*100):0;
  const bonds=[...data.bonds].filter(b=>b.user===id).sort((a,b)=>b.date.localeCompare(a.date));
  const groupMeetings=data.meetings.filter(m=>m.group===u.group).sort((a,b)=>b.date.localeCompare(a.date));
  const lastMeeting=groupMeetings[0];
  const dimensions=["Participação","Convivência","Pertencimento","Autonomia","Protagonismo","Território e redes"];
  const map=dimensions.map(dim=>{
    const b=latestBondByDimension(id,dim);
    return `<div class="bond-node ${bondClass(b?.type)}"><span>${escapeHTML(dim)}</span><strong>${b?escapeHTML(b.type):"Sem registro"}</strong>${b?`<small>${formatDate(b.date)}</small>`:""}</div>`;
  }).join("");
  const history=bonds.length?bonds.slice(0,10).map(b=>`<div class="history-entry"><strong>${escapeHTML(b.dimension)} · ${escapeHTML(b.type)}</strong><small>${formatDate(b.date)} — ${escapeHTML(b.text)}</small></div>`).join(""):'<div class="empty-state">Nenhuma observação registrada.</div>';
  const initials=u.name.split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase();
  document.getElementById("userProfileContent").innerHTML=`
    <div class="profile-head">
      <div class="profile-avatar">${escapeHTML(initials)}</div>
      <div><h2>${escapeHTML(u.socialName||u.name)}</h2><p>${escapeHTML(u.code)} · ${escapeHTML(groupName(u.group))}</p></div>
      <div class="profile-status"><span class="badge">${escapeHTML(u.status)}</span><span class="badge"><i class="bi bi-universal-access"></i>&nbsp;${escapeHTML(u.accessibility)}</span></div>
    </div>
    <div class="profile-stats">
      <div class="profile-stat"><strong>${attendancePct}%</strong><span>frequência registrada</span></div>
      <div class="profile-stat"><strong>${att.length}</strong><span>registros de presença</span></div>
      <div class="profile-stat"><strong>${bonds.length}</strong><span>observações</span></div>
      <div class="profile-stat"><strong>${groupMeetings.length}</strong><span>encontros do grupo</span></div>
    </div>
    <div class="profile-grid">
      <section class="profile-block">
        <h3><i class="bi bi-person-vcard-fill"></i> Identificação</h3>
        <div class="detail-grid">
          <div class="detail-item"><span>Nome completo</span><strong>${escapeHTML(u.name)}</strong></div>
          <div class="detail-item"><span>Nome social</span><strong>${escapeHTML(u.socialName||"—")}</strong></div>
          <div class="detail-item"><span>Nascimento</span><strong>${u.birth?formatDate(u.birth):"—"}</strong></div>
          <div class="detail-item"><span>Idade</span><strong>${calculateAge(u.birth)}</strong></div>
          <div class="detail-item"><span>Telefone</span><strong>${escapeHTML(u.phone||"—")}</strong></div>
          <div class="detail-item"><span>Responsável</span><strong>${escapeHTML(u.guardian||"—")}</strong></div>
          <div class="detail-item"><span>Grupo</span><strong>${escapeHTML(groupName(u.group))}</strong></div>
          <div class="detail-item"><span>Último encontro do grupo</span><strong>${lastMeeting?formatDate(lastMeeting.date):"—"}</strong></div>
        </div>
      </section>
      <section class="profile-block">
        <h3><i class="bi bi-stars"></i> Mapa de observações dos vínculos</h3>
        <p style="font-size:11px;margin-top:-5px">Mostra o registro qualitativo mais recente em cada dimensão. Não é pontuação nem diagnóstico.</p>
        <div class="bond-map">${map}</div>
      </section>
      <section class="profile-block full">
        <h3><i class="bi bi-clock-history"></i> Histórico recente</h3>
        <div class="profile-history">${history}</div>
      </section>
    </div>
    <div class="profile-actions">
      <button class="primary-btn" onclick="closeUserProfile();showView('vinculos');document.getElementById('bondUser').value='${id}'"><i class="bi bi-stars"></i> Nova observação</button>
      <button class="ghost-btn" onclick="closeUserProfile();showView('frequencia');document.getElementById('attendanceUser').value='${id}'"><i class="bi bi-check2-square"></i> Registrar frequência</button>
    </div>`;
  document.getElementById("userModal").classList.remove("hidden");
}
function closeUserProfile(){document.getElementById("userModal").classList.add("hidden")}
window.openUserProfile=openUserProfile; window.closeUserProfile=closeUserProfile;

function selectCalendarDate(iso){
  selectedCalendarDate=iso;
  const input=document.getElementById("agendaDate");
  if(input) input.value=iso;
  renderCalendar();
  const events=data.agenda.filter(a=>a.date===iso);
  toast(events.length?`${events.length} compromisso(s) nesta data.`:`Data ${formatDate(iso)} selecionada.`);
}
window.selectCalendarDate=selectCalendarDate;

function renderWorkshops(){
  document.getElementById("workshopGrid").innerHTML=workshops.map(w=>`
    <article class="workshop" style="--accent:${w.accent}">
      <span class="badge">${escapeHTML(w.axis)}</span>
      <h3><i class="bi bi-flower2"></i> ${escapeHTML(w.name)}</h3>
      <p>${escapeHTML(w.desc)}</p>
      <div class="meta"><span class="badge"><i class="bi bi-clock-fill"></i>&nbsp;${escapeHTML(w.duration)}</span><span class="badge"><i class="bi bi-people-fill"></i>&nbsp;${escapeHTML(w.audience)}</span></div>
      <div class="workshop-actions"><button class="ghost-btn" onclick="openWorkshop('${w.name.replace(/'/g,"\'")}')"><i class="bi bi-eye-fill"></i> Ver oficina</button></div>
    </article>`).join("");
}

function renderBondRecommendations(){
  const el=document.getElementById("bondRecommendations");
  if(!el) return;
  const dimension=document.getElementById("bondDimension")?.value || "Convivência";
  const names=recommendationMap[dimension] || [];
  el.innerHTML=names.map(name=>{
    const w=workshops.find(x=>x.name===name); if(!w) return "";
    return `<div class="recommendation-card" style="--accent:${w.accent}"><strong>${escapeHTML(w.name)}</strong><small>${escapeHTML(w.desc)}</small><div class="mt"><button class="mini-btn primary-lite" onclick="openWorkshop('${w.name.replace(/'/g,"\\'")}')"><i class="bi bi-eye-fill"></i> Abrir oficina</button></div></div>`;
  }).join("") || '<div class="empty-state">Nenhuma sugestão para esta dimensão.</div>';
}

function openWorkshop(name){
  const w=workshops.find(x=>x.name===name); if(!w) return;
  const d=workshopDetails[name] || {materials:[],steps:[],observe:[],access:[]};
  const li=arr=>arr.map(x=>`<li>${escapeHTML(x)}</li>`).join("");
  document.getElementById("workshopContent").innerHTML=`
    <div class="workshop-detail-head"><span class="badge">${escapeHTML(w.axis)}</span><h2>${escapeHTML(w.name)}</h2><p>${escapeHTML(w.desc)}</p><div class="meta"><span class="badge"><i class="bi bi-clock-fill"></i>&nbsp;${escapeHTML(w.duration)}</span> <span class="badge"><i class="bi bi-people-fill"></i>&nbsp;${escapeHTML(w.audience)}</span></div></div>
    <div class="workshop-detail-grid">
      <section class="workshop-detail-block"><h3><i class="bi bi-box-seam-fill"></i> Materiais</h3><ul>${li(d.materials)}</ul></section>
      <section class="workshop-detail-block"><h3><i class="bi bi-eye-fill"></i> O que observar</h3><ul>${li(d.observe)}</ul></section>
      <section class="workshop-detail-block full"><h3><i class="bi bi-list-ol"></i> Passo a passo</h3><ol>${li(d.steps)}</ol></section>
      <section class="workshop-detail-block full"><h3><i class="bi bi-universal-access"></i> Acessibilidade</h3><ul>${li(d.access)}</ul></section>
    </div>`;
  document.getElementById("workshopModal").classList.remove("hidden");
}
function closeWorkshop(){document.getElementById("workshopModal").classList.add("hidden")}
window.openWorkshop=openWorkshop;window.closeWorkshop=closeWorkshop;

function renderDashboard(){
  document.getElementById("statUsers").textContent=data.users.filter(u=>u.status==="Ativo").length;
  document.getElementById("statGroups").textContent=data.groups.length;
  const today=todayISO();
  const todayAgenda=data.agenda.filter(a=>a.date===today).sort((a,b)=>String(a.time).localeCompare(String(b.time)));
  document.getElementById("statAgenda").textContent=todayAgenda.length;
  document.getElementById("statTasks").textContent=data.tasks.filter(t=>!t.done).length;
  document.getElementById("statNotes").textContent=data.notes.length;

  const agendaHTML=todayAgenda.length?todayAgenda.map(a=>`
    <div class="timeline-item"><div class="timeline-time">${a.time||"--:--"}</div><div><strong>${escapeHTML(a.title)}</strong><small>${escapeHTML(a.type)}</small></div></div>`).join(""):"Nenhum compromisso agendado para hoje.";
  ["todayAgenda","routineAgenda"].forEach(id=>document.getElementById(id).innerHTML=agendaHTML);

  const pending=data.tasks.filter(t=>!t.done).slice(0,6);
  const tasksHTML=pending.length?pending.map(t=>`<div class="list-item"><div><strong>${escapeHTML(t.title)}</strong><small>${t.date?formatDate(t.date):"Sem prazo"} · ${escapeHTML(t.priority)}</small></div></div>`).join(""):"Nenhuma tarefa pendente.";
  ["dashboardTasks","routineTasks"].forEach(id=>document.getElementById(id).innerHTML=tasksHTML);

  const notes=[...data.notes].sort((a,b)=>b.created.localeCompare(a.created)).slice(0,5);
  document.getElementById("routineNotes").innerHTML=notes.length?notes.map(n=>`<div class="list-item"><div><strong>${escapeHTML(n.title||"Nota")}</strong><small>${new Date(n.created).toLocaleString("pt-BR")}</small></div></div>`).join(""):"Sem notas recentes.";
}

function renderCalendar(){
  const el=document.getElementById("calendar");
  const y=calendarCursor.getFullYear(), m=calendarCursor.getMonth();
  const first=new Date(y,m,1);
  const last=new Date(y,m+1,0);
  const title=document.getElementById("calendarTitle");
  if(title) title.innerHTML=`<i class="bi bi-calendar3"></i> ${first.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}`;
  const headers=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(h=>`<div class="cal-head">${h}</div>`).join("");
  let days="";
  for(let i=0;i<first.getDay();i++) days+=`<div class="cal-day muted"></div>`;
  for(let d=1;d<=last.getDate();d++){
    const iso=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const events=data.agenda.filter(a=>a.date===iso);
    const isToday=iso===todayISO();
    const selected=iso===selectedCalendarDate;
    const titleText=events.length?events.map(e=>e.title).join(" • "):"Selecionar data";
    days+=`<div class="cal-day ${events.length?"has-event":""} ${isToday?"today":""} ${selected?"selected":""}" title="${escapeHTML(titleText)}" onclick="selectCalendarDate('${iso}')">${d}</div>`;
  }
  el.innerHTML=headers+days;
}

function renderReports(){
  document.getElementById("reportUsers").textContent=data.users.length;
  document.getElementById("reportGroups").textContent=data.groups.length;
  document.getElementById("reportMeetings").textContent=data.meetings.length;
  document.getElementById("reportBonds").textContent=data.bonds.length;
  document.getElementById("reportAttendance").textContent=data.attendance.length;
  const pending=data.tasks.filter(t=>!t.done).length;
  document.getElementById("reportSummary").innerHTML=`
    <p>A BASE Sintropia possui <strong>${data.users.length}</strong> usuário(s), <strong>${data.groups.length}</strong> grupo(s) e <strong>${data.meetings.length}</strong> encontro(s) registrados neste navegador.</p>
    <p>Foram feitos <strong>${data.bonds.length}</strong> registro(s) de observação socioeducativa e existem <strong>${pending}</strong> tarefa(s) pendente(s).</p>
    <p><strong>Importante:</strong> esta versão organiza o trabalho socioeducativo e não realiza diagnóstico, classificação de vulnerabilidade ou substituição dos instrumentos oficiais do SUAS.</p>`;
}

function refreshAll(){
  refreshSelects();
  renderUsers();
  renderGroups();
  renderAgenda();
  renderNotes();
  renderTasks();
  renderMeetings();
  renderAttendance();
  renderBonds();
  renderWorkshops();
  renderBondRecommendations();
  renderDashboard();
  renderReports();
  setDefaultDates();
}

function removeItem(collection,id){
  if(!confirm("Excluir este registro?")) return;
  data[collection]=data[collection].filter(i=>i.id!==id);
  saveData();
  toast("Registro excluído.");
}
window.removeItem=removeItem;

function toggleTask(id){
  const t=data.tasks.find(x=>x.id===id);
  if(t){t.done=!t.done;saveData();}
}
window.toggleTask=toggleTask;

document.getElementById("userForm").addEventListener("submit",e=>{
  e.preventDefault();
  const name=document.getElementById("userName").value.trim();
  data.users.push({
    id:uid("USR"), code:"USR-"+String(data.users.length+1).padStart(4,"0"),
    name, socialName:document.getElementById("userSocialName").value.trim(),
    birth:document.getElementById("userBirth").value, group:document.getElementById("userGroup").value,
    phone:document.getElementById("userPhone").value.trim(), guardian:document.getElementById("userGuardian").value.trim(),
    accessibility:document.getElementById("userAccessibility").value,status:document.getElementById("userStatus").value
  });
  e.target.reset(); saveData(); toast("Usuário salvo.");
});

document.getElementById("groupForm").addEventListener("submit",e=>{
  e.preventDefault();
  data.groups.push({
    id:uid("GRP"), name:document.getElementById("groupName").value.trim(),
    age:document.getElementById("groupAge").value.trim(), day:document.getElementById("groupDay").value,
    time:document.getElementById("groupTime").value
  });
  e.target.reset(); saveData(); toast("Grupo salvo.");
});

document.getElementById("meetingForm").addEventListener("submit",e=>{
  e.preventDefault();
  if(!document.getElementById("meetingGroup").value){toast("Cadastre um grupo primeiro.");return;}
  data.meetings.push({
    id:uid("ENC"), group:document.getElementById("meetingGroup").value,date:document.getElementById("meetingDate").value,
    time:document.getElementById("meetingTime").value,theme:document.getElementById("meetingTheme").value.trim(),
    goal:document.getElementById("meetingGoal").value.trim(),report:document.getElementById("meetingReport").value.trim()
  });
  e.target.reset(); setDefaultDates(); saveData(); toast("Encontro registrado.");
});

document.getElementById("attendanceSave").addEventListener("click",()=>{
  const user=document.getElementById("attendanceUser").value;
  if(!user){toast("Cadastre um usuário primeiro.");return;}
  data.attendance.push({
    id:uid("FRQ"), user, date:document.getElementById("attendanceDate").value||todayISO(),
    status:document.getElementById("attendanceStatus").value
  });
  saveData();toast("Frequência registrada.");
});

document.getElementById("bondForm").addEventListener("submit",e=>{
  e.preventDefault();
  const user=document.getElementById("bondUser").value;
  if(!user){toast("Cadastre um usuário primeiro.");return;}
  data.bonds.push({
    id:uid("VNC"), user, dimension:document.getElementById("bondDimension").value,
    type:document.getElementById("bondType").value,date:document.getElementById("bondDate").value||todayISO(),
    text:document.getElementById("bondText").value.trim()
  });
  e.target.reset();setDefaultDates();saveData();toast("Observação salva.");
});

document.getElementById("agendaForm").addEventListener("submit",e=>{
  e.preventDefault();
  data.agenda.push({
    id:uid("AGD"), title:document.getElementById("agendaTitle").value.trim(),
    date:document.getElementById("agendaDate").value,time:document.getElementById("agendaTime").value,
    type:document.getElementById("agendaType").value,description:document.getElementById("agendaDescription").value.trim()
  });
  e.target.reset();setDefaultDates();saveData();toast("Compromisso salvo.");
});

document.getElementById("noteForm").addEventListener("submit",e=>{
  e.preventDefault();
  data.notes.push({
    id:uid("NOT"),title:document.getElementById("noteTitle").value.trim(),
    type:document.getElementById("noteType").value,text:document.getElementById("noteText").value.trim(),
    created:new Date().toISOString()
  });
  e.target.reset();saveData();toast("Nota salva.");
});

document.getElementById("taskForm").addEventListener("submit",e=>{
  e.preventDefault();
  data.tasks.push({
    id:uid("TSK"),title:document.getElementById("taskTitle").value.trim(),
    date:document.getElementById("taskDate").value,priority:document.getElementById("taskPriority").value,done:false
  });
  e.target.reset();setDefaultDates();saveData();toast("Tarefa salva.");
});

document.getElementById("userSearch").addEventListener("input",renderUsers);
document.getElementById("bondDimension").addEventListener("change",renderBondRecommendations);

document.getElementById("globalSearchBtn").addEventListener("click",()=>{
  const q=prompt("Buscar usuário, grupo, nota ou compromisso:");
  if(!q)return;
  const s=q.toLowerCase();
  const results=[
    ...data.users.filter(x=>x.name.toLowerCase().includes(s)).map(x=>"Usuário: "+x.name),
    ...data.groups.filter(x=>x.name.toLowerCase().includes(s)).map(x=>"Grupo: "+x.name),
    ...data.notes.filter(x=>(x.title+" "+x.text).toLowerCase().includes(s)).map(x=>"Nota: "+(x.title||x.text.slice(0,30))),
    ...data.agenda.filter(x=>(x.title+" "+x.description).toLowerCase().includes(s)).map(x=>"Agenda: "+x.title)
  ];
  alert(results.length?results.slice(0,20).join("\n"):"Nenhum resultado encontrado.");
});

document.getElementById("notificationBtn").addEventListener("click",()=>{
  const pending=data.tasks.filter(t=>!t.done).length;
  const today=data.agenda.filter(a=>a.date===todayISO()).length;
  alert(`Hoje: ${today} compromisso(s).\nTarefas pendentes: ${pending}.`);
});

function openQuickAction(){document.getElementById("quickModal").classList.remove("hidden")}
function closeQuickAction(){document.getElementById("quickModal").classList.add("hidden")}
window.openQuickAction=openQuickAction;window.closeQuickAction=closeQuickAction;window.showView=showView;

document.getElementById("quickModal").addEventListener("click",e=>{
  if(e.target.id==="quickModal") closeQuickAction();
});


const prevCal=document.getElementById("calendarPrev");
const nextCal=document.getElementById("calendarNext");
if(prevCal) prevCal.addEventListener("click",()=>{calendarCursor.setMonth(calendarCursor.getMonth()-1);renderCalendar();});
if(nextCal) nextCal.addEventListener("click",()=>{calendarCursor.setMonth(calendarCursor.getMonth()+1);renderCalendar();});

document.getElementById("userModal").addEventListener("click",e=>{if(e.target.id==="userModal") closeUserProfile();});
document.getElementById("workshopModal").addEventListener("click",e=>{if(e.target.id==="workshopModal") closeWorkshop();});

function exportBackup(){
  const payload={app:"BASE Sintropia",version:"1.2",exportedAt:new Date().toISOString(),data};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=`base-sintropia-backup-${todayISO()}.json`;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);toast("Backup exportado.");
}
function importBackup(file){
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const parsed=JSON.parse(reader.result);
      const incoming=parsed.data||parsed;
      const keys=Object.keys(initialData);
      if(!incoming || !keys.every(k=>Array.isArray(incoming[k]))) throw new Error("Formato inválido");
      if(!confirm("Importar este backup substituirá os dados atuais deste navegador. Continuar?")) return;
      data={...initialData,...incoming};saveData();toast("Backup importado com sucesso.");
    }catch(err){alert("Arquivo de backup inválido ou incompatível.");}
  };
  reader.readAsText(file);
}
document.getElementById("exportBackupBtn").addEventListener("click",exportBackup);
document.getElementById("importBackupBtn").addEventListener("click",()=>document.getElementById("backupFileInput").click());
document.getElementById("backupFileInput").addEventListener("change",e=>{const f=e.target.files[0];if(f)importBackup(f);e.target.value="";});

refreshAll();
