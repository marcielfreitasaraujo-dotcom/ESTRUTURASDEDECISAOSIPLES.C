/* Prévia da foto e redução no aparelho antes do envio (fotos de celular são
   grandes). Se algo falhar, o arquivo original segue e o servidor valida. */
(() => {
  const form = document.querySelector("[data-foto-form]");
  if (!form) return;
  const campo = form.querySelector("input[type=file]");
  const botao = form.querySelector("button[type=submit]");
  const aviso = document.querySelector("[data-foto-aviso]");
  const previa = document.querySelector("[data-foto-previa]");
  const textoAviso = aviso.textContent;
  const LIMITE = 7 * 1024 * 1024;
  const MAIOR_LADO = 800;

  const reduzir = async (arquivo) => {
    const img = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
    const escala = Math.min(1, MAIOR_LADO / Math.max(img.width, img.height));
    const tela = document.createElement("canvas");
    tela.width = Math.max(1, Math.round(img.width * escala));
    tela.height = Math.max(1, Math.round(img.height * escala));
    const ctx = tela.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, tela.width, tela.height);
    ctx.drawImage(img, 0, 0, tela.width, tela.height);
    const blob = await new Promise((ok) => tela.toBlob(ok, "image/jpeg", 0.9));
    const novo = new File([blob], "foto.jpg", { type: "image/jpeg" });
    const dt = new DataTransfer();
    dt.items.add(novo);
    campo.files = dt.files;
    return novo;
  };

  campo.addEventListener("change", async () => {
    let arquivo = campo.files[0];
    aviso.textContent = textoAviso;
    if (!arquivo) return;
    botao.disabled = true;
    try {
      arquivo = await reduzir(arquivo);
      const img = document.createElement("img");
      img.className = "foto-perfil";
      img.alt = "Prévia da nova foto";
      img.src = URL.createObjectURL(arquivo);
      previa.querySelector("img")?.remove();
      previa.append(img);
      aviso.textContent = "Prévia pronta. Toque em Salvar foto para confirmar.";
    } catch (_erro) {
      if (arquivo.size > LIMITE) {
        campo.value = "";
        aviso.textContent = "Esta foto é grande demais. Escolha uma menor.";
      }
    } finally {
      botao.disabled = false;
    }
  });
})();
