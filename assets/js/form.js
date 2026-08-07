export function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const success = form.querySelector("[data-form-success]");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const nome = String(data.get("nome") || "").trim();
    const telefone = String(data.get("telefone") || "").trim();
    const assunto = String(data.get("assunto") || "Atendimento");
    const mensagem = String(data.get("mensagem") || "").trim();

    if (!nome || !telefone) {
      form.reportValidity();
      return;
    }

    const texto = [
      `Olá! Meu nome é ${nome}.`,
      `Assunto: ${assunto}.`,
      mensagem ? `Mensagem: ${mensagem}` : "",
      `Telefone: ${telefone}`,
    ]
      .filter(Boolean)
      .join(" ");

    const whatsapp = form.dataset.whatsapp || "5599984681048";
    const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(texto)}`;

    if (success) {
      success.classList.add("is-visible");
      success.textContent =
        "Quase lá! Vamos abrir o WhatsApp para você finalizar o atendimento.";
    }

    window.open(url, "_blank", "noopener,noreferrer");
    form.reset();
  });
}