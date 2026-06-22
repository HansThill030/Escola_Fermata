// =============================================================
//  ESCOLA FERMATA - Conexão com Supabase
//  Carregar nas páginas de sucesso ANTES dos outros scripts.
// =============================================================

const SUPABASE_URL = "https://qrapksjsffhhuszcblch.supabase.co";
const SUPABASE_ANON = "sb_publishable_XLLerBlv-2b8kK2Pf9wVXg_6LBtWwXv";

window.FermataSupabaseReady = new Promise((resolve, reject) => {
  function createClient() {
    try {
      window._supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
      console.log("[Fermata] Supabase conectado.");
      resolve(window._supabaseClient);
    } catch (error) {
      reject(error);
    }
  }

  if (window.supabase) {
    createClient();
    return;
  }

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  script.onload = createClient;
  script.onerror = () => reject(new Error("Não foi possível carregar o SDK do Supabase."));
  document.head.appendChild(script);
});

window.FermataSubmitLead = async function ({ nome, email, produto }) {
  try {
    const client = await window.FermataSupabaseReady;

    const { error } = await client.from("leads").insert([
      {
        nome,
        email,
        produto,
        criado_em: new Date().toISOString(),
      },
    ]);

    if (error) throw error;
    return { ok: true };
  } catch (err) {
    console.error("[Fermata] Erro ao salvar lead:", err.message);
    return { ok: false, error: err.message };
  }
};
