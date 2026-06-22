const { createClient } = require("@supabase/supabase-js");

const ALLOWED_FILES = new Set([
  "teoria-musical-aplicada.pdf",
  "leitura-musical-violao.pdf",
  "repertorio-2026.pdf",
]);

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase não configurado nas variáveis de ambiente.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Método não permitido." });
  }

  try {
    const { filePath } = readBody(req);
    const cleanPath = String(filePath || "").trim();

    if (!ALLOWED_FILES.has(cleanPath)) {
      return res.status(400).json({ ok: false, error: "Arquivo inválido." });
    }

    const { data, error } = await getSupabase()
      .storage
      .from("materiais")
      .createSignedUrl(cleanPath, 60 * 10);

    if (error) throw error;
    return res.status(200).json({ ok: true, url: data.signedUrl });
  } catch (error) {
    console.error("[download]", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
};
