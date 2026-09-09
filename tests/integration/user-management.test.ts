import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { verifyPassword } from "better-auth/crypto";
import { addTeamMember, updateTeamMember } from "@/server/services/team";
import { createPlatformUser, updatePlatformUser } from "@/server/services/users";
import { ForbiddenError } from "@/lib/errors";

const prisma = new PrismaClient();
const suffix = `${Date.now()}`;

describe("admin e dono gerenciam logins", () => {
  let tenantId = "";
  let ownerId = "";
  let adminId = "";

  beforeAll(async () => {
    const tenant = await prisma.tenant.findUnique({ where: { slug: "central-da-pizza" } });
    const owner = await prisma.user.findUnique({ where: { email: "maria.s@example.com" } });
    const admin = await prisma.user.findUnique({ where: { email: "xavier.y@example.org" } });
    if (!tenant || !owner || !admin) throw new Error("Seed incompleto: rode npm run db:seed");
    tenantId = tenant.id;
    ownerId = owner.id;
    adminId = admin.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("dono cria funcionário e troca a senha", async () => {
    const email = `caixa.${suffix}@comandaia.test`;
    await addTeamMember({
      tenantId,
      actorRole: "OWNER",
      actorUserId: ownerId,
      name: "Caixa Novo",
      email,
      password: "CaixaNovo!2026",
      role: "CASHIER",
    });
    const created = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true, memberships: true },
    });
    expect(created?.memberships[0]?.role).toBe("CASHIER");
    const hash = created?.accounts.find((item) => item.providerId === "credential")?.password;
    expect(hash).toBeTruthy();
    await expect(verifyPassword({ hash: hash!, password: "CaixaNovo!2026" })).resolves.toBe(true);

    const membership = created!.memberships[0]!;
    await updateTeamMember({
      tenantId,
      actorRole: "OWNER",
      actorUserId: ownerId,
      membershipId: membership.id,
      name: "Caixa da Noite",
      email,
      password: "CaixaNoite!2026",
      role: "CASHIER",
    });
    const updated = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });
    expect(updated?.name).toBe("Caixa da Noite");
    const nextHash = updated?.accounts.find((item) => item.providerId === "credential")?.password;
    await expect(verifyPassword({ hash: nextHash!, password: "CaixaNoite!2026" })).resolves.toBe(true);
  });

  it("gerente não promove ninguém a dono", async () => {
    await expect(
      addTeamMember({
        tenantId,
        actorRole: "MANAGER",
        actorUserId: ownerId,
        name: "Invasor",
        email: `invasor.${suffix}@comandaia.test`,
        password: "Invasor!2026",
        role: "OWNER",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("admin cria usuário e altera o login", async () => {
    const email = `garcom.${suffix}@comandaia.test`;
    const user = await createPlatformUser({
      actorUserId: adminId,
      actorPlatformRole: "SUPER_ADMIN",
      name: "Garçom Extra",
      email,
      password: "GarcomExtra!2026",
      platformRole: "USER",
      tenantId,
      tenantRole: "WAITER",
    });
    const membership = await prisma.tenantMembership.findFirst({
      where: { userId: user.id, tenantId },
    });
    expect(membership?.role).toBe("WAITER");

    await updatePlatformUser({
      actorUserId: adminId,
      actorPlatformRole: "SUPER_ADMIN",
      userId: user.id,
      name: "Garçom da Noite",
      email,
      password: "GarcomNoite!2026",
      platformRole: "USER",
    });
    const updated = await prisma.user.findUnique({
      where: { id: user.id },
      include: { accounts: true },
    });
    expect(updated?.name).toBe("Garçom da Noite");
    const hash = updated?.accounts.find((item) => item.providerId === "credential")?.password;
    await expect(verifyPassword({ hash: hash!, password: "GarcomNoite!2026" })).resolves.toBe(true);
  });
});
