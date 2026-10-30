/* ==========================================================================
   Vela Digital — Catedral de São Jorge
   Controla a chama, a contagem regressiva de 60 minutos e a persistência
   do estado da vela com LocalStorage.
   ========================================================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "catedral-sao-jorge:vela-digital";
  const CANDLE_DURATION = 60 * 60 * 1000;
  const stage = document.getElementById("candleStage");
  const formWrap = document.getElementById("candleFormWrap");
  const confirmation = document.getElementById("candleConfirmation");
  const form = document.getElementById("prayerForm");
  const countdown = document.getElementById("candleCountdown");
  const progress = document.getElementById("candleProgress");
  const statusText = document.getElementById("candleStatusText");
  const confirmationMessage = document.getElementById("confirmationMessage");

  if (!stage || !formWrap || !confirmation || !form) return;

  let startedAt = readStartedAt();
  let ticker = null;
  let smokeTimeout = null;

  function safeGetItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeSetItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function safeRemoveItem(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      /* O navegador pode bloquear o armazenamento. A vela segue apenas nesta sessão. */
    }
  }

  function readStartedAt() {
    const raw = safeGetItem(STORAGE_KEY);
    if (!raw) return null;

    const timestamp = Number(raw);
    const elapsed = Date.now() - timestamp;

    if (
      !Number.isFinite(timestamp) ||
      timestamp <= 0 ||
      elapsed < -5000 ||
      elapsed >= CANDLE_DURATION
    ) {
      safeRemoveItem(STORAGE_KEY);
      return null;
    }

    return timestamp;
  }

  function formatRemaining(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function setLit(isLit) {
    stage.classList.toggle("is-lit", isLit);
    if (isLit) {
      stage.classList.remove("is-extinguished");
      window.clearTimeout(smokeTimeout);
    }
  }

  function showForm() {
    formWrap.hidden = false;
    confirmation.hidden = true;
    setLit(false);
    if (statusText) statusText.textContent = "Vela apagada";
  }

  function showConfirmation() {
    formWrap.hidden = true;
    confirmation.hidden = false;
    setLit(true);
    if (statusText) statusText.textContent = "Sua vela está acesa";
  }

  function updateCountdown() {
    if (!startedAt) return;

    const remaining = startedAt + CANDLE_DURATION - Date.now();

    if (remaining <= 0) {
      extinguishCandle();
      return;
    }

    if (countdown) {
      countdown.textContent = formatRemaining(remaining);
    }

    if (progress) {
      const percentage = Math.max(0, Math.min(100, (remaining / CANDLE_DURATION) * 100));
      progress.style.width = `${percentage}%`;
    }
  }

  function startTicker() {
    window.clearInterval(ticker);
    updateCountdown();
    ticker = window.setInterval(updateCountdown, 1000);
  }

  function extinguishCandle() {
    window.clearInterval(ticker);
    ticker = null;
    startedAt = null;
    safeRemoveItem(STORAGE_KEY);

    formWrap.hidden = false;
    confirmation.hidden = true;
    stage.classList.remove("is-lit");
    stage.classList.add("is-extinguished");

    if (statusText) statusText.textContent = "A vela foi apagada";

    if (countdown) countdown.textContent = "00:00";
    if (progress) progress.style.width = "0%";

    form.reset();

    smokeTimeout = window.setTimeout(function () {
      stage.classList.remove("is-extinguished");
    }, 6000);
  }

  function activateCandle(options) {
    const settings = options || {};
    startedAt = Date.now();

    if (!safeSetItem(STORAGE_KEY, String(startedAt))) {
      /* Sem persistência, a vela permanece acesa enquanto a página estiver aberta. */
    }

    showConfirmation();

    if (confirmationMessage) {
      if (settings.firstName) {
        confirmationMessage.textContent =
          `Sua oração foi registrada. Que São Jorge interceda por você, ${settings.firstName}!`;
      } else {
        confirmationMessage.textContent =
          "Sua oração foi registrada. Que São Jorge interceda por você!";
      }
    }

    if (progress) progress.style.width = "100%";
    startTicker();
    form.reset();
  }

  function restoreCandle() {
    if (!startedAt) {
      showForm();
      return;
    }

    showConfirmation();

    if (confirmationMessage) {
      confirmationMessage.textContent =
        "Sua oração foi registrada. Que São Jorge interceda por você!";
    }

    startTicker();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const nameField = form.querySelector('[name="nome"]');
    const fullName = nameField ? nameField.value.trim() : "";
    const firstName = fullName ? fullName.split(/\s+/)[0] : "";

    activateCandle({ firstName: firstName });
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && startedAt) {
      updateCountdown();
    }
  });

  window.addEventListener("storage", function (event) {
    if (event.key !== STORAGE_KEY) return;

    const stored = readStartedAt();

    if (!stored) {
      if (startedAt) extinguishCandle();
      return;
    }

    if (stored !== startedAt) {
      startedAt = stored;
      showConfirmation();
      startTicker();
    }
  });

  restoreCandle();
})();
