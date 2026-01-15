// Definições de gatilhos disponíveis
// Este arquivo contém apenas constantes e pode ser importado com segurança no client-side
export const AVAILABLE_TRIGGERS = [
  {
    value: "gig_created",
    label: "Novo Biskate Criado",
    description: "Quando um utilizador cria um novo biskate",
    variables: ["{gig_title}", "{user_name}", "{platform_name}"],
  },
  {
    value: "gig_approved",
    label: "Biskate Aprovado",
    description: "Quando um admin aprova um biskate",
    variables: ["{gig_title}", "{user_name}", "{platform_name}"],
  },
  {
    value: "gig_rejected",
    label: "Biskate Rejeitado",
    description: "Quando um admin rejeita um biskate",
    variables: ["{gig_title}", "{user_name}", "{rejection_reason}", "{platform_name}"],
  },
  {
    value: "response_received",
    label: "Nova Resposta Recebida",
    description: "Quando um biskate recebe uma nova resposta",
    variables: ["{gig_title}", "{user_name}", "{platform_name}"],
  },
  {
    value: "response_accepted",
    label: "Resposta Aceite",
    description: "Quando uma resposta a um biskate é aceite",
    variables: ["{gig_title}", "{user_name}", "{platform_name}"],
  },
  {
    value: "contact_viewed",
    label: "Contacto Visualizado",
    description: "Quando alguém visualiza um contacto",
    variables: ["{gig_title}", "{user_name}", "{platform_name}"],
  },
  {
    value: "user_registered",
    label: "Novo Utilizador (Registo)",
    description: "Quando um novo utilizador se regista (Enviar Verificação)",
    variables: ["{user_name}", "{user_email}", "{platform_name}"],
  },
  {
    value: "email_verified",
    label: "Email Verificado (Welcome)",
    description: "Quando o email do utilizador é verificado",
    variables: ["{user_name}", "{user_email}", "{platform_name}"],
  },
  {
    value: "sensitive_content_detected",
    label: "Conteúdo Sensível Detectado",
    description: "Quando é detectado conteúdo sensível",
    variables: ["{user_name}", "{content_type}", "{detected_patterns}", "{platform_name}"],
  },
  {
    value: "feedback_received",
    label: "Novo Feedback Recebido",
    description: "Quando é recebido novo feedback",
    variables: ["{user_name}", "{category}", "{subject}", "{platform_name}"],
  },
  {
    value: "multiple_login_failures",
    label: "Múltiplas Tentativas de Login Falhadas",
    description: "Quando há múltiplas tentativas de login falhadas",
    variables: ["{user_email}", "{attempt_count}", "{ip_address}", "{platform_name}"],
  },
  {
    value: "credit_used",
    label: "Crédito de Resposta Utilizado",
    description: "Quando um crédito de resposta é utilizado",
    variables: ["{user_name}", "{gig_title}", "{credits_used}", "{platform_name}"],
  },
  {
    value: "gig_completed",
    label: "Biskate Concluído",
    description: "Quando um biskate é marcado como concluído",
    variables: ["{gig_title}", "{client_name}", "{provider_name}", "{platform_name}"],
  },
  {
    value: "provider_application_submitted",
    label: "Nova Candidatura de Prestador",
    description: "Quando um utilizador submete candidatura para ser prestador",
    variables: ["{user_name}", "{user_email}", "{platform_name}"],
  },
  {
    value: "admin_provider_application",
    label: "Admin: Nova Candidatura",
    description: "Alerta para administradores sobre nova candidatura",
    variables: ["{user_name}", "{user_email}", "{platform_name}"],
  },
  {
    value: "admin_feedback_received",
    label: "Admin: Novo Feedback",
    description: "Alerta para administradores sobre novo feedback",
    variables: ["{user_name}", "{category}", "{subject}", "{platform_name}"],
  },
  {
    value: "admin_moderation_alert",
    label: "Admin: Alerta de Moderação",
    description: "Alerta para administradores sobre conteúdo sensível",
    variables: ["{user_name}", "{content_type}", "{detected_patterns}", "{platform_name}"],
  },
];

// Definições de canais disponíveis
export const AVAILABLE_CHANNELS = [
  {
    value: "app",
    label: "Notificação na App",
    icon: "📱",
    description: "Mensagem dentro da plataforma",
    enabled: true,
  },
  {
    value: "email",
    label: "Email",
    icon: "📧",
    description: "Envio por email",
    enabled: true,
  },
  {
    value: "push",
    label: "Push Notification",
    icon: "🔔",
    description: "Notificação push (Firebase)",
    enabled: true,
  },
  {
    value: "sms",
    label: "SMS",
    icon: "💬",
    description: "Envio por SMS (Em breve)",
    enabled: false, // Desativado conforme solicitado
  },
]

// Definições de destinatários disponíveis
export const AVAILABLE_RECIPIENTS = [
  {
    value: "admin",
    label: "Administradores",
    icon: "👑",
    description: "Todos os utilizadores com role admin",
  },
  {
    value: "client",
    label: "Cliente Específico",
    icon: "👤",
    description: "O cliente relacionado com a ação (dinâmico)",
  },
  {
    value: "provider",
    label: "Prestador Específico",
    icon: "🔧",
    description: "O prestador relacionado com a ação (dinâmico)",
  },
  {
    value: "all_clients",
    label: "Todos os Clientes",
    icon: "👥",
    description: "Todos os utilizadores que criam gigs",
  },
  {
    value: "all_providers",
    label: "Todos os Prestadores",
    icon: "🛠️",
    description: "Todos os utilizadores que respondem a gigs",
  },
  {
    value: "all_users",
    label: "Todos os Utilizadores",
    icon: "🌍",
    description: "Todos os utilizadores registados",
  },
]
