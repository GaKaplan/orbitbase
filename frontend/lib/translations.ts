export type Language = 'es' | 'en' | 'pt' | 'fr';

export const translations: Record<Language, any> = {
  es: {
    hero: {
      tag: "Construido sobre Base Mainnet",
      title: "Launchpad como un Servicio",
      subtitle: "Grado Institucional.",
      desc: "Lanza tus proyectos con seguridad de élite. OrbitBase combina la potencia de BASE con herramientas de liquidez y factory de nivel institucional.",
      btnExplore: "Explorar Proyectos",
      btnDocs: "Documentación"
    },
    guide: {
      title: "Cómo funciona OrbitBase",
      step1: {
        title: "1. Crea tu Token",
        desc: "Usa el Token Factory para desplegar tu contrato inteligente (Token estándar o Memecoin) en segundos."
      },
      step2: {
        title: "2. Vincula tu Wallet",
        desc: "Conecta tu billetera para gestionar tus activos y recibir las llaves de propietario de forma segura."
      },
      step3: {
        title: "3. Bloquea Liquidez",
        desc: "Genera confianza bloqueando tus tokens LP por un periodo determinado mediante nuestro Liquidity Locker."
      },
      step4: {
        title: "4. Gestiona y Retira",
        desc: "Monitorea la actividad desde tu panel y recupera tus tokens una vez vencido el plazo de bloqueo."
      }
    },
    activity: {
      title: "Panel de Actividad",
      subtitle: "Historial en tiempo real de la red Base.",
      featuredTitle: "Proyectos Destacados",
      featuredSubtitle: "Casos de éxito lanzados y bloqueados a través de OrbitBase.",
      myActivity: "Mi Actividad",
      adminMode: "Modo Admin",
      noResults: "No se encontraron movimientos para los filtros seleccionados.",
      syncing: "Sincronizando con la red Base...",
      totalIncome: "Ingresos Totales",
      tokensCreated: "Tokens Creados",
      locksCreated: "Bloqueos",
      configTitle: "Configuración de Plataforma",
      withdrawBtn: "Retirar Balance",
      available: "Disponible",
      flatFeeLabel: "Tarifa por Creación (Flat Fee)",
      recipientLabel: "Billetera Receptora de Comisiones",
      updateBtn: "Actualizar",
      changeBtn: "Cambiar",
      current: "Actual",
      table: {
        date: "Fecha",
        type: "Tipo",
        details: "Detalles",
        creator: "Creador",
        quantity: "Cantidad / Suministro"
      },
      token: "Token",
      memecoin: "Memecoin",
      lock: "Bloqueo",
      lockedLiq: "Liquidez Bloqueada",
      unlockDate: "Desbloqueo",
      unlockTime: "Hora",
      claimBtn: "Retirar Tokens 🔓",
      claimed: "RECLAMADO ✅",
      processing: "Procesando...",
      locked: "Bloqueado 🔒",
      copyAddr: "Copiar Dirección",
      copyHash: "Copiar",
      copied: "Copiado",
      you: "(Tú)"
    },
    footer: {
      infra: "Infraestructura para BASE.",
      by: "por"
    },
    forms: {
      createToken: {
        title: "Lanzar Nuevo Proyecto",
        memecoin: "Memecoin (Fijo)",
        standard: "Token Estándar",
        nameLabel: "Nombre del Proyecto",
        namePlaceholder: "Ej: Base Moon Rocket",
        symbolLabel: "Símbolo",
        symbolPlaceholder: "Ej: MOON",
        supplyLabel: "Suministro Inicial",
        btnConnect: "Conectar Wallet para continuar",
        btnPending: "Confirmando en Wallet...",
        btnConfirming: "Minando transacción...",
        btnCreate: "Crear",
        successTitle: "¡Token Desplegado!",
        successDesc: "Tu contrato está vivo en la red.",
        contractAddr: "Dirección del Contrato",
        copyTitle: "Copiar dirección",
        txHash: "Hash de Transacción",
        importNotice: "* Importa esta dirección en MetaMask para interactuar con tu token.",
        errorTitle: "Error",
        errorRejected: "Transacción cancelada por el usuario.",
        errorFunds: "Fondos insuficientes o error de red."
      },
      locker: {
        title: "Liquidity Locker",
        tokenLabel: "Dirección del Token (LP)",
        tokenPlaceholder: "0x...",
        amountLabel: "Cantidad",
        dateLabel: "Fecha de Desbloqueo",
        btnApprovePending: "Confirmando aprobación...",
        btnApproveStep: "Paso 1: Aprobar Tokens",
        btnLockPending: "Bloqueando...",
        btnLocked: "✅ Tokens Bloqueados",
        btnLockStep: "Paso 2: Bloquear Tokens",
        approveSuccess: "✨ Aprobación exitosa. ¡Ahora puedes bloquear tus tokens!",
        lockSuccess: "✅ Operación completada. Tokens bloqueados hasta el ",
        errorTx: "Hubo un error en la transacción. Revisa MetaMask."
      }
    }
  },
  en: {
    hero: {
      tag: "Built on Base Mainnet",
      title: "Launchpad as a Service",
      subtitle: "Institutional Grade.",
      desc: "Launch your projects with elite security. OrbitBase combines the power of BASE with institutional-grade liquidity and factory tools.",
      btnExplore: "Explore Projects",
      btnDocs: "Documentation"
    },
    guide: {
      title: "How OrbitBase Works",
      step1: {
        title: "1. Create your Token",
        desc: "Use the Token Factory to deploy your smart contract (Standard Token or Memecoin) in seconds."
      },
      step2: {
        title: "2. Link your Wallet",
        desc: "Connect your wallet to manage your assets and receive owner keys securely."
      },
      step3: {
        title: "3. Lock Liquidity",
        desc: "Build trust by locking your LP tokens for a specified period using our Liquidity Locker."
      },
      step4: {
        title: "4. Manage & Withdraw",
        desc: "Monitor activity from your dashboard and recover your tokens once the lock period expires."
      }
    },
    activity: {
      title: "Activity Dashboard",
      subtitle: "Monitor your launches and liquidity locks.",
      featuredTitle: "Featured Projects",
      featuredSubtitle: "Success stories launched and locked through OrbitBase.",
      myActivity: "My Activity",
      adminMode: "Admin Mode",
      noResults: "No movements found for the selected filters.",
      syncing: "Syncing with Base network...",
      totalIncome: "Total Income",
      tokensCreated: "Tokens Created",
      locksCreated: "Locks",
      configTitle: "Platform Settings",
      withdrawBtn: "Withdraw Balance",
      available: "Available",
      flatFeeLabel: "Creation Fee (Flat Fee)",
      recipientLabel: "Fee Recipient Wallet",
      updateBtn: "Update",
      changeBtn: "Change",
      current: "Current",
      table: {
        date: "Date",
        type: "Type",
        details: "Details",
        creator: "Creator",
        quantity: "Quantity / Supply"
      },
      token: "Token",
      memecoin: "Memecoin",
      lock: "Lock",
      lockedLiq: "Locked Liquidity",
      unlockDate: "Unlock Date",
      unlockTime: "Time",
      claimBtn: "Withdraw Tokens 🔓",
      claimed: "CLAIMED ✅",
      processing: "Processing...",
      locked: "Locked 🔒",
      copyAddr: "Copy Address",
      copyHash: "Copy",
      copied: "Copied",
      you: "(You)"
    },
    footer: {
      infra: "Infrastructure for BASE.",
      by: "by"
    },
    forms: {
      createToken: {
        title: "Launch New Project",
        memecoin: "Memecoin (Fixed)",
        standard: "Standard Token",
        nameLabel: "Project Name",
        namePlaceholder: "e.g., Base Moon Rocket",
        symbolLabel: "Symbol",
        symbolPlaceholder: "e.g., MOON",
        supplyLabel: "Initial Supply",
        btnConnect: "Connect Wallet to continue",
        btnPending: "Confirming in Wallet...",
        btnConfirming: "Mining transaction...",
        btnCreate: "Create",
        successTitle: "Token Deployed!",
        successDesc: "Your contract is live on the network.",
        contractAddr: "Contract Address",
        copyTitle: "Copy address",
        txHash: "Transaction Hash",
        importNotice: "* Import this address into MetaMask to interact with your token.",
        errorTitle: "Error",
        errorRejected: "Transaction cancelled by user.",
        errorFunds: "Insufficient funds or network error."
      },
      locker: {
        title: "Liquidity Locker",
        tokenLabel: "Token Address (LP)",
        tokenPlaceholder: "0x...",
        amountLabel: "Amount",
        dateLabel: "Unlock Date",
        btnApprovePending: "Confirming approval...",
        btnApproveStep: "Step 1: Approve Tokens",
        btnLockPending: "Locking...",
        btnLocked: "✅ Tokens Locked",
        btnLockStep: "Step 2: Lock Tokens",
        approveSuccess: "✨ Approval successful. Now you can lock your tokens!",
        lockSuccess: "✅ Operation completed. Tokens locked until ",
        errorTx: "There was an error in the transaction. Check MetaMask."
      }
    }
  },
  pt: {
    hero: {
      tag: "Construído na Base Mainnet",
      title: "Launchpad como um Serviço",
      subtitle: "Grau Institucional.",
      desc: "Lance seus projetos com segurança de elite. OrbitBase combina o poder de BASE com ferramentas de liquidez e factory de nível institucional.",
      btnExplore: "Explorar Projetos",
      btnDocs: "Documentação"
    },
    guide: {
      title: "Como funciona a OrbitBase",
      step1: {
        title: "1. Crie seu Token",
        desc: "Use a Token Factory para implantar seu contrato inteligente (Token padrão ou Memecoin) em segundos."
      },
      step2: {
        title: "2. Vincule sua Carteira",
        desc: "Conecte sua carteira para gerenciar seus ativos e receber chaves de proprietário de forma segura."
      },
      step3: {
        title: "3. Bloqueie Liquidez",
        desc: "Gere confiança bloqueando seus tokens LP por um período determinado usando nosso Liquidity Locker."
      },
      step4: {
        title: "4. Gerencie e Retire",
        desc: "Monitore a atividade em seu painel e recupere seus tokens após o vencimento do prazo de bloqueio."
      }
    },
    activity: {
      title: "Painel de Atividade",
      subtitle: "Monitore seus lançamentos e bloqueios de liquidez.",
      myActivity: "Minha Atividade",
      adminMode: "Modo Admin",
      noResults: "Nenhum movimento encontrado para os filtros selecionados.",
      syncing: "Sincronizando com a rede Base...",
      totalIncome: "Renda Total",
      tokensCreated: "Tokens Criados",
      locksCreated: "Bloqueios",
      configTitle: "Configurações da Plataforma",
      withdrawBtn: "Retirar Saldo",
      available: "Disponível",
      flatFeeLabel: "Taxa de Criação (Flat Fee)",
      recipientLabel: "Carteira Receptora de Comissões",
      updateBtn: "Atualizar",
      changeBtn: "Mudar",
      current: "Atual",
      table: {
        date: "Data",
        type: "Tipo",
        details: "Detalhes",
        creator: "Criador",
        quantity: "Quantidade / Suprimento"
      },
      token: "Token",
      memecoin: "Memecoin",
      lock: "Bloqueio",
      lockedLiq: "Liquidez Bloqueada",
      unlockDate: "Desbloqueio",
      unlockTime: "Hora",
      claimBtn: "Retirar Tokens 🔓",
      claimed: "RECLAMADO ✅",
      processing: "Processando...",
      locked: "Bloqueado 🔒",
      copyAddr: "Copiar Endereço",
      copyHash: "Copiar",
      copied: "Copiado",
      you: "(Você)"
    },
    footer: {
      infra: "Infraestrutura para BASE.",
      by: "por"
    },
    forms: {
      createToken: {
        title: "Lançar Novo Projeto",
        memecoin: "Memecoin (Fixo)",
        standard: "Token Padrão",
        nameLabel: "Nome do Projeto",
        namePlaceholder: "Ex: Base Moon Rocket",
        symbolLabel: "Símbolo",
        symbolPlaceholder: "Ex: MOON",
        supplyLabel: "Suprimento Inicial",
        btnConnect: "Conectar Carteira para continuar",
        btnPending: "Confirmando na Carteira...",
        btnConfirming: "Minerando transação...",
        btnCreate: "Criar",
        successTitle: "Token Implantado!",
        successDesc: "Seu contrato está ativo na rede.",
        contractAddr: "Endereço do Contrato",
        copyTitle: "Copiar endereço",
        txHash: "Hash da Transação",
        importNotice: "* Importe este endereço no MetaMask para interagir com seu token.",
        errorTitle: "Erro",
        errorRejected: "Transação cancelada pelo usuário.",
        errorFunds: "Fundos insuficientes ou erro de rede."
      },
      locker: {
        title: "Liquidity Locker",
        tokenLabel: "Endereço do Token (LP)",
        tokenPlaceholder: "0x...",
        amountLabel: "Quantidade",
        dateLabel: "Data de Desbloqueio",
        btnApprovePending: "Confirmando aprovação...",
        btnApproveStep: "Passo 1: Aprovar Tokens",
        btnLockPending: "Bloqueando...",
        btnLocked: "✅ Tokens Bloqueados",
        btnLockStep: "Passo 2: Bloquear Tokens",
        approveSuccess: "✨ Aprovação bem-sucedida. Agora você pode bloquear seus tokens!",
        lockSuccess: "✅ Operação concluída. Tokens bloqueados até ",
        errorTx: "Houve um erro na transação. Verifique o MetaMask."
      }
    }
  },
  fr: {
    hero: {
      tag: "Construit sur Base Mainnet",
      title: "Launchpad en tant que Service",
      subtitle: "Qualité Institutionnelle.",
      desc: "Lancez vos projets avec une sécurité d'élite. OrbitBase combine la puissance de BASE avec des outils de liquidité et de factory de qualité institutionnelle.",
      btnExplore: "Explorer les Projets",
      btnDocs: "Documentation"
    },
    guide: {
      title: "Comment fonctionne OrbitBase",
      step1: {
        title: "1. Créez votre Token",
        desc: "Utilisez la Token Factory pour déployer votre contrat intelligent (Token standard ou Memecoin) en quelques secondes."
      },
      step2: {
        title: "2. Liez votre Portefeuille",
        desc: "Connectez votre portefeuille pour gérer vos actifs et recevoir les clés de propriétaire en toute sécurité."
      },
      step3: {
        title: "3. Verrouillez la Liquidité",
        desc: "Générez la confiance en verrouillant vos jetons LP pour une période déterminée via notre Liquidity Locker."
      },
      step4: {
        title: "4. Gérez et Retirez",
        desc: "Surveillez l'activité depuis votre tableau de bord et récupérez vos jetons une fois le délai de verrouillage expiré."
      }
    },
    activity: {
      title: "Tableau de Bord d'Activité",
      subtitle: "Surveillez vos lancements et verrouillages de liquidité.",
      myActivity: "Mon Activité",
      adminMode: "Mode Admin",
      noResults: "Aucun mouvement trouvé pour les filtres sélectionnés.",
      syncing: "Synchronisation avec le réseau Base...",
      totalIncome: "Revenu Total",
      tokensCreated: "Tokens Créés",
      locksCreated: "Verrouillages",
      configTitle: "Paramètres de la Plateforme",
      withdrawBtn: "Retirer le Solde",
      available: "Disponible",
      flatFeeLabel: "Frais de Création (Flat Fee)",
      recipientLabel: "Portefeuille Destinataire des Commissions",
      updateBtn: "Mettre à jour",
      changeBtn: "Changer",
      current: "Actuel",
      table: {
        date: "Date",
        type: "Type",
        details: "Détails",
        creator: "Créateur",
        quantity: "Quantité / Offre"
      },
      token: "Token",
      memecoin: "Memecoin",
      lock: "Verrouillage",
      lockedLiq: "Liquidité Verrouillée",
      unlockDate: "Déverrouillage",
      unlockTime: "Heure",
      claimBtn: "Retirer les Tokens 🔓",
      claimed: "RÉCLAMÉ ✅",
      processing: "Traitement...",
      locked: "Verrouillé 🔒",
      copyAddr: "Copier l'Adresse",
      copyHash: "Copier",
      copied: "Copié",
      you: "(Vous)"
    },
    footer: {
      infra: "Infrastructure pour BASE.",
      by: "par"
    },
    forms: {
      createToken: {
        title: "Lancer un nouveau projet",
        memecoin: "Memecoin (Fixe)",
        standard: "Token Standard",
        nameLabel: "Nom du projet",
        namePlaceholder: "Ex: Base Moon Rocket",
        symbolLabel: "Symbole",
        symbolPlaceholder: "Ex: MOON",
        supplyLabel: "Offre Initiale",
        btnConnect: "Connecter le portefeuille pour continuer",
        btnPending: "Confirmation dans le portefeuille...",
        btnConfirming: "Minage de la transaction...",
        btnCreate: "Créer",
        successTitle: "Token Déployé !",
        successDesc: "Votre contrat est en ligne sur le réseau.",
        contractAddr: "Adresse du contrat",
        copyTitle: "Copier l'adresse",
        txHash: "Hash de transaction",
        importNotice: "* Importez cette adresse dans MetaMask pour interagir avec votre token.",
        errorTitle: "Erreur",
        errorRejected: "Transaction annulée par l'utilisateur.",
        errorFunds: "Fonds insuffisants ou erreur de réseau."
      },
      locker: {
        title: "Liquidity Locker",
        tokenLabel: "Adresse du Token (LP)",
        tokenPlaceholder: "0x...",
        amountLabel: "Quantité",
        dateLabel: "Date de déverrouillage",
        btnApprovePending: "Confirmation de l'approbation...",
        btnApproveStep: "Étape 1 : Approuver les jetons",
        btnLockPending: "Verrouillage...",
        btnLocked: "✅ Jetons Verrouillés",
        btnLockStep: "Étape 2 : Verrouiller les jetons",
        approveSuccess: "✨ Approbation réussie. Vous pouvez maintenant verrouiller vos jetons !",
        lockSuccess: "✅ Opération terminée. Jetons verrouillés jusqu'au ",
        errorTx: "Une erreur est survenue dans la transaction. Vérifiez MetaMask."
      }
    }
  }
};
