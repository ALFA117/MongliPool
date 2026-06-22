export type Lang = "es" | "en";

export const translations = {
  // ─── Navbar ──────────────────────────────────────────────
  nav: {
    deposit: { es: "Depositar", en: "Deposit" },
    withdraw: { es: "Retirar", en: "Withdraw" },
    auditor: { es: "Auditor", en: "Auditor" },
    explorer: { es: "Explorador", en: "Explorer" },
    verify: { es: "Verificar", en: "Verify" },
    stats: { es: "Métricas", en: "Metrics" },
    status: { es: "Estado", en: "Status" },
    connectWallet: { es: "Conectar Wallet", en: "Connect Wallet" },
    connecting: { es: "Conectando…", en: "Connecting…" },
    disconnect: { es: "Desconectar", en: "Disconnect" },
  },

  // ─── Home ────────────────────────────────────────────────
  home: {
    badge: { es: "Verificado en Stellar", en: "Verified on Stellar" },
    heroTitle1: { es: "Tu dinero,", en: "Your money," },
    heroTitle2: { es: "tu secreto", en: "your secret" },
    heroSub: {
      es: "MongliPool es como una alcancía mágica: metes tu dinero por una puerta y lo sacas por otra. Nadie puede saber que las dos puertas son tuyas — pero un guardián de confianza puede verificar que todo es legítimo.",
      en: "MongliPool is like a magic piggy bank: you put your money in one door and take it out another. Nobody can tell both doors are yours — but a trusted guardian can verify everything is legit.",
    },
    ctaDeposit: { es: "Depositar fondos", en: "Deposit funds" },
    ctaWithdraw: { es: "Retirar fondos", en: "Withdraw funds" },

    // How it works
    howTitle: { es: "¿Cómo funciona?", en: "How does it work?" },
    howSub: { es: "Tres pasos. Sin lenguaje técnico.", en: "Three steps. No tech jargon." },
    step1Title: { es: "Depositas", en: "Deposit" },
    step1Desc: {
      es: "Pones tus fondos en el pool. Tu dispositivo genera un recibo secreto — como un ticket de guardarropa que solo tú tienes.",
      en: "You put your funds in the pool. Your device creates a secret receipt — like a coat check ticket only you have.",
    },
    step2Title: { es: "La magia ZK", en: "ZK Magic" },
    step2Desc: {
      es: "Cuando quieres retirar, tu dispositivo crea una prueba matemática que dice: 'soy dueño de un depósito' sin decir cuál. Como demostrar que tienes la llave sin mostrarla.",
      en: "When you want to withdraw, your device creates a math proof that says: 'I own a deposit' without saying which one. Like proving you have a key without showing it.",
    },
    step3Title: { es: "Retiras en privado", en: "Withdraw privately" },
    step3Desc: {
      es: "Los fondos llegan a cualquier dirección que elijas. Nadie puede conectar tu depósito con tu retiro. Tu privacidad queda intacta.",
      en: "Funds arrive at any address you choose. Nobody can connect your deposit to your withdrawal. Your privacy stays intact.",
    },

    // Compliance
    compTitle: { es: "Privado", en: "Private" },
    compAnd: { es: "y", en: "and" },
    compTitle2: { es: "Regulado", en: "Compliant" },
    compDesc: {
      es: "El ASP (Authorized Set Provider) de Mongli DAO verifica que cada depósito es legítimo. Un auditor autorizado puede ver los detalles con su llave de vista — nadie más.",
      en: "Mongli DAO's ASP (Authorized Set Provider) verifies every deposit is legit. An authorized auditor can see the details with their view key — nobody else.",
    },
    // Case study
    caseTitle: { es: "Un caso real", en: "A real case" },
    caseProblem: {
      es: "Sofía es tesorera de una DAO en Stellar. Cada mes paga a 15 contribuidores, pero cada pago es público: cualquiera puede ver cuánto gana cada persona, rastrear los fondos, y deducir la estructura salarial completa de la organización. Los contribuidores le han pedido privacidad, pero Sofía también necesita poder demostrarle al consejo del DAO que los fondos se usaron correctamente.",
      en: "Sofia is a DAO treasurer on Stellar. Every month she pays 15 contributors, but every payment is public: anyone can see how much each person earns, track the funds, and deduce the organization's entire salary structure. Contributors have asked for privacy, but Sofia also needs to prove to the DAO council that funds were used correctly.",
    },
    caseSolution: {
      es: "Con MongliPool, Sofía deposita los fondos en el pool. Cada contribuidor retira su pago a una dirección diferente — nadie puede conectar quién depositó con quién retiró. Pero si el consejo del DAO necesita auditar, el auditor autorizado usa su clave privada para ver el historial completo. Privacidad para los contribuidores. Transparencia para el consejo. Sin contradicción.",
      en: "With MongliPool, Sofia deposits funds into the pool. Each contributor withdraws their payment to a different address — nobody can connect who deposited with who withdrew. But if the DAO council needs to audit, the authorized auditor uses their private key to see the complete history. Privacy for contributors. Transparency for the council. No contradiction.",
    },
    caseProblemLabel: { es: "El problema", en: "The problem" },
    caseSolutionLabel: { es: "La solución", en: "The solution" },

    compItem1: { es: "Pruebas ZK verificadas on-chain en Soroban", en: "ZK proofs verified on-chain on Soroban" },
    compItem2: { es: "Sistema de auditoría con view key", en: "Audit system with view key" },
    compItem3: { es: "Doble gasto imposible por nullifier", en: "Double-spend impossible via nullifier" },
    compItem4: { es: "ASP de Mongli DAO controla el acceso", en: "Mongli DAO ASP controls access" },

    ctaBottom: { es: "¿Listo para proteger tu privacidad?", en: "Ready to protect your privacy?" },
    ctaBottomSub: { es: "Conecta tu wallet Freighter y empieza.", en: "Connect your Freighter wallet and start." },
    ctaAuditor: { es: "Soy Auditor", en: "I'm an Auditor" },
  },

  // ─── Deposit ─────────────────────────────────────────────
  deposit: {
    title: { es: "Depositar", en: "Deposit" },
    subtitle: {
      es: "Envía fondos al pool. Tu recibo privado se genera aquí — nunca sale de tu dispositivo.",
      en: "Send funds to the pool. Your private receipt is generated here — it never leaves your device.",
    },
    connectTitle: { es: "Conecta tu wallet", en: "Connect your wallet" },
    connectDesc: {
      es: "Necesitamos tu wallet Freighter para autorizar la transacción en Stellar. Tu dirección es pública; tu recibo permanece privado.",
      en: "We need your Freighter wallet to authorize the transaction on Stellar. Your address is public; your receipt stays private.",
    },
    connectBtn: { es: "Conectar Freighter", en: "Connect Freighter" },
    confirmTitle: { es: "Confirmar depósito", en: "Confirm deposit" },
    fixedAmount: { es: "Monto", en: "Amount" },
    from: { es: "Desde", en: "From" },
    important: { es: "Importante:", en: "Important:" },
    importantDesc: {
      es: "Se generará un recibo privado. Es la única forma de retirar tus fondos. Guárdalo en un lugar seguro.",
      en: "A private receipt will be generated. It's the only way to withdraw your funds. Keep it somewhere safe.",
    },
    depositBtn: { es: "Depositar 1 XLM", en: "Deposit 1 XLM" },
    generating: { es: "Preparando tu depósito", en: "Preparing your deposit" },
    generatingDesc: {
      es: "Generando tu recibo privado y enviando la transacción a Stellar…",
      en: "Generating your private receipt and sending the transaction to Stellar…",
    },
    successTitle: { es: "¡Depósito exitoso!", en: "Deposit successful!" },
    successDesc: {
      es: "Tus fondos están en el pool. Nadie puede ver quién depositó.",
      en: "Your funds are in the pool. Nobody can see who deposited.",
    },
    receiptTitle: { es: "Tu recibo privado", en: "Your private receipt" },
    receiptDesc: {
      es: "Este es el único modo de retirar tus fondos. Guárdalo como si fuera la llave de tu caja fuerte.",
      en: "This is the only way to withdraw your funds. Guard it like a safe deposit key.",
    },
    download: { es: "Descargar recibo", en: "Download receipt" },
    copy: { es: "Copiar", en: "Copy" },
    warning: {
      es: "Sin este recibo no podrás retirar tus fondos. No existe recuperación. Guárdalo en múltiples lugares seguros.",
      en: "Without this receipt you cannot withdraw your funds. There is no recovery. Save it in multiple safe places.",
    },
    errorConnect: { es: "Error al conectar wallet", en: "Error connecting wallet" },
    errorDeposit: { es: "Error al depositar", en: "Error depositing" },
  },

  // ─── Withdraw ────────────────────────────────────────────
  withdraw: {
    title: { es: "Retirar", en: "Withdraw" },
    subtitle: {
      es: "Pega tu recibo privado. La prueba ZK se genera en tu dispositivo — sin revelar tu identidad.",
      en: "Paste your private receipt. The ZK proof is generated on your device — without revealing your identity.",
    },
    receiptLabel: { es: "Recibo privado", en: "Private receipt" },
    receiptPlaceholder: { es: "Pega tu recibo privado aquí (empieza con eyJ…)", en: "Paste your private receipt here (starts with eyJ…)" },
    paste: { es: "Pegar desde portapapeles", en: "Paste from clipboard" },
    recipientLabel: { es: "Dirección de destino", en: "Destination address" },
    recipientPlaceholder: { es: "G… (puede ser diferente a tu wallet)", en: "G… (can be different from your wallet)" },
    recipientHelp: {
      es: "Los fondos llegarán aquí. Puede ser cualquier dirección Stellar.",
      en: "Funds will arrive here. Can be any Stellar address.",
    },
    howTitle: { es: "¿Cómo funciona?", en: "How does it work?" },
    howDesc: {
      es: "Tu dispositivo construirá una prueba matemática de que eres el dueño del depósito — sin revelar cuál depósito es tuyo. Esto puede tomar hasta 30 segundos.",
      en: "Your device will build a math proof that you own a deposit — without revealing which one is yours. This can take up to 30 seconds.",
    },
    proveBtn: { es: "Generar prueba y retirar", en: "Generate proof & withdraw" },
    provingTitle: { es: "Generando prueba ZK", en: "Generating ZK proof" },
    submittingTitle: { es: "Enviando al contrato…", en: "Submitting to contract…" },
    provingDesc: {
      es: "Estamos construyendo una prueba matemática que demuestra que eres el dueño del depósito, sin revelar cuál.",
      en: "We're building a math proof that you own the deposit, without revealing which one.",
    },
    successTitle: { es: "¡Retiro completado!", en: "Withdrawal complete!" },
    successDesc: {
      es: "Tu retiro fue procesado exitosamente. Nadie puede vincular esto a tu depósito.",
      en: "Your withdrawal was processed successfully. Nobody can link this to your deposit.",
    },
    fundsTo: { es: "Los fondos llegarán a", en: "Funds will arrive at" },
    fundsToSuffix: { es: "en los próximos segundos.", en: "in the next few seconds." },
    errorNotFound: {
      es: "El commitment no se encontró en el pool. ¿Es el recibo correcto?",
      en: "Commitment not found in the pool. Is this the right receipt?",
    },
    errorNoAsp: { es: "ASP root no disponible", en: "ASP root not available" },
    errorNoWallet: { es: "Wallet no conectada", en: "Wallet not connected" },
  },

  // ─── Auditor ─────────────────────────────────────────────
  auditor: {
    badge: { es: "Solo Auditor Autorizado", en: "Authorized Auditor Only" },
    title: { es: "Panel de Auditoría", en: "Audit Panel" },
    subtitle: {
      es: "Con la llave de vista de Mongli DAO puedes reconstruir el historial completo de transacciones del pool para cumplimiento regulatorio.",
      en: "With Mongli DAO's view key you can reconstruct the complete pool transaction history for regulatory compliance.",
    },
    viewKeyTitle: { es: "Clave privada del DAO", en: "DAO Private Key" },
    viewKeyWarning: {
      es: "Solo el auditor autorizado de Mongli DAO tiene esta clave privada Curve25519. El descifrado ocurre en tu navegador — nada se transmite a ningún servidor.",
      en: "Only Mongli DAO's authorized auditor has this Curve25519 private key. Decryption happens in your browser — nothing is transmitted to any server.",
    },
    viewKeyPlaceholder: { es: "Clave privada del DAO (hex, 64 caracteres)", en: "DAO private key (hex, 64 characters)" },
    decryptBtn: { es: "Descifrar transacciones", en: "Decrypt transactions" },
    decrypting: { es: "Descifrando…", en: "Decrypting…" },
    found: { es: "transacciones encontradas", en: "transactions found" },
    exportCsv: { es: "Exportar CSV", en: "Export CSV" },
    noTx: { es: "No hay transacciones en el pool todavía.", en: "No transactions in the pool yet." },
    colCommitment: { es: "Commitment", en: "Commitment" },
    colAmount: { es: "Monto", en: "Amount" },
    colDate: { es: "Fecha", en: "Date" },
    colStatus: { es: "Estado", en: "Status" },
    valid: { es: "Válido", en: "Valid" },
    errorDecrypt: { es: "Error descifrado", en: "Decrypt error" },
    errorKeyLength: {
      es: "La llave de vista debe tener 32 bytes (64 hex chars o base64)",
      en: "View key must be 32 bytes (64 hex chars or base64)",
    },
  },

  // ─── Status ──────────────────────────────────────────────
  status: {
    timeLeft: { es: "Tiempo restante al deadline", en: "Time remaining to deadline" },
    deadlinePassed: { es: "¡Deadline pasado!", en: "Deadline passed!" },
    days: { es: "días", en: "days" },
    overall: { es: "Progreso general", en: "Overall progress" },
    phases: { es: "Fases", en: "Phases" },
    phase: { es: "Fase", en: "Phase" },
    completed: { es: "Completado", en: "Completed" },
    inProgress: { es: "En progreso", en: "In progress" },
    pending: { es: "Pendiente", en: "Pending" },
    contracts: { es: "Contratos en Testnet", en: "Testnet Contracts" },
    links: { es: "Links", en: "Links" },
    pendingDeploy: { es: "Pendiente de deploy", en: "Pending deploy" },
    loadError: { es: "No se pudo cargar progress.json", en: "Could not load progress.json" },
  },
} as const;

export type TranslationKey = keyof typeof translations;