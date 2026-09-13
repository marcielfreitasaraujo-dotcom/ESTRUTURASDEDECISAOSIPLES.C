import { prisma } from "@/lib/db";

export function normalizeLogin(raw: string) {
  return raw.trim().toLowerCase();
}

export function normalizeUsername(raw?: string | null) {
  const value = (raw ?? "").trim().toLowerCase();
  if (!value) return null;
  if (!/^[a-z0-9._-]{2,32}$/.test(value)) {
    throw new Error("Usuário inválido. Use letras, números, ponto ou hífen.");
  }
  return value;
}

export function isEmailLogin(value: string) {
  return value.includes("@");
}

export async function resolveLoginEmail(login: string): Promise<string | null> {
  const value = normalizeLogin(login);
  if (value.length < 2) return null;
  if (isEmailLogin(value)) {
    const user = await prisma.user.findUnique({ where: { email: value }, select: { email: true } });
    return user?.email ?? value;
  }
  const user = await prisma.user.findFirst({
    where: { username: value },
    select: { email: true },
  });
  return user?.email ?? null;
}
