document.querySelectorAll("[data-success-form]").forEach((form) => {
  const button = form.querySelector("[type='submit']");
  const message = form.querySelector("[data-form-message]");
  const downloadLink = form.querySelector("[data-download-link]");

  function setMessage(text, isError) {
    if (!message) return;
    message.textContent = text || "";
    message.classList.toggle("is-error", Boolean(isError));
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const validation = window.FermataValidateCustomer({
      nome: form.nome.value,
      email: form.email.value,
    });

    if (!validation.ok) {
      setMessage(validation.error, true);
      return;
    }

    button.disabled = true;
    button.textContent = "Salvando...";
    setMessage("", false);

    const produto = form.dataset.productName || document.title;
    const lead = await window.FermataSubmitLead({
      nome: validation.nome,
      email: validation.email,
      produto,
    });

    if (!lead.ok) {
      button.disabled = false;
      button.textContent = "Confirmar e acessar meu produto";
      setMessage("Não foi possível confirmar seus dados. Tente novamente em alguns instantes.", true);
      return;
    }

    if (form.dataset.filePath && downloadLink) {
      button.textContent = "Gerando link...";
      try {
        downloadLink.href = await window.generateDownloadLink(form.dataset.filePath);
      } catch (error) {
        button.disabled = false;
        button.textContent = "Confirmar e acessar meu produto";
        setMessage("Não foi possível gerar o link de download. Fale com a Escola Fermata.", true);
        return;
      }
    }

    form.classList.add("is-confirmed");
    button.textContent = "Confirmado";
    setMessage("Acesso liberado. O link de download expira em 10 minutos.", false);
  });
});
