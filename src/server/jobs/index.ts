import { logger } from "@/lib/logger";

export type JobName =
  | "expire-coupons"
  | "process-subscriptions"
  | "send-reminders"
  | "cleanup-temp"
  | "maintenance";

export async function runScheduledJob(name: JobName) {
  logger.info("job.start", { name });
  if (name === "expire-coupons") {
    const { prisma } = await import("@/lib/db");
    await prisma.coupon.updateMany({
      where: { active: true, endsAt: { lt: new Date() } },
      data: { active: false },
    });
  }
  logger.info("job.finish", { name });
}
