import cron, { ScheduledTask } from "node-cron";
import { generateMonthlyBills } from "../services/billing-scheduler.service";

let billingCronJob: ScheduledTask | null = null;

/**
 * Verifica se hoje é o último dia do mês
 */
function isLastDayOfMonth(): boolean {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Se amanhã é dia 1, hoje é o último dia do mês
  return tomorrow.getDate() === 1;
}

/**
 * Obtém o próximo mês e ano para gerar as cobranças
 */
function getNextMonth(): { month: number; year: number } {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  
  return {
    month: nextMonth.getMonth() + 1, // 1-12
    year: nextMonth.getFullYear(),
  };
}

/**
 * Executa a geração de cobranças mensais
 */
async function executeBillingGeneration() {
  try {
    console.log("[BillingScheduler] Iniciando geração de cobranças mensais...");
    
    const { month, year } = getNextMonth();
    console.log(
      `[BillingScheduler] Gerando cobranças para ${month}/${year}`
    );

    const result = await generateMonthlyBills(month, year);

    console.log(
      `[BillingScheduler] Geração concluída: ${result.created} criadas, ${result.duplicates} duplicadas, ${result.errors} erros`
    );

    if (result.errors > 0) {
      console.error(
        `[BillingScheduler] Erros encontrados:`,
        result.errorDetails
      );
    }
  } catch (error) {
    console.error("[BillingScheduler] Erro ao executar geração de cobranças:", error);
  }
}

/**
 * Inicializa o cron job para gerar cobranças mensais
 * Executa diariamente às 23:59 e verifica se é o último dia do mês
 */
export function startBillingScheduler() {
  if (billingCronJob) {
    console.log("[BillingScheduler] Cron job já está em execução");
    return;
  }

  // Executa diariamente às 23:59
  // Verifica internamente se é o último dia do mês
  billingCronJob = cron.schedule("59 23 * * *", async () => {
    if (isLastDayOfMonth()) {
      await executeBillingGeneration();
    } else {
      console.log(
        `[BillingScheduler] Não é o último dia do mês. Próxima verificação: amanhã às 23:59`
      );
    }
  });

  console.log(
    "[BillingScheduler] Cron job configurado: executa diariamente às 23:59 (gera cobranças no último dia do mês)"
  );
}

/**
 * Para o cron job de geração de cobranças
 */
export function stopBillingScheduler() {
  if (billingCronJob) {
    billingCronJob.stop();
    billingCronJob = null;
    console.log("[BillingScheduler] Cron job parado");
  }
}

