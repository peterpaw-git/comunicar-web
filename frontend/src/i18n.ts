export type Lang = 'it' | 'br';

// ─── Translation dictionaries ────────────────────────────────────────────────
const T = {
  it: {
    // ── App header ──────────────────────────────────────────────────────────
    appSubtitle: 'WhatsApp · Evolution API',

    // ── Import/Export bar ───────────────────────────────────────────────────
    importCsv:      'Importa CSV',
    exportCsv:      'Esporta CSV',
    importing:      'Importando...',
    importError:    'Errore importazione',
    importSuccess:  (n: number) => `${n} contatti importati`,

    // ── Toolbar ─────────────────────────────────────────────────────────────
    searchPlaceholder: 'Cerca responsabile, aluno...',
    filterAll:         'Tutti',
    deselectAll:       'Deseleziona',
    selectAll:         'Seleziona tutti',
    markDone:          (n: number) => `✓ Concluído (${n})`,
    unmarkDone:        'Cancella concluído',
    deleteSelected:    (n: number) => `Elimina (${n})`,
    confirmDelete:     (n: number) => `Eliminare ${n} contatt${n === 1 ? 'o' : 'i'}?`,
    newContact:        'Nuovo',
    loading:           'Caricamento...',
    contactCount:      (n: number) => `${n} contatti`,
    refresh:           'Aggiorna',

    // ── Right-panel tabs ────────────────────────────────────────────────────
    tabMessage: 'Messaggio',
    tabHistory: 'Storico',

    // ── Status bar ──────────────────────────────────────────────────────────
    totalContacts:    (n: number) => `${n} contatti totali`,
    selectedContacts: (n: number) => `${n} selezionati`,

    // ── Contact grid ────────────────────────────────────────────────────────
    rowEditHint:     'Doppio clic per modificare',
    colStato:        'Stato',
    colFare:         'Fare',
    colFatto:        'Fatto',
    colAluno:        'Aluno',
    colResponsabile: 'Responsabile',
    colGruppo:       'Gruppo',
    colWaMae:        'WA Mãe',
    colWaPai:        'WA Pai',
    colEmail1:       'Email 1',
    colNote:         'Note',
    colEdit:         'Modifica',
    gridLoading:     'Caricamento...',
    gridEmpty:       'Nessun risultato',

    // ── Contact modal ────────────────────────────────────────────────────────
    editContact:          'Modifica contatto',
    newContactTitle:      'Nuovo contatto',
    fieldResponsabile:    'Responsabile *',
    fieldFilhos:          'Aluno (Filhos)',
    fieldGruppo:          'Gruppo',
    fieldStato:           'Stato (Attivo)',
    fieldWaMae:           'WA Mãe',
    fieldWaPai:           'WA Pai',
    fieldEmail1:          'Email 1',
    fieldEmail2:          'Email 2',
    fieldCpf:             'CPF',
    fieldGruppo2:         'Gruppo 2',
    fieldBoleto:          'Boleto',
    fieldNote:            'Note (Voti)',
    fieldDaFare:          'Da fare',
    fieldFatto:           'Fatto / Concluído',
    errorResponsabile:    'Responsabile obbligatorio',
    errorSave:            'Errore salvataggio',
    cancel:               'Annulla',
    saving:               'Salvataggio...',
    saveChanges:          'Salva modifiche',
    createContact:        'Crea contatto',

    // ── Group multi-select ───────────────────────────────────────────────────
    allGroups:   'Tutti i gruppi',
    nGroups:     (n: number) => `${n} gruppi`,
    noGroups:    'Nessun gruppo',

    // ── Selection groups panel ───────────────────────────────────────────────
    selectionGroupsTitle: (n: number) => `Gruppi di selezione (${n})`,
    groupNamePlaceholder: 'Nome gruppo...',
    groupDescPlaceholder: 'Descrizione (opzionale)...',
    noGroupsSaved:        'Nessun gruppo salvato',
    selectionHint:        (n: number) => `${n} selezionati — dai un nome e salva come gruppo`,
    errorDuplicateGroup:  'Nome già esistente',
    errorGeneric:         'Errore, riprova',
    editGroup:            'Modifica gruppo',
    saveGroup:            'Salva',
    noDescription:        'Nessuna descrizione',
    confirmDeleteGroup:   (name: string) => `Eliminare il gruppo "${name}"?`,
    expandGroup:          'Espandi',
    collapseGroup:        'Chiudi',

    // ── Message composer ─────────────────────────────────────────────────────
    tabWhatsApp:       'WhatsApp',
    tabEmail:          'Email',
    tabResults:        'Risultati',
    templates:         'Template',
    noTemplates:       'Nessun template salvato',
    labelTitle:        'Titolo',
    titlePlaceholder:  'Titolo del comunicato...',
    labelBody:         'Messaggio',
    resetHeight:       'Ripristina altezza automatica',
    bodyPlaceholder:   'Testo del messaggio...',
    labelImage:        'Immagine allegata',
    selectImage:       'Seleziona immagine',
    saveTemplate:      'Salva come template...',
    save:              'Salva',
    sendingProgress:   'Invio in corso...',
    sendBtn:           'Invia',
    sendBtnTo:         (n: number) => `Invia a ${n} contatti`,

    // ── History panel ─────────────────────────────────────────────────────────
    historySearch:    'Cerca nei messaggi...',
    historyEmpty:     'Nessun messaggio inviato ancora',
    historyNoResults: 'Nessun risultato',
    noTitle:          'Senza titolo',
    noBody:           'Nessun testo',
    recipientsSuffix: 'dest.',
    reuseBtn:         'Riusa',
    deleteBtn:        'Elimina',

    // ── Send results ──────────────────────────────────────────────────────────
    resultsEmpty:  'Risultati invio',
    errorsLabel:   'errori',

    // ── Chat dashboard ────────────────────────────────────────────────────────
    chatTitle:            'Chat WhatsApp',
    chatSearch:           'Cerca conversazione...',
    chatNewChat:          'Nuova chat',
    chatNoConversations:  'Nessuna conversazione',
    chatStart:            'Inizia una nuova chat',
    chatNoMessages:       'Nessun messaggio ancora',
    chatInputPlaceholder: 'Scrivi un messaggio...',
    chatSelectContact:    'Seleziona una conversazione',
    chatPickContact:      'Scegli un contatto',
    chatPickSearch:       'Cerca contatto o numero...',
    chatModeComunicar:    'Comunicar',
    chatModeChat:         'Chat',

    // ── Send confirm modal ────────────────────────────────────────────────────
    confirmTitle:      'Conferma invio',
    confirmSpamNote:   'I messaggi verranno inviati con un ritardo casuale di 2–10 secondi tra un invio e l\'altro per evitare blocchi spam.',
    confirmRecipients: 'Destinatari',
    confirmContacts:   (n: number) => `${n} contatti`,
    confirmChannel:    'Canale',
    confirmOrder:      'Ordine di invio',
    confirmDefaultOrder: 'Ordine predefinito (progressivo)',
    confirmEstTime:    'Tempo stimato',
    cancelBtn:         'Annulla',
    sendNowBtn:        'Invia ora',

    // ── Auth — login page ─────────────────────────────────────────────────────
    loginSubtitle:  'Colégio Montessori Rainha',
    loginEmail:     'E-mail',
    loginPassword:  'Password',
    loginButton:    'Accedi',
    loginLoading:   'Accesso...',
    loginError:     'Email o password non corretti',

    // ── Auth — app loading ────────────────────────────────────────────────────
    authLoading:    'Caricamento...',

    // ── Auth — user dropdown ──────────────────────────────────────────────────
    userMenuChangePassword: 'Cambia password',
    userMenuManageUsers:    'Gestione utenti',
    userMenuLogout:         'Logout',

    // ── Auth — change-password modal ──────────────────────────────────────────
    changePwTitle:          'Cambia Password',
    changePwCurrent:        'Password attuale',
    changePwNew:            'Nuova password',
    changePwNewHint:        'min 6 caratteri',
    changePwConfirm:        'Conferma nuova password',
    changePwSuccess:        'Password aggiornata con successo!',
    changePwClose:          'Chiudi',
    changePwErrEmpty:       'Compila tutti i campi',
    changePwErrShort:       'Minimo 6 caratteri',
    changePwErrMismatch:    'Le password non coincidono',
    changePwErrGeneric:     'Errore cambio password',
    changePwSave:           'Salva',
    changePwSaving:         'Salvataggio...',
    changePwForcedNotice:   'Per sicurezza devi impostare una nuova password personale prima di continuare.',

    // ── Auth — user management modal ──────────────────────────────────────────
    userMgmtTitle:          'Gestione Utenti',
    userMgmtNewTitle:       'Nuovo Utente',
    userMgmtEditTitle:      (name: string) => `Modifica: ${name}`,
    userMgmtNewBtn:         'Nuovo utente',
    userMgmtColName:        'Nome',
    userMgmtColEmail:       'E-mail',
    userMgmtColRole:        'Ruolo',
    userMgmtFieldEmail:     'E-mail',
    userMgmtFieldName:      'Nome',
    userMgmtFieldRole:      'Ruolo',
    userMgmtFieldPassword:  'Password',
    userMgmtPwHint:         'min 6 caratteri',
    userMgmtPwOptional:     'lascia vuoto per non cambiare',
    userMgmtErrRequired:    'Tutti i campi sono obbligatori',
    userMgmtErrCreate:      'Errore creazione utente',
    userMgmtErrUpdate:      'Errore aggiornamento',
    userMgmtConfirmDelete:  (name: string) => `Eliminare l\'utente ${name}?`,
    userMgmtCancel:         'Annulla',
    userMgmtSaving:         'Salvataggio...',
    userMgmtSave:           'Salva',

    // ── Settings modal ────────────────────────────────────────────────────────
    settingsTitle:              'Impostazioni',
    settingsInactivityLabel:    'Timeout inattività',
    settingsInactivityHint:     "L'app torna al login dopo X minuti senza attività dell'utente.",
    settingsMinutes:            'minuti',
    settingsZeroDisabled:       '0 = disabilitato (nessun timeout automatico)',
    settingsSaved:              '✓ Salvato',

    // ── Session / inactivity ──────────────────────────────────────────────────
    sessionExpiredNotice:       'Sessione scaduta per inattività. Accedi di nuovo.',
    inactivityWarning:          (s: number) => `Sessione in scadenza tra ${s} s. Clicca per continuare.`,
    inactivityWarningBtn:       'Continua',

    // ── AI message improver ───────────────────────────────────────────────────
    aiBtn:          '✨ AI',
    aiImproving:    'Migliorando...',
    aiUndo:         '↩ Ripristina',
    aiTooltip:      'Corregge la grammatica, traduce dall\'italiano e aggiunge emoji',
    aiError:        'Errore AI. Riprova.',
    aiNoKey:        'Configura OPENAI_API_KEY o ANTHROPIC_API_KEY nel file .env del backend.',
  },

  br: {
    // ── App header ──────────────────────────────────────────────────────────
    appSubtitle: 'WhatsApp · Evolution API',

    // ── Import/Export bar ───────────────────────────────────────────────────
    importCsv:      'Importar CSV',
    exportCsv:      'Exportar CSV',
    importing:      'Importando...',
    importError:    'Erro na importação',
    importSuccess:  (n: number) => `${n} contatos importados`,

    // ── Toolbar ─────────────────────────────────────────────────────────────
    searchPlaceholder: 'Buscar responsável, aluno...',
    filterAll:         'Todos',
    deselectAll:       'Desmarcar tudo',
    selectAll:         'Selecionar tudo',
    markDone:          (n: number) => `✓ Concluído (${n})`,
    unmarkDone:        'Cancelar concluído',
    deleteSelected:    (n: number) => `Excluir (${n})`,
    confirmDelete:     (n: number) => `Excluir ${n} contato${n === 1 ? '' : 's'}?`,
    newContact:        'Novo',
    loading:           'Carregando...',
    contactCount:      (n: number) => `${n} contatos`,
    refresh:           'Atualizar',

    // ── Right-panel tabs ────────────────────────────────────────────────────
    tabMessage: 'Mensagem',
    tabHistory: 'Histórico',

    // ── Status bar ──────────────────────────────────────────────────────────
    totalContacts:    (n: number) => `${n} contatos no total`,
    selectedContacts: (n: number) => `${n} selecionados`,

    // ── Contact grid ────────────────────────────────────────────────────────
    rowEditHint:     'Duplo clique para editar',
    colStato:        'Status',
    colFare:         'Fazer',
    colFatto:        'Feito',
    colAluno:        'Aluno',
    colResponsabile: 'Responsável',
    colGruppo:       'Turma',
    colWaMae:        'WA Mãe',
    colWaPai:        'WA Pai',
    colEmail1:       'Email 1',
    colNote:         'Obs.',
    colEdit:         'Editar',
    gridLoading:     'Carregando...',
    gridEmpty:       'Nenhum resultado',

    // ── Contact modal ────────────────────────────────────────────────────────
    editContact:          'Editar contato',
    newContactTitle:      'Novo contato',
    fieldResponsabile:    'Responsável *',
    fieldFilhos:          'Aluno (Filhos)',
    fieldGruppo:          'Turma',
    fieldStato:           'Status (Ativo)',
    fieldWaMae:           'WA Mãe',
    fieldWaPai:           'WA Pai',
    fieldEmail1:          'Email 1',
    fieldEmail2:          'Email 2',
    fieldCpf:             'CPF',
    fieldGruppo2:         'Turma 2',
    fieldBoleto:          'Boleto',
    fieldNote:            'Obs. (Notas)',
    fieldDaFare:          'A fazer',
    fieldFatto:           'Feito / Concluído',
    errorResponsabile:    'Responsável obrigatório',
    errorSave:            'Erro ao salvar',
    cancel:               'Cancelar',
    saving:               'Salvando...',
    saveChanges:          'Salvar alterações',
    createContact:        'Criar contato',

    // ── Group multi-select ───────────────────────────────────────────────────
    allGroups:   'Todas as turmas',
    nGroups:     (n: number) => `${n} turmas`,
    noGroups:    'Nenhuma turma',

    // ── Selection groups panel ───────────────────────────────────────────────
    selectionGroupsTitle: (n: number) => `Grupos de seleção (${n})`,
    groupNamePlaceholder: 'Nome do grupo...',
    groupDescPlaceholder: 'Descrição (opcional)...',
    noGroupsSaved:        'Nenhum grupo salvo',
    selectionHint:        (n: number) => `${n} selecionados — dê um nome e salve como grupo`,
    errorDuplicateGroup:  'Nome já existente',
    errorGeneric:         'Erro, tente novamente',
    editGroup:            'Editar grupo',
    saveGroup:            'Salvar',
    noDescription:        'Sem descrição',
    confirmDeleteGroup:   (name: string) => `Excluir o grupo "${name}"?`,
    expandGroup:          'Expandir',
    collapseGroup:        'Fechar',

    // ── Message composer ─────────────────────────────────────────────────────
    tabWhatsApp:       'WhatsApp',
    tabEmail:          'Email',
    tabResults:        'Resultados',
    templates:         'Modelos',
    noTemplates:       'Nenhum modelo salvo',
    labelTitle:        'Título',
    titlePlaceholder:  'Título do comunicado...',
    labelBody:         'Mensagem',
    resetHeight:       'Restaurar altura automática',
    bodyPlaceholder:   'Texto da mensagem...',
    labelImage:        'Imagem anexada',
    selectImage:       'Selecionar imagem',
    saveTemplate:      'Salvar como modelo...',
    save:              'Salvar',
    sendingProgress:   'Enviando...',
    sendBtn:           'Enviar',
    sendBtnTo:         (n: number) => `Enviar para ${n} contatos`,

    // ── History panel ─────────────────────────────────────────────────────────
    historySearch:    'Buscar nas mensagens...',
    historyEmpty:     'Nenhuma mensagem enviada ainda',
    historyNoResults: 'Nenhum resultado',
    noTitle:          'Sem título',
    noBody:           'Sem texto',
    recipientsSuffix: 'dest.',
    reuseBtn:         'Reutilizar',
    deleteBtn:        'Excluir',

    // ── Send results ──────────────────────────────────────────────────────────
    resultsEmpty:  'Resultados do envio',
    errorsLabel:   'erros',

    // ── Chat dashboard ────────────────────────────────────────────────────────
    chatTitle:            'Chat WhatsApp',
    chatSearch:           'Buscar conversa...',
    chatNewChat:          'Nova conversa',
    chatNoConversations:  'Nenhuma conversa',
    chatStart:            'Iniciar nova conversa',
    chatNoMessages:       'Nenhuma mensagem ainda',
    chatInputPlaceholder: 'Escreva uma mensagem...',
    chatSelectContact:    'Selecione uma conversa',
    chatPickContact:      'Escolha um contato',
    chatPickSearch:       'Buscar contato ou número...',
    chatModeComunicar:    'Comunicar',
    chatModeChat:         'Chat',

    // ── Send confirm modal ────────────────────────────────────────────────────
    confirmTitle:      'Confirmar envio',
    confirmSpamNote:   'As mensagens serão enviadas com um atraso aleatório de 2–10 segundos entre cada envio para evitar bloqueios por spam.',
    confirmRecipients: 'Destinatários',
    confirmContacts:   (n: number) => `${n} contatos`,
    confirmChannel:    'Canal',
    confirmOrder:      'Ordem de envio',
    confirmDefaultOrder: 'Ordem padrão (progressivo)',
    confirmEstTime:    'Tempo estimado',
    cancelBtn:         'Cancelar',
    sendNowBtn:        'Enviar agora',

    // ── Auth — login page ─────────────────────────────────────────────────────
    loginSubtitle:  'Colégio Montessori Rainha',
    loginEmail:     'E-mail',
    loginPassword:  'Senha',
    loginButton:    'Entrar',
    loginLoading:   'Entrando...',
    loginError:     'E-mail ou senha incorretos',

    // ── Auth — app loading ────────────────────────────────────────────────────
    authLoading:    'Carregando...',

    // ── Auth — user dropdown ──────────────────────────────────────────────────
    userMenuChangePassword: 'Alterar senha',
    userMenuManageUsers:    'Gerenciar usuários',
    userMenuLogout:         'Sair',

    // ── Auth — change-password modal ──────────────────────────────────────────
    changePwTitle:          'Alterar Senha',
    changePwCurrent:        'Senha atual',
    changePwNew:            'Nova senha',
    changePwNewHint:        'mín 6 caracteres',
    changePwConfirm:        'Confirmar nova senha',
    changePwSuccess:        'Senha atualizada com sucesso!',
    changePwClose:          'Fechar',
    changePwErrEmpty:       'Preencha todos os campos',
    changePwErrShort:       'Mínimo 6 caracteres',
    changePwErrMismatch:    'As senhas não coincidem',
    changePwErrGeneric:     'Erro ao alterar senha',
    changePwSave:           'Salvar',
    changePwSaving:         'Salvando...',
    changePwForcedNotice:   'Por segurança, você precisa definir uma senha pessoal antes de continuar.',

    // ── Auth — user management modal ──────────────────────────────────────────
    userMgmtTitle:          'Gerenciar Usuários',
    userMgmtNewTitle:       'Novo Usuário',
    userMgmtEditTitle:      (name: string) => `Editar: ${name}`,
    userMgmtNewBtn:         'Novo usuário',
    userMgmtColName:        'Nome',
    userMgmtColEmail:       'E-mail',
    userMgmtColRole:        'Perfil',
    userMgmtFieldEmail:     'E-mail',
    userMgmtFieldName:      'Nome',
    userMgmtFieldRole:      'Perfil',
    userMgmtFieldPassword:  'Senha',
    userMgmtPwHint:         'mín 6 caracteres',
    userMgmtPwOptional:     'deixe em branco para não alterar',
    userMgmtErrRequired:    'Todos os campos são obrigatórios',
    userMgmtErrCreate:      'Erro ao criar usuário',
    userMgmtErrUpdate:      'Erro ao atualizar',
    userMgmtConfirmDelete:  (name: string) => `Excluir o usuário ${name}?`,
    userMgmtCancel:         'Cancelar',
    userMgmtSaving:         'Salvando...',
    userMgmtSave:           'Salvar',

    // ── Settings modal ────────────────────────────────────────────────────────
    settingsTitle:              'Configurações',
    settingsInactivityLabel:    'Tempo limite de inatividade',
    settingsInactivityHint:     'O app volta ao login após X minutos sem atividade do usuário.',
    settingsMinutes:            'minutos',
    settingsZeroDisabled:       '0 = desativado (sem limite automático)',
    settingsSaved:              '✓ Salvo',

    // ── Session / inactivity ──────────────────────────────────────────────────
    sessionExpiredNotice:       'Sessão expirada por inatividade. Faça login novamente.',
    inactivityWarning:          (s: number) => `Sessão expira em ${s} s. Clique para continuar.`,
    inactivityWarningBtn:       'Continuar',

    // ── AI message improver ───────────────────────────────────────────────────
    aiBtn:          '✨ IA',
    aiImproving:    'Melhorando...',
    aiUndo:         '↩ Desfazer',
    aiTooltip:      'Corrige gramática, traduz do italiano e adiciona emojis',
    aiError:        'Erro IA. Tente novamente.',
    aiNoKey:        'Configure OPENAI_API_KEY ou ANTHROPIC_API_KEY no arquivo .env do backend.',
  },
} as const;

export type Translations = typeof T.it;

export { T };
