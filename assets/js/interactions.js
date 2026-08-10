/**
 * Interações com o mouse — Realiza Consultoria
 * Spotlight, tilt 3D nos cards e botões magnéticos.
 * Respeita prefers-reduced-motion e dispositivos touch.
 */
function canAnimate() {
  return (
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function initMouseInteractions() {
  if (!canAnimate()) return;

  initHeroSpotlight();
  initTiltCards();
  initMagneticButtons();
  initParallaxVisual();
}

function initHeroSpotlight() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  let frame = 0;
  let targetX = 50;
  let targetY = 50;
  let currentX = 50;
  let currentY = 50;

  const tick = () => {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    hero.style.setProperty("--mouse-x", `${currentX}%`);
    hero.style.setProperty("--mouse-y", `${currentY}%`);
    frame = requestAnimationFrame(tick);
  };

  hero.addEventListener(
    "pointermove",
    (event) => {
      const rect = hero.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width) * 100;
      targetY = ((event.clientY - rect.top) / rect.height) * 100;
      if (!frame) frame = requestAnimationFrame(tick);
    },
    { passive: true }
  );

  hero.addEventListener("pointerleave", () => {
    targetX = 50;
    targetY = 40;
  });
}

function initTiltCards() {
  const cards = document.querySelectorAll("[data-tilt]");
  if (!cards.length) return;

  cards.forEach((card) => {
    let frame = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const animate = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      card.style.transform = `perspective(900px) rotateX(${cy}deg) rotateY(${cx}deg) translateY(-4px)`;
      frame = requestAnimationFrame(animate);
    };

    card.addEventListener(
      "pointermove",
      (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        tx = (px - 0.5) * 10;
        ty = (0.5 - py) * 8;
        if (!frame) frame = requestAnimationFrame(animate);
      },
      { passive: true }
    );

    card.addEventListener("pointerleave", () => {
      tx = 0;
      ty = 0;
      const settle = () => {
        cx += (0 - cx) * 0.15;
        cy += (0 - cy) * 0.15;
        card.style.transform = `perspective(900px) rotateX(${cy}deg) rotateY(${cx}deg)`;
        if (Math.abs(cx) > 0.05 || Math.abs(cy) > 0.05) {
          requestAnimationFrame(settle);
        } else {
          card.style.transform = "";
          cancelAnimationFrame(frame);
          frame = 0;
        }
      };
      requestAnimationFrame(settle);
    });
  });
}

function initMagneticButtons() {
  const buttons = document.querySelectorAll("[data-magnetic]");
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener(
      "pointermove",
      (event) => {
        const rect = btn.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`;
      },
      { passive: true }
    );

    btn.addEventListener("pointerleave", () => {
      btn.style.transform = "";
    });
  });
}

function initParallaxVisual() {
  const visual = document.querySelector("[data-parallax]");
  if (!visual) return;

  const parent = visual.closest(".hero") || visual.parentElement;
  if (!parent) return;

  parent.addEventListener(
    "pointermove",
    (event) => {
      const rect = parent.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 16;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 12;
      visual.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    },
    { passive: true }
  );

  parent.addEventListener("pointerleave", () => {
    visual.style.transform = "";
  });
}
