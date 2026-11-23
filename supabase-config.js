// ==========================================
// CONFIGURAÇÃO DO SUPABASE - SCHOOLCONTROL
// ==========================================

const SUPABASE_URL = "COLE_SUA_PROJECT_URL_AQUI";
const SUPABASE_ANON_KEY = "COLE_SUA_ANON_PUBLIC_KEY_AQUI";

window.supabaseAtivo = false;
window.supabaseClient = null;

try {
    if (
        window.supabase &&
        typeof window.supabase.createClient === "function" &&
        SUPABASE_URL.startsWith("https://") &&
        !SUPABASE_URL.includes("COLE_SUA") &&
        SUPABASE_ANON_KEY &&
        !SUPABASE_ANON_KEY.includes("COLE_SUA")
    ) {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.supabaseAtivo = true;
    }
} catch (erro) {
    console.error("Erro ao iniciar Supabase:", erro);
}
