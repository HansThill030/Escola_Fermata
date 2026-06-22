(function () {
  const PRODUCT_FILES = {
    apostila1: "teoria-musical-aplicada.pdf",
    apostila2: "leitura-musical-violao.pdf",
    repertorio2026: "repertorio-2026.pdf",
  };

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
  }

  async function requestJson(url, options) {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
      ...options,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Falha na comunicação com o servidor.");
    return payload;
  }

  window.FermataProductFiles = PRODUCT_FILES;

  window.FermataValidateCustomer = function ({ nome, email }) {
    const cleanNome = String(nome || "").trim();
    const cleanEmail = String(email || "").trim();

    if (cleanNome.length < 3) {
      return { ok: false, error: "Informe seu nome completo." };
    }

    if (!isEmail(cleanEmail)) {
      return { ok: false, error: "Informe um e-mail válido." };
    }

    return { ok: true, nome: cleanNome, email: cleanEmail };
  };

  window.saveCustomer = async function ({ nome, email, produto }) {
    return requestJson("/api/customer", {
      method: "POST",
      body: JSON.stringify({ nome, email, produto }),
    });
  };

  window.generateDownloadLink = async function (filePath) {
    const result = await requestJson("/api/download", {
      method: "POST",
      body: JSON.stringify({ filePath }),
    });
    return result.url;
  };

  window.FermataSubmitLead = async function ({ nome, email, produto }) {
    try {
      const validation = window.FermataValidateCustomer({ nome, email });
      if (!validation.ok) return validation;

      await window.saveCustomer({
        nome: validation.nome,
        email: validation.email,
        produto,
      });

      return { ok: true };
    } catch (error) {
      console.error("[Fermata] Erro ao salvar comprador:", error);
      return { ok: false, error: error.message };
    }
  };
})();
