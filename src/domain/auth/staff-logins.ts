export const STAFF_LOGINS = [
  { label: "Admin (você)", username: "admin", password: "Maciel.2004", landing: "/admin" },
  { label: "Gerente", username: "gerente", password: "Gerente!2026", landing: "/app" },
  { label: "Caixa", username: "caixa", password: "Caixa!2026", landing: "/caixa" },
  { label: "Garçom (celular)", username: "garcom", password: "Garcom!2026", landing: "/garcom" },
  { label: "Motoboy (celular)", username: "motoboy", password: "Entrega!2026", landing: "/entrega" },
] as const;

export type StaffLogin = (typeof STAFF_LOGINS)[number];
