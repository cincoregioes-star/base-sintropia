(() => {
  'use strict';

  const normalize = value => String(value || '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const source = (id,title,version='1.0',type='procedure') => ({id,title,version,type});

  const PROCEDURES = Object.freeze([
    { keys:['chamada','frequencia','frequência','presenca','presença'], text:'Para fazer a chamada: abra **Frequência**, selecione o grupo e a data, marque Presente, Falta ou Justificada para cada participante e clique em **Salvar frequência**. Salvar novamente na mesma data atualiza a mesma sessão; não cria outra chamada.', sources:[source('PROC-ATT-001','Registro de Frequência','1.1')] },
    { keys:['usuario','usuário','cadastrar pessoa','novo usuario','novo usuário'], text:'Abra **Usuários** e clique em **Novo usuário**. Preencha o cadastro único e selecione família e grupo existentes quando aplicável. Antes de gravar, a plataforma verifica CPF, NIS e combinação nome + nascimento para reduzir duplicidades.', sources:[source('PROC-USR-001','Cadastro Único de Usuário','1.1')] },
    { keys:['familia','família','responsavel','responsável'], text:'Abra **Famílias** e registre o núcleo familiar uma única vez. Depois vincule os participantes a essa família. Isso evita repetir pessoa de referência, comunidade e telefone em vários cadastros.', sources:[source('PROC-FAM-001','Cadastro de Família','1.0')] },
    { keys:['dashboard','bi','grafico','gráfico'], text:'Abra **BI & Dashboards**. Os indicadores devem vir do **KPI Registry**, não de cálculos paralelos. Na V0.6, cada KPI pode exibir fórmula, fonte, registros considerados, registros ignorados, versão e confiança.', sources:[source('PROC-BI-001','Uso do BI e Indicadores Oficiais','1.1'),source('KPI-REGISTRY','Catálogo Oficial de KPIs','1.0','registry')] },
    { keys:['mapa','heatmap','territorio','território'], text:'Abra **Território**. A visão gerencial usa dados agregados. Pontos individuais sensíveis não devem ser exibidos em mapas públicos ou gerenciais sem necessidade e autorização.', sources:[source('PROC-MAP-001','Uso Seguro de Mapas Territoriais','1.0')] },
    { keys:['excluir','apagar usuario','apagar usuário'], text:'Cadastros com histórico devem ser **inativados ou arquivados**, preservando frequência, oficinas, encaminhamentos e auditoria. Exclusão física é exceção administrativa e não é o fluxo normal da plataforma.', sources:[source('POL-DATA-001','Preservação de Histórico e Exclusão Lógica','1.0','policy')] },
    { keys:['duplic','redund','repetid'], text:'A BASE Sintropia usa uma **Fonte Única da Verdade**. Pessoa, família, grupo e território são cadastrados uma vez e referenciados por ID. O motor de duplicidade atua antes da criação de novos usuários.', sources:[source('POL-DATA-002','Fonte Única da Verdade e Antiduplicidade','1.0','policy')] },
    { keys:['crise','risco','cric','incidente'], text:'A **CRIC** acompanha risco operacional, dados, segurança e continuidade. Incidentes críticos devem possuir severidade, responsável, linha do tempo, causa raiz, ação corretiva e ação preventiva.', sources:[source('CRIC-001','Plano de Risco, Integridade e Continuidade','1.0','policy')] },
    { keys:['permiss','acesso','pode fazer'], text:'O acesso segue o princípio do **menor privilégio**. Orientador atua no próprio escopo; coordenação na unidade; gestão em visão autorizada; administração controla configurações. Interface e banco devem aplicar a mesma regra.', sources:[source('SEC-RBAC-001','Matriz de Perfis e Permissões','1.0','policy')] },
    { keys:['relatorio','relatório'], text:'Relatórios devem usar as mesmas fontes e KPIs dos dashboards para evitar divergência. Toda medida institucional relevante precisa ser rastreável até a fonte e versão.', sources:[source('PROC-REP-001','Relatórios Gerenciais','1.0')] },
    { keys:['backup','perda','recuper'], text:'A arquitetura prevê backup, restauração testada, rollback e Disaster Recovery. Um backup só é considerado confiável quando a restauração é validada.', sources:[source('DR-001','Disaster Recovery e Continuidade','1.0','policy')] },
    { keys:['criador','carlos','autor'], text:'A página **Criador** registra a idealização, arquitetura funcional e desenvolvimento da BASE Sintropia e direciona ao portfólio completo.', sources:[source('ABOUT-001','Sobre a BASE Sintropia','1.0')] }
  ]);

  function permissionsAnswer() {
    const session = window.SintropiaAuth?.ensureSession?.();
    const role = session?.user?.role || 'não identificado';
    const permissions = window.SintropiaPermissions?.list?.(role) || [];
    const labels = {orientador:'Orientador',tecnico:'Técnico',coordenador:'Coordenação',gestor:'Gestão',auditor:'Auditoria',administrador:'Administrador'};
    const summary = permissions.includes('*') ? 'Seu perfil possui acesso administrativo amplo, sujeito às proteções da plataforma.' : `Seu perfil possui ${permissions.length} permissões funcionais registradas para o escopo autorizado.`;
    return { text:`Perfil atual: **${labels[role] || role}**. ${summary}`, sources:[source('SEC-RBAC-001','Matriz de Perfis e Permissões','1.0','policy')] };
  }

  function answer(question) {
    const n = normalize(question), kpis = window.SintropiaKPI?.evaluate?.() || [];
    const wantsNumber = ['quanto','qual','quantos','media','indicador','kpi','calculo','calculado','formula','fórmula'].some(w => n.includes(normalize(w)));
    const dynamic = kpis.find(k => { const words=normalize(k.name).split(/\s+/).filter(w=>w.length>3); return wantsNumber && words.some(w=>n.includes(w)); });
    if (dynamic) { const ex=window.SintropiaKPI.explain(dynamic.id); return { text:`**${ex.name}: ${ex.value}**\n${ex.definition}\nFórmula: ${ex.formula}\nRegistros considerados: ${ex.lineage.considered}. Ignorados: ${ex.lineage.ignored}. Confiança: ${ex.confidence}%.`, sources:[source(ex.id,ex.name,ex.version,'kpi'),source('KPI-REGISTRY','Catálogo Oficial de KPIs','1.0','registry')] }; }
    if (n.includes('faltas consecutivas') || n.includes('ausencias consecutivas') || n.includes('ausência consecutiva')) { const rows=window.SintropiaIntelligence?.absenceStreaks?.()||[], rule=window.SintropiaRules?.get?.('consecutive_absences'), alerting=rows.filter(r=>r.streak>=Number(rule?.threshold||3)); const text=alerting.length?alerting.slice(0,5).map(r=>`${r.participantName}: ${r.streak} falta(s) consecutiva(s)`).join('\n'):`Nenhum usuário atingiu o limite atual de ${rule?.threshold||3} faltas consecutivas.`; return { text:`**Ausências consecutivas**\n${text}`, sources:[source('RULE-ATT-CONSEC','Regra Ausências Consecutivas',String(rule?.version||1),'rule'),source('PROC-ATT-001','Registro de Frequência','1.1')] }; }
    if (n.includes('regra') || n.includes('radar')) { const rules=window.SintropiaRules?.list?.()||[], enabled=rules.filter(r=>r.enabled).length; return { text:`O Radar possui **${enabled} regra(s) ativa(s)** de ${rules.length} cadastradas. Limites ficam visíveis na Administração e alterações são auditadas e versionadas.`, sources:[source('RULE-REGISTRY','Registro de Regras do Radar','1.0','registry')] }; }
    if (n.includes('prioridade') || n.includes('decisao') || n.includes('decisão')) { const top=window.SintropiaIntelligence?.signals?.()?.[0]; return top ? { text:`Prioridade atual: **${top.title}**. ${top.detail} Impacto ${top.impact}/10, urgência ${top.urgency}/10, confiança ${top.confidence}% e score ${top.score}.`, sources:[source(top.ruleId||top.id,'Regra que originou o sinal',String(top.ruleVersion||1),'rule'),source('DEC-PRIORITY-001','Modelo de Priorização do Decision Center','1.0','policy')] } : { text:'Não há prioridade ativa derivada pelas regras atuais.', sources:[source('RULE-REGISTRY','Registro de Regras do Radar','1.0','registry')] }; }
    if (n.includes('o que posso fazer') || n.includes('minhas permissoes') || n.includes('minhas permissões')) return permissionsAnswer();
    const hit = PROCEDURES.find(row => row.keys.some(k => n.includes(normalize(k))));
    if (hit) return { text:hit.text, sources:hit.sources };
    return { text:'Posso orientar sobre usuários, famílias, grupos, frequência, faltas consecutivas, oficinas, encaminhamentos, dashboards, mapas, KPIs, regras do Radar, prioridades, qualidade dos dados, riscos e continuidade. Quando houver procedimento oficial, mostro a fonte usada.', sources:[source('SINTI-GUIDE-001','Guia de Escopo do SINTI','1.0')] };
  }

  window.SintropiaSinti = Object.freeze({ PROCEDURES, answer, permissionsAnswer });
})();
