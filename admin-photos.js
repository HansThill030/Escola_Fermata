(function () {
  const STORAGE_KEY = "fermata_admin_photos";

  function readPhotos() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      console.warn("Não foi possível ler as fotos do admin.", error);
      return {};
    }
  }

  function applyPhotos() {
    const photos = readPhotos();

    document.querySelectorAll("[data-photo]").forEach((image) => {
      const url = photos[image.dataset.photo];
      if (url) image.src = url;
    });
  }

  window.FermataPhotosStorageKey = STORAGE_KEY;
  window.FermataGetAdminPhotos = readPhotos;
  window.FermataApplyAdminPhotos = applyPhotos;

  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) applyPhotos();
  });

  applyPhotos();
})();
