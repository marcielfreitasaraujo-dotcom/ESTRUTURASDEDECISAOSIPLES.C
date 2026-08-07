/**
 * Horizonte Correspondente — scripts principais
 */
import { initNav } from "./nav.js";
import { initReveal } from "./animations.js";
import { initContactForm } from "./form.js";

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initReveal();
  initContactForm();
});