/* ==========================================================================
   Catedral de São Jorge — Scripts compartilhados
   Navegação, animações, galeria, filtros, cópia e formulário de contato.
   ========================================================================== */

(function () {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const header = document.querySelector(".site-header");
  const nav = document.getElementById("mainNav");
  const navToggle = document.querySelector(".nav-toggle");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Navegação mobile ------------------------------------------------------ */
  function setNavPosition() {
    if (!header) return;
    const bottom = Math.max(0, header.getBoundingClientRect().bottom);
    root.style.setProperty("--nav-top", `${bottom}px`);
  }

  function closeNav() {
    if (!navToggle || !nav) return;
    navToggle.setAttribute("aria-expanded", "false");
    body.classList.remove("nav-open");
  }

  function openNav() {
    if (!navToggle || !nav) return;
    setNavPosition();
    navToggle.setAttribute("aria-expanded", "true");
    body.classList.add("nav-open");
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeNav();
      } else {
        openNav();
      }
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && body.classList.contains("nav-open")) {
        closeNav();
        navToggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (!body.classList.contains("nav-open")) return;
      if (nav.contains(event.target) || navToggle.contains(event.target)) return;
      closeNav();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 880) closeNav();
    });
  }

  /* Cabeçalho com sombra ao rolar ----------------------------------------- */
  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 18);
    if (body.classList.contains("nav-open")) setNavPosition();
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
  window.addEventListener("resize", setNavPosition);

  /* Animação de entrada --------------------------------------------------- */
  const revealItems = document.querySelectorAll(".reveal");

  if (revealItems.length) {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach(function (item) {
        item.classList.add("is-visible");
      });
    } else {
      const revealObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -42px 0px" }
      );

      revealItems.forEach(function (item) {
        revealObserver.observe(item);
      });
    }
  }

  /* Ano atual no rodapé --------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach(function (element) {
    element.textContent = new Date().getFullYear();
  });

  /* Galeria com lightbox -------------------------------------------------- */
  const galleryButtons = document.querySelectorAll("[data-gallery]");
  const lightbox = document.getElementById("lightbox");

  if (galleryButtons.length && lightbox) {
    const lightboxImage = lightbox.querySelector("[data-lightbox-image]");
    const lightboxCaption = lightbox.querySelector("[data-lightbox-caption]");
    const closeButton = lightbox.querySelector("[data-lightbox-close]");
    let lastFocused = null;

    function openLightbox(button) {
      if (!lightboxImage) return;
      lastFocused = button;
      lightboxImage.src = button.getAttribute("data-gallery") || "";
      lightboxImage.alt = button.getAttribute("data-alt") || "";
      if (lightboxCaption) {
        lightboxCaption.textContent = button.getAttribute("data-caption") || "";
      }
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      if (closeButton) closeButton.focus();
    }

    function closeLightbox() {
      lightbox.hidden = true;
      document.body.style.overflow = "";
      if (lightboxImage) lightboxImage.removeAttribute("src");
      if (lastFocused) lastFocused.focus();
    }

    galleryButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        openLightbox(button);
      });
    });

    if (closeButton) closeButton.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", function (event) {
      if (lightbox.hidden) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "Tab") {
        event.preventDefault();
        if (closeButton) closeButton.focus();
      }
    });
  }

  /* Mensagens flutuantes -------------------------------------------------- */
  let toastTimer = null;

  function showToast(message) {
    let toast = document.getElementById("siteToast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "siteToast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      toast.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg><span></span>';
      document.body.appendChild(toast);
    }

    const label = toast.querySelector("span");
    if (label) label.textContent = message;

    window.clearTimeout(toastTimer);
    requestAnimationFrame(function () {
      toast.classList.add("is-visible");
    });

    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2800);
  }

  /* Copiar dados de doação ------------------------------------------------ */
  const copyButtons = document.querySelectorAll("[data-copy]");

  function fallbackCopy(text) {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    let copied = false;

    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }

    document.body.removeChild(helper);
    return copied;
  }

  copyButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const value = button.getAttribute("data-copy") || "";
      const message = button.getAttribute("data-copy-message") || "Dados copiados.";

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
          .writeText(value)
          .then(function () {
            showToast(message);
          })
          .catch(function () {
            if (fallbackCopy(value)) showToast(message);
          });
      } else if (fallbackCopy(value)) {
        showToast(message);
      }
    });
  });

  /* Filtros de notícias --------------------------------------------------- */
  const filterButtons = document.querySelectorAll("[data-filter]");

  if (filterButtons.length) {
    const filterCards = document.querySelectorAll("[data-category]");
    const emptyMessage = document.querySelector("[data-filter-empty]");

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const filter = button.getAttribute("data-filter");
        let visibleCount = 0;

        filterButtons.forEach(function (item) {
          item.setAttribute("aria-pressed", item === button ? "true" : "false");
        });

        filterCards.forEach(function (card) {
          const categories = (card.getAttribute("data-category") || "").split(" ");
          const visible = filter === "todos" || categories.indexOf(filter) !== -1;
          card.hidden = !visible;
          if (visible) visibleCount += 1;
        });

        if (emptyMessage) emptyMessage.hidden = visibleCount !== 0;
      });
    });
  }

  /* Formulário de contato (envio por e-mail) ------------------------------ */
  const contactForm = document.querySelector("[data-contact-form]");

  if (contactForm) {
    const status = contactForm.querySelector("[data-form-status]");

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      const data = new FormData(contactForm);
      const name = String(data.get("nome") || "").trim();
      const email = String(data.get("email") || "").trim();
      const phone = String(data.get("telefone") || "").trim();
      const subject = String(data.get("assunto") || "Contato pelo site");
      const message = String(data.get("mensagem") || "").trim();
      const destination = contactForm.getAttribute("data-mailto") || "";

      const bodyText = [
        `Nome: ${name}`,
        `E-mail: ${email}`,
        phone ? `Telefone: ${phone}` : "",
        "",
        message,
      ]
        .filter(Boolean)
        .join("\n");

      const mailto =
        `mailto:${destination}` +
        `?subject=${encodeURIComponent(`[Site] ${subject}`)}` +
        `&body=${encodeURIComponent(bodyText)}`;

      if (status) {
        status.hidden = false;
        status.textContent =
          "Abrindo seu aplicativo de e-mail com a mensagem preenchida. Se nada acontecer, escreva diretamente para " +
          destination +
          ".";
      }

      window.location.href = mailto;
    });
  }
})();
