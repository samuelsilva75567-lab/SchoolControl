// ==========================================
// CONFIGURAÇÃO DO SUPABASE - SCHOOLCONTROL
// ==========================================

const SUPABASE_URL = "https://iggfiramjxmfehunnmzd.supabase.co";
const SUPABASE_ANON_KEY = "COLE_A_CHAVE_PUBLICA_AQUI";

window.supabaseAtivo = false;
window.supabaseClient = null;

try {
    if (
        window.supabase &&
        typeof window.supabase.createClient === "function" &&
        SUPABASE_URL.startsWith("https://") &&
        SUPABASE_ANON_KEY &&
        !SUPABASE_ANON_KEY.includes("COLE_A_CHAVE")
    ) {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseAtivo = true;
    }
} catch (erro) {
    console.error("Erro ao iniciar Supabase:", erro);
}