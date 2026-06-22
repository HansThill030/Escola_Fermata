// =============================================================
//  ESCOLA FERMATA — Conexão com Supabase
//  Carregar nas páginas de sucesso ANTES dos outros scripts
// =============================================================

const SUPABASE_URL  = "https://qrapksjsffhhuszcblch.supabase.co";
const SUPABASE_ANON = "sb_publishable_XLLerBlv-2b8kK2Pf9wVXg_6LBtWwXv";

(function loadSupabaseSDK(callback) {
  if (window.supabase) { callback(); return; }
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  script.onload = callback;
  document.head.appendChild(script);
})(function () {
  window._supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  console.log("[Fermata] Supabase conectado.");
});

window.FermataSubmitLead = async function ({ nome, email, produto }) {
  try {
    const client = window._supabaseClient;
    if (!client) throw new Error("Supabase não inicializado.");

    const { error } = await client.from("leads").insert([{
      nome,
      email,
      produto,
      criado_em: new Date().toISOString()
    }]);

    if (error) throw error;
    return { ok: true };
  } catch (err) {
    console.error("[Fermata] Erro ao salvar lead:", err.message);
    return { ok: false, error: err.message };
  }
};
