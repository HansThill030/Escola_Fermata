(function () {
  const USER = "fermata";
  const PASS = "tiago2025";
  const LOCK_KEY = "fermata_admin_lock_until";
  const ATTEMPTS_KEY = "fermata_admin_attempts";
  const SESSION_KEY = "fermata_admin_session";
  const storageKey = window.FermataAdminStorageKey || "fermata_admin_data";
  const defaults = window.FermataAdminDefaults;

  const loginScreen = document.querySelector("[data-admin-login]");
  const panel = document.querySelector("[data-admin-panel]");
  const form = document.querySelector("[data-login-form]");
  const userInput = document.querySelector("#admin-user");
  const passInput = document.querySelector("#admin-pass");
  const error = document.querySelector("[data-login-error]");
  const lockMessage = document.querySelector("[data-lock-message]");
  const togglePass = document.querySelector("[data-toggle-pass]");
  const logout = document.querySelector("[data-logout]");
  const toast = document.querySelector("[data-toast]");
  let lockTimer;

  // --- Garantir estado inicial visível via display (não via hidden) ---
  if (loginScreen) loginScreen.style.display = "grid";
  if (panel) panel.style.display = "none";

  function readData() {
    if (window.FermataGetAdminData) return window.FermataGetAdminData();
    return defaults || { links: {}, products: [], prices: {} };
  }

  function writeData(data) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn("Erro ao salvar dados:", e);
    }
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  // --- Usa style.display em vez de .hidden para evitar conflito com CSS ---
  function setLoggedIn(isLoggedIn) {
    document.body.classList.toggle("is-admin-authenticated", isLoggedIn);

    if (loginScreen) loginScreen.style.display = isLoggedIn ? "none" : "grid";
    if (panel) panel.style.display = isLoggedIn ? "block" : "none";

    if (isLoggedIn) {
      sessionStorage.setItem(SESSION_KEY, "true");
      renderPanel();
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  function getLockUntil() {
    return Number(localStorage.getItem(LOCK_KEY) || 0);
  }

  function updateLockState() {
    const remaining = Math.ceil((getLockUntil() - Date.now()) / 1000);
    const isLocked = remaining > 0;

    if (form) {
      form.querySelectorAll("input, button").forEach((control) => {
        control.disabled = isLocked;
      });
    }

    if (lockMessage) {
      lockMessage.textContent = isLocked
        ? `Acesso bloqueado. Tente novamente em ${remaining}s.`
        : "";
    }

    if (!isLocked && lockTimer) {
      clearInterval(lockTimer);
      lockTimer = null;
      localStorage.removeItem(LOCK_KEY);
      localStorage.removeItem(ATTEMPTS_KEY);
    }
  }

  function startLockTimer() {
    updateLockState();
    if (!lockTimer) {
      lockTimer = window.setInterval(updateLockState, 1000);
    }
  }

  function registerFailedAttempt() {
    const attempts = Number(localStorage.getItem(ATTEMPTS_KEY) || 0) + 1;
    localStorage.setItem(ATTEMPTS_KEY, String(attempts));

    if (attempts >= 3) {
      localStorage.setItem(LOCK_KEY, String(Date.now() + 60000));
      if (error) error.textContent = "";
      startLockTimer();
      return;
    }

    if (error) {
      error.textContent = `Credenciais inválidas. Tentativa ${attempts} de 3.`;
    }
  }

  function inputCell(value, type, attrs) {
    const safe = String(value || "").replace(/"/g, "&quot;");
    return `<input type="${type || "text"}" value="${safe}" ${attrs || ""}>`;
  }

  function renderProducts(data) {
    const rows = document.querySelector("[data-products-rows]");
    if (!rows || !Array.isArray(data.products)) return;
    rows.innerHTML = data.products
      .map(
        (product) => `
      <tr data-product-row="${product.id}">
        <td><strong>${product.name}</strong></td>
        <td><textarea data-field="description">${product.description || ""}</textarea></td>
        <td>${inputCell(product.link, "url", 'data-field="link"')}</td>
        <td>${inputCell(product.price, "text", 'data-field="price"')}</td>
        <td><button class="btn btn-primary admin-save-row" type="button">Salvar</button></td>
      </tr>`
      )
      .join("");
  }

  function renderLinks(data) {
    const rows = document.querySelector("[data-links-rows]");
    const labels = {
      whatsapp: "WhatsApp (CTA principal)",
      hotmart: "Hotmart (Curso Toque de Casa)",
      community: "Comunidade (Mercado Pago)",
      postPurchaseGroup: "Link pós-compra – Grupo WhatsApp",
      instagram: "Instagram",
      youtube: "YouTube",
      email: "E-mail",
    };
    if (!rows) return;
    rows.innerHTML = Object.entries(labels)
      .map(
        ([key, label]) => `
      <tr data-link-row="${key}">
        <td><strong>${label}</strong></td>
        <td>${inputCell(
          (data.links || {})[key] || "",
          key === "email" ? "email" : "url",
          'data-field="value"'
        )}</td>
        <td><button class="btn btn-primary admin-save-row" type="button">Salvar</button></td>
      </tr>`
      )
      .join("");
  }

  function renderPrices(data) {
    const rows = document.querySelector("[data-prices-rows]");
    const items = [
      ['Curso "Toque de Casa"', "courseOriginal", "courseCurrent"],
      ["Comunidade Fermata", "communityOriginal", "communityCurrent"],
      ["Apostila 1 – Teoria", "apostila1Original", "apostila1Current"],
      ["Apostila 2 – Leitura", "apostila2Original", "apostila2Current"],
      ["Livro de Repertório", "repertorioOriginal", "repertorioCurrent"],
    ];
    if (!rows) return;
    rows.innerHTML = items
      .map(
        ([label, originalKey, currentKey]) => `
      <tr data-price-row>
        <td><strong>${label}</strong></td>
        <td>${inputCell(
          (data.prices || {})[originalKey] || "",
          "text",
          `data-price-key="${originalKey}"`
        )}</td>
        <td>${inputCell(
          (data.prices || {})[currentKey] || "",
          "text",
          `data-price-key="${currentKey}"`
        )}</td>
        <td><button class="btn btn-primary admin-save-row" type="button">Salvar</button></td>
      </tr>`
      )
      .join("");
  }

  function renderPanel() {
    const data = readData();
    renderProducts(data);
    renderLinks(data);
    renderPrices(data);
  }

  // --- Tabs e botões de salvar ---
  document.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-admin-tab]");
    if (tab) {
      document.querySelectorAll("[data-admin-tab]").forEach((item) =>
        item.classList.toggle("is-active", item === tab)
      );
      document.querySelectorAll("[data-admin-section]").forEach((section) => {
        section.style.display =
          section.dataset.adminSection === tab.dataset.adminTab ? "block" : "none";
      });
    }

    const rowButton = event.target.closest(".admin-save-row");
    if (rowButton) {
      const data = readData();
      const productRow = rowButton.closest("[data-product-row]");
      const linkRow = rowButton.closest("[data-link-row]");
      const priceRow = rowButton.closest("[data-price-row]");

      if (productRow) {
        const product = (data.products || []).find(
          (item) => item.id === productRow.dataset.productRow
        );
        if (product) {
          product.description =
            productRow.querySelector('[data-field="description"]')?.value || "";
          product.link = productRow.querySelector('[data-field="link"]')?.value || "";
          product.price = productRow.querySelector('[data-field="price"]')?.value || "";
        }
      }

      if (linkRow) {
        if (!data.links) data.links = {};
        data.links[linkRow.dataset.linkRow] =
          linkRow.querySelector('[data-field="value"]')?.value || "";
      }

      if (priceRow) {
        if (!data.prices) data.prices = {};
        priceRow.querySelectorAll("[data-price-key]").forEach((input) => {
          data.prices[input.dataset.priceKey] = input.value;
        });
      }

      writeData(data);
      showToast("✓ Salvo com sucesso!");
    }
  });

  togglePass?.addEventListener("click", () => {
    const isPassword = passInput.type === "password";
    passInput.type = isPassword ? "text" : "password";
    togglePass.textContent = isPassword ? "Ocultar" : "Mostrar";
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (getLockUntil() > Date.now()) {
      startLockTimer();
      return;
    }

    const enteredUser = userInput?.value?.trim() || "";
    const enteredPass = passInput?.value || "";

    if (enteredUser === USER && enteredPass === PASS) {
      localStorage.removeItem(ATTEMPTS_KEY);
      localStorage.removeItem(LOCK_KEY);
      if (error) error.textContent = "";
      setLoggedIn(true);
      return;
    }

    registerFailedAttempt();
  });

  logout?.addEventListener("click", () => setLoggedIn(false));

  // --- Inicialização ---
  // Reseta lock expirado ao carregar
  if (getLockUntil() > 0 && getLockUntil() <= Date.now()) {
    localStorage.removeItem(LOCK_KEY);
    localStorage.removeItem(ATTEMPTS_KEY);
  }

  if (getLockUntil() > Date.now()) {
    startLockTimer();
  }

  // Inicializa seções das abas via display
  document.querySelectorAll("[data-admin-section]").forEach((section, i) => {
    section.style.display = i === 0 ? "block" : "none";
  });

  // Restaura sessão se existir
  setLoggedIn(sessionStorage.getItem(SESSION_KEY) === "true");
})(); 
