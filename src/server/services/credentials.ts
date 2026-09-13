import { hashPassword } from "better-auth/crypto";
import { prisma } from "@/lib/db";

export async function setCredentialPassword(userId: string, password: string) {
  const trimmed = password.trim();
  if (trimmed.length < 8) {
    throw new Error("A senha precisa ter pelo menos 8 caracteres.");
  }
  const hash = await hashPassword(trimmed);
  const existing = await prisma.account.findFirst({
    where: { userId, providerId: "credential" },
  });
  if (existing) {
    await prisma.account.update({ where: { id: existing.id }, data: { password: hash } });
    return;
  }
  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: hash,
    },
  });
}
