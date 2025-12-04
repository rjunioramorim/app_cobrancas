import { startBillingScheduler } from "@/server/jobs/billing-scheduler";

let cronInitialized = false;

/**
 * Inicializa todos os cron jobs da aplicação
 * Deve ser chamado apenas uma vez durante a inicialização
 */
export function initializeCronJobs() {
  if (cronInitialized) {
    console.log("[CronInit] Cron jobs já foram inicializados");
    return;
  }

  // Inicializa o agendador de cobranças
  startBillingScheduler();

  cronInitialized = true;
  console.log("[CronInit] Todos os cron jobs foram inicializados");
}

// Inicializa automaticamente quando o módulo é importado (apenas no servidor)
if (typeof window === "undefined") {
  initializeCronJobs();
}

