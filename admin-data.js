(function () {
  const STORAGE_KEY = "fermata_admin_data";

  const defaults = {
    links: {
      whatsapp: "https://wa.me/5551983178582",
      hotmart: "https://go.hotmart.com/Y102299117M",
      community: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=5ac185c3e651463abb8e9b91d3245f56",
      postPurchaseGroup: "https://chat.whatsapp.com/HbzTYi3PQAmCL6zVW01rT6",
      mercadoPagoApostila1: "https://mpago.la/2xeRRwW",
      mercadoPagoApostila2: "https://mpago.la/2zFoJd9",
      mercadoPagoRepertorio: "https://mpago.la/2bAmtvH",
      mercadoPagoComunidade: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=5ac185c3e651463abb8e9b91d3245f56",
      instagram: "https://www.instagram.com/tiagodeviolao/",
      youtube: "https://www.youtube.com/@tiagodeviolao",
      email: "tiago.intermarques@gmail.com"
    },
    products: [
      {
        id: "repertorio",
        name: "Livro de Repertório",
        description: "Seleção de músicas para prática orientada, ideal para ampliar repertório e consolidar acordes, levadas e leitura de cifras.",
        link: "https://mpago.la/2bAmtvH",
        price: "R$19,90",
        active: true
      },
      {
        id: "apostila1",
        name: "Apostila 1: Teoria Musical Aplicada",
        description: "Aproximadamente 100 páginas com método visual, lógica musical e campo harmônico, sem necessidade de partitura ou tablatura.",
        link: "https://mpago.la/2xeRRwW",
        price: "R$49,90",
        active: true
      },
      {
        id: "apostila2",
        name: "Apostila 2: Métodos de Leitura Musical",
        description: "Guia prático focado em cifras, tablaturas e iniciação à partitura para organizar a leitura no instrumento.",
        link: "https://mpago.la/2zFoJd9",
        price: "R$69,90",
        active: true
      }
    ],
    prices: {
      courseOriginal: "R$297,00",
      courseCurrent: "R$197,00",
      communityOriginal: "R$97,00",
      communityCurrent: "R$47,00/mês",
      presencialOriginal: "R$400,00",
      presencialCurrent: "R$340,00",
      onlineOriginal: "R$340,00",
      onlineCurrent: "R$280,00",
      apostila1Original: "-",
      apostila1Current: "R$49,90",
      apostila2Original: "-",
      apostila2Current: "R$69,90",
      repertorioOriginal: "-",
      repertorioCurrent: "R$19,90"
    }
  };

  function readSavedData() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      console.warn("Não foi possível ler as configurações do admin.", error);
      return {};
    }
  }

  function mergeData(saved) {
    const links = { ...defaults.links, ...(saved.links || {}) };
    const prices = { ...defaults.prices, ...(saved.prices || {}) };
    const savedProducts = Array.isArray(saved.products) ? saved.products : [];
    const products = defaults.products.map((product) => ({
      ...product,
      ...(savedProducts.find((item) => item.id === product.id) || {})
    }));

    return { links, products, prices };
  }

  function setExternalAttributes(link) {
    const href = link.getAttribute("href") || "";
    if (/^https?:\/\//.test(href)) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener");
    }
  }

  function applyAdminData() {
    const data = mergeData(readSavedData());

    Object.entries(data.links).forEach(([key, value]) => {
      document.querySelectorAll(`a[data-link="${key}"]`).forEach((link) => {
        link.href = key === "email" ? `mailto:${value}` : value;
        setExternalAttributes(link);
      });

      document.querySelectorAll(`[data-link-text="${key}"]`).forEach((el) => {
        el.textContent = value;
      });
    });

    Object.entries(data.prices).forEach(([key, value]) => {
      document.querySelectorAll(`[data-price="${key}"]`).forEach((el) => {
        el.textContent = value;
      });
    });

    data.products.forEach((product) => {
      const linkKeys = {
        apostila1: "mercadoPagoApostila1",
        apostila2: "mercadoPagoApostila2",
        repertorio: "mercadoPagoRepertorio",
      };
      const productLink = data.links[linkKeys[product.id]] || product.link;

      document.querySelectorAll(`a[data-product="${product.id}"]`).forEach((link) => {
        link.href = productLink;
        setExternalAttributes(link);
      });

      document.querySelectorAll(`[data-product-card="${product.id}"]`).forEach((el) => {
        el.hidden = product.active === false;
      });

      document.querySelectorAll(`[data-product-name="${product.id}"]`).forEach((el) => {
        el.textContent = product.name;
      });

      document.querySelectorAll(`[data-product-price="${product.id}"]`).forEach((el) => {
        el.textContent = product.price;
      });

      document.querySelectorAll(`[data-product-description="${product.id}"]`).forEach((el) => {
        el.textContent = product.description;
      });
    });
  }

  window.FermataAdminDefaults = defaults;
  window.FermataAdminStorageKey = STORAGE_KEY;
  window.FermataGetAdminData = function () {
    return mergeData(readSavedData());
  };
  window.FermataApplyAdminData = applyAdminData;

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) applyAdminData();
  });

  applyAdminData();
})();
