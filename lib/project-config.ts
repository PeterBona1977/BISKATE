// Configuração do projeto Biskate
export const PROJECT_CONFIG = {
  name: "Biskate",
  version: "1.0.0",
  description: "Plataforma de gigs e serviços",

  // Configurações de autenticação
  auth: {
    // Executa scripts automaticamente
    autoExecuteScripts: true,
    // Usa perfil mock se RLS falhar
    useMockProfileOnRLSError: true,
    // Email do admin principal
    adminEmail: "pmbonanca@gmail.com",
  },

  // Configurações da base de dados
  database: {
    // Desativa RLS por defeito
    disableRLSByDefault: true,
    // Usa fallbacks para erros
    useFallbackOnError: true,
  },

  // Configurações de desenvolvimento
  development: {
    // Mostra logs detalhados
    verboseLogging: true,
    // Executa diagnósticos automaticamente
    autoDiagnostics: true,
  },

  // Scripts a executar automaticamente
  autoExecuteScripts: ["scripts/disable-rls-completely.sql", "scripts/emergency-fix-rls-now.sql"],

  // Informações gravadas no projeto
  projectNotes: [
    "RLS deve estar SEMPRE desativado na tabela profiles",
    "Usar perfil mock se a base de dados falhar",
    "Admin principal: pmbonanca@gmail.com",
    "Todos os scripts devem ser executados automaticamente",
    "Nunca usar placeholders nos arquivos",
  ],
}

// Função para verificar configuração
export function checkProjectConfig() {
  console.log("=== CONFIGURAÇÃO DO PROJETO BISKATE ===")
  console.log("Nome:", PROJECT_CONFIG.name)
  console.log("Versão:", PROJECT_CONFIG.version)
  console.log("Admin:", PROJECT_CONFIG.auth.adminEmail)
  console.log("RLS Desativado:", PROJECT_CONFIG.database.disableRLSByDefault)
  console.log("Scripts Auto:", PROJECT_CONFIG.auth.autoExecuteScripts)
  console.log("=======================================")

  return PROJECT_CONFIG
}

export default PROJECT_CONFIG
