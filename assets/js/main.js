/**
 * Realiza Consultoria Caixa — scripts principais
 */
import { mountShell } from "./components.js";
import { initNav } from "./nav.js";
import { initReveal } from "./animations.js";
import { initContactForm } from "./form.js";
import { initFaq } from "./faq.js";
import { initMouseInteractions } from "./interactions.js";

function boot() {
  mountShell();
  initNav();
  initReveal();
  initContactForm();
  initFaq();
  initMouseInteractions();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
