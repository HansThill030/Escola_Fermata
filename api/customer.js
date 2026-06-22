const { createClient } = require("@supabase/supabase-js");

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

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
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

  try {
    const supabase = getSupabase();

    if (req.method === "POST") {
      const { nome, email, produto } = readBody(req);
      const cleanNome = String(nome || "").trim();
      const cleanEmail = String(email || "").trim().toLowerCase();
      const cleanProduto = String(produto || "").trim();

      if (cleanNome.length < 3 || !isEmail(cleanEmail) || cleanProduto.length < 2) {
        return res.status(400).json({ ok: false, error: "Dados inválidos." });
      }

      const { error } = await supabase.from("clientes").insert({
        nome: cleanNome,
        email: cleanEmail,
        produto: cleanProduto,
        data_compra: new Date().toISOString(),
      });

      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    if (req.method === "GET") {
      const adminToken = process.env.ADMIN_API_TOKEN;
      const receivedToken = req.headers["x-admin-token"];

      if (adminToken && receivedToken !== adminToken) {
        return res.status(401).json({ ok: false, error: "Não autorizado." });
      }

      const { data, error } = await supabase
        .from("clientes")
        .select("id,nome,email,produto,data_compra")
        .order("data_compra", { ascending: false })
        .limit(500);

      if (error) throw error;
      return res.status(200).json({ ok: true, customers: data || [] });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Método não permitido." });
  } catch (error) {
    console.error("[customer]", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
};
