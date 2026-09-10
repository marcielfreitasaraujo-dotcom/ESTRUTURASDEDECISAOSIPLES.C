export const STAFF_LOGINS = [
  { label: "Admin (você)", username: "admin", password: "Maciel.2004", landing: "/admin" },
  { label: "Dona", username: "dona", password: "CentralPizza!2026", landing: "/app" },
  { label: "Gerente", username: "gerente", password: "Gerente!2026", landing: "/app" },
  { label: "Caixa", username: "caixa", password: "Caixa!2026", landing: "/caixa" },
  { label: "Garçom", username: "garcom", password: "Garcom!2026", landing: "/garcom" },
  { label: "Cozinha", username: "cozinha", password: "Cozinha!2026", landing: "/app/cozinha" },
  { label: "Motoboy", username: "motoboy", password: "Entrega!2026", landing: "/entrega" },
  { label: "Apoio", username: "apoio", password: "Staff!2026", landing: "/garcom" },
] as const;

export type StaffLogin = (typeof STAFF_LOGINS)[number];
