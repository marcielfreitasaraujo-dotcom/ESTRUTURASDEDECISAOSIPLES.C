/**
 * Realiza Consultoria Caixa — scripts principais
 */
import { mountShell } from "./components.js";
import { initNav } from "./nav.js";
import { initReveal } from "./animations.js";
import { initContactForm } from "./form.js";
import { initFaq } from "./faq.js";

document.addEventListener("DOMContentLoaded", () => {
  mountShell();
  initNav();
  initReveal();
  initContactForm();
  initFaq();
});
