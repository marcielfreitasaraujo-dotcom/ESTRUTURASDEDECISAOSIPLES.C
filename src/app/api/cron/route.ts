import { NextResponse } from "next/server";
import { runScheduledJob, type JobName } from "@/server/jobs";

const JOBS = new Set<JobName>([
  "expire-coupons",
  "process-subscriptions",
  "send-reminders",
  "cleanup-temp",
  "maintenance",
]);

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const name = (url.searchParams.get("job") ?? "maintenance") as JobName;
  if (!JOBS.has(name)) {
    return NextResponse.json({ error: "Unknown job" }, { status: 400 });
  }
  await runScheduledJob(name);
  return NextResponse.json({ ok: true, job: name });
}
