(function () {
  const USER = "fermata";
  const PASS = "tiago2025";
  const LOCK_KEY = "fermata_admin_lock_until";
  const ATTEMPTS_KEY = "fermata_admin_attempts";
  const SESSION_KEY = "fermata_admin_session";
  const storageKey = window.FermataAdminStorageKey || "fermata_admin_data";
  const photosStorageKey = window.FermataPhotosStorageKey || "fermata_admin_photos";
  const defaults = window.FermataAdminDefaults;
  const photoItems = [
    ["Início", "home-hero", "Foto principal do hero", "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=1200&q=82"],
    ["Aulas", "aulas-hero", "Foto do hero da página de aulas", "https://images.unsplash.com/photo-1499415479124-43c32433a620?auto=format&fit=crop&w=1000&q=82"],
    ["Aulas", "aulas-professor", "Foto do Prof. Tiago", "https://images.unsplash.com/photo-1511551203524-9a24350a5771?auto=format&fit=crop&w=900&q=82"],
    ["Curso", "curso-hero", "Foto do hero do curso", "https://images.unsplash.com/photo-1485278537138-4e8911a13c02?auto=format&fit=crop&w=1000&q=82"],
    ["Materiais", "materiais-hero", "Foto do hero de materiais", "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=82"],
    ["Contato", "contato-hero", "Foto do hero de contato", "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1000&q=82"],
    ["Carrossel", "sarau-1", "Foto 1 do carrossel (Sarau)", "https://images.unsplash.com/photo-1514119412350-e174d90d280e?auto=format&fit=crop&w=1000&q=82"],
    ["Carrossel", "sarau-2", "Foto 2 do carrossel (Sarau)", "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1000&q=82"],
    ["Carrossel", "sarau-3", "Foto 3 do carrossel (Sarau)", "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1000&q=82"],
  ];

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
  let buyersCache = [];
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
      window.FermataApplyAdminData?.();
    } catch (e) {
      console.warn("Erro ao salvar dados:", e);
    }
  }

  function readPhotos() {
    if (window.FermataGetAdminPhotos) return window.FermataGetAdminPhotos();
    try {
      return JSON.parse(localStorage.getItem(photosStorageKey) || "{}");
    } catch (e) {
      console.warn("Erro ao ler fotos:", e);
      return {};
    }
  }

  function writePhotos(photos) {
    try {
      localStorage.setItem(photosStorageKey, JSON.stringify(photos));
      window.FermataApplyAdminPhotos?.();
    } catch (e) {
      console.warn("Erro ao salvar fotos:", e);
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

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderProducts(data) {
    const rows = document.querySelector("[data-products-rows]");
    if (!rows || !Array.isArray(data.products)) return;
    rows.innerHTML = data.products
      .map(
        (product) => `
      <tr data-product-row="${product.id}">
        <td>${inputCell(product.name, "text", 'data-field="name"')}</td>
        <td><textarea data-field="description">${product.description || ""}</textarea></td>
        <td>
          <select data-field="active">
            <option value="true" ${product.active === false ? "" : "selected"}>Ativo</option>
            <option value="false" ${product.active === false ? "selected" : ""}>Inativo</option>
          </select>
        </td>
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
      postPurchaseGroup: "Grupo Comunidade (WhatsApp)",
      mercadoPagoApostila1: "Mercado Pago – Apostila 1",
      mercadoPagoApostila2: "Mercado Pago – Apostila 2",
      mercadoPagoRepertorio: "Mercado Pago – Repertório",
      mercadoPagoComunidade: "Mercado Pago – Comunidade",
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
      ["Aula Presencial", "presencialOriginal", "presencialCurrent"],
      ["Aula Online", "onlineOriginal", "onlineCurrent"],
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

  function renderPhotos() {
    const rows = document.querySelector("[data-photos-rows]");
    if (!rows) return;
    const photos = readPhotos();
    rows.innerHTML = photoItems
      .map(([page, id, description, fallback]) => {
        const url = photos[id] || fallback;
        return `
      <tr data-photo-row="${id}">
        <td><strong>${page}</strong></td>
        <td><code>${id}</code></td>
        <td>${description}</td>
        <td>${inputCell(url, "url", 'data-field="photo-url"')}</td>
        <td><img class="admin-photo-preview" src="${String(url).replace(/"/g, "&quot;")}" alt="Preview de ${id}"></td>
        <td><button class="btn btn-primary admin-save-row" type="button">Salvar</button></td>
      </tr>`;
      })
      .join("");
  }

  function getVisibleBuyers() {
    const search = document.querySelector("[data-buyers-search]")?.value?.toLowerCase() || "";
    const filter = document.querySelector("[data-buyers-filter]")?.value || "";
    return buyersCache.filter((buyer) => {
      const haystack = `${buyer.nome || ""} ${buyer.email || ""} ${buyer.produto || ""}`.toLowerCase();
      return (!search || haystack.includes(search)) && (!filter || buyer.produto === filter);
    });
  }

  function renderBuyers() {
    const rows = document.querySelector("[data-buyers-rows]");
    const filter = document.querySelector("[data-buyers-filter]");
    if (!rows) return;

    const products = [...new Set(buyersCache.map((buyer) => buyer.produto).filter(Boolean))].sort();
    if (filter) {
      const current = filter.value;
      filter.innerHTML = '<option value="">Todos os produtos</option>' + products
        .map((product) => `<option value="${escapeHtml(product)}">${escapeHtml(product)}</option>`)
        .join("");
      filter.value = current;
    }

    const buyers = getVisibleBuyers();
    rows.innerHTML = buyers.length
      ? buyers.map((buyer) => `
        <tr>
          <td>${escapeHtml(buyer.nome)}</td>
          <td>${escapeHtml(buyer.email)}</td>
          <td>${escapeHtml(buyer.produto)}</td>
          <td>${buyer.data_compra ? new Date(buyer.data_compra).toLocaleString("pt-BR") : ""}</td>
        </tr>`).join("")
      : '<tr><td colspan="4">Nenhum comprador encontrado.</td></tr>';
  }

  async function loadBuyers() {
    const message = document.querySelector("[data-buyers-message]");
    if (message) message.textContent = "Carregando compradores...";
    try {
      const token = localStorage.getItem("fermata_admin_api_token") || "";
      const response = await fetch("/api/customer", {
        headers: token ? { "x-admin-token": token } : {},
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível carregar compradores.");
      buyersCache = payload.customers || [];
      if (message) message.textContent = "";
      renderBuyers();
    } catch (error) {
      if (message) message.textContent = `${error.message} Se a API exigir token, salve-o no localStorage como fermata_admin_api_token.`;
      buyersCache = [];
      renderBuyers();
    }
  }

  function exportBuyersCsv() {
    const header = ["Nome", "Email", "Produto", "Data"];
    const lines = getVisibleBuyers().map((buyer) => [
      buyer.nome,
      buyer.email,
      buyer.produto,
      buyer.data_compra,
    ]);
    const csv = [header, ...lines]
      .map((line) => line.map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "compradores-fermata.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function renderPanel() {
    const data = readData();
    renderProducts(data);
    renderLinks(data);
    renderPrices(data);
    renderPhotos();
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
      if (tab.dataset.adminTab === "buyers") loadBuyers();
    }

    const rowButton = event.target.closest(".admin-save-row");
    if (rowButton) {
      const data = readData();
      const productRow = rowButton.closest("[data-product-row]");
      const linkRow = rowButton.closest("[data-link-row]");
      const priceRow = rowButton.closest("[data-price-row]");
      const photoRow = rowButton.closest("[data-photo-row]");

      if (productRow) {
        const product = (data.products || []).find(
          (item) => item.id === productRow.dataset.productRow
        );
        if (product) {
          product.description =
            productRow.querySelector('[data-field="description"]')?.value || "";
          product.name = productRow.querySelector('[data-field="name"]')?.value || product.name;
          product.active = productRow.querySelector('[data-field="active"]')?.value !== "false";
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

      if (photoRow) {
        const photos = readPhotos();
        photos[photoRow.dataset.photoRow] =
          photoRow.querySelector('[data-field="photo-url"]')?.value || "";
        writePhotos(photos);
        renderPhotos();
      }

      writeData(data);
      showToast("✓ Salvo com sucesso!");
    }

    if (event.target.closest("[data-buyers-refresh]")) loadBuyers();
    if (event.target.closest("[data-buyers-export]")) exportBuyersCsv();
  });

  document.querySelector("[data-buyers-search]")?.addEventListener("input", renderBuyers);
  document.querySelector("[data-buyers-filter]")?.addEventListener("change", renderBuyers);

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
